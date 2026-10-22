import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import type { IDetectionAlert } from "shared/models/detection-alerts.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { configureDetectionRule, listDetectionRules, qualifyDetectionAlert } from "./detection-cli"
import { assertValidRules, EVALUATION_FAILURE_KEY, getSlotStart, reconcileFindings, resolveRuleSettings, runDetectionRules } from "./detection-engine"
import { assertNoEmailInFinding } from "./detection-notification"
import type { IDetectionFinding, IDetectionRule } from "./detection-rule"
import { detectionRules } from "./detection-rules"

vi.mock("@/common/utils/slack-utils")
vi.mock("@/common/utils/sentry-utils")

const HOUR_MS = 60 * 60 * 1000

const finding = (key: string, count = 12): IDetectionFinding => ({ key, metrics: { count }, summary: `${count} éléments` })

const alertFixture = (overrides: Partial<IDetectionAlert>): IDetectionAlert => ({
  _id: new ObjectId(),
  rule_id: "regle_factice",
  key: "global",
  severity: "haute",
  status: "ouverte",
  hits: 1,
  first_seen_at: new Date("2026-10-20T08:00:00Z"),
  last_seen_at: new Date("2026-10-20T08:00:00Z"),
  opened_at: new Date("2026-10-20T08:00:00Z"),
  last_notified_at: new Date("2026-10-20T08:00:00Z"),
  notification_count: 1,
  closed_at: null,
  opening_metrics: { count: 12 },
  last_metrics: { count: 12 },
  summary: "12 éléments",
  qualification: null,
  ...overrides,
})

const thresholdsSchema = z.strictObject({ minCount: z.number().int().positive().default(10) })

const buildRule = (overrides: Partial<IDetectionRule<z.output<typeof thresholdsSchema>>> = {}) => {
  const counts = new Map<string, number>()
  const evaluate = vi.fn(async ({ thresholds }: { thresholds: z.output<typeof thresholdsSchema> }) => ({
    findings: [...counts]
      .filter(([, count]) => count >= thresholds.minCount)
      .map(([key, count]) => ({
        ...finding(key, count),
        links: [{ label: "back-office", url: "https://labonnealternance.apprentissage.beta.gouv.fr/espace-pro/administration" }],
      })),
    observations: { total: [...counts.values()].reduce((sum, count) => sum + count, 0) },
  }))
  const rule: IDetectionRule<z.output<typeof thresholdsSchema>> = {
    id: "regle_factice",
    title: "Règle factice",
    severity: "haute",
    periodicity: { everyMinutes: 60 },
    enabledByDefault: true,
    thresholds: thresholdsSchema,
    confirmations: 1,
    reminderEveryHours: 24,
    evaluate,
    ...overrides,
  }
  return { rule, counts, evaluate }
}

describe("getSlotStart", () => {
  it("aligne une règle quotidienne sur son heure UTC, y compris juste avant le créneau", () => {
    const daily = { everyMinutes: 24 * 60, offsetMinutes: 5 * 60 }
    expect(getSlotStart(daily, new Date("2026-10-22T05:00:00Z"))).toEqual(new Date("2026-10-22T05:00:00Z"))
    expect(getSlotStart(daily, new Date("2026-10-22T04:59:59Z"))).toEqual(new Date("2026-10-21T05:00:00Z"))
    expect(getSlotStart(daily, new Date("2026-10-22T23:00:00Z"))).toEqual(new Date("2026-10-22T05:00:00Z"))
  })

  it("aligne une règle au quart d'heure", () => {
    expect(getSlotStart({ everyMinutes: 15 }, new Date("2026-10-22T10:44:59Z"))).toEqual(new Date("2026-10-22T10:30:00Z"))
  })
})

describe("assertValidRules", () => {
  it("accepte les règles livrées", () => {
    expect(() => assertValidRules(detectionRules)).not.toThrow()
  })

  it.each([
    ["une périodicité hors de la cadence du cron", { periodicity: { everyMinutes: 20 } }],
    ["un décalage hors de la cadence du cron", { periodicity: { everyMinutes: 60, offsetMinutes: 5 } }],
    ["aucune confirmation", { confirmations: 0 }],
    ["des seuils par défaut invalides", { thresholds: z.strictObject({ minCount: z.number() }) }],
  ])("refuse %s", (_, overrides) => {
    expect(() => assertValidRules([buildRule(overrides as Partial<IDetectionRule>).rule])).toThrow()
  })

  it("refuse deux règles de même identifiant", () => {
    expect(() => assertValidRules([buildRule().rule, buildRule().rule])).toThrow("en double : regle_factice")
  })
})

describe("resolveRuleSettings", () => {
  const { rule } = buildRule()

  it("prend les valeurs du code sans surcharge", () => {
    expect(resolveRuleSettings(rule, null)).toEqual({ enabled: true, thresholds: { minCount: 10 } })
  })

  it("applique la surcharge en base", () => {
    expect(resolveRuleSettings(rule, { enabled: false, thresholds: { minCount: 50 } })).toEqual({ enabled: false, thresholds: { minCount: 50 } })
  })

  it("refuse une surcharge que le schéma ne connaît pas, plutôt que de l'ignorer", () => {
    expect(() => resolveRuleSettings(rule, { enabled: null, thresholds: { minCont: 50 } })).toThrow()
  })
})

describe("reconcileFindings", () => {
  const now = new Date("2026-10-22T08:00:00Z")
  const reconcile = (findings: IDetectionFinding[], activeAlerts: IDetectionAlert[], confirmations = 1) =>
    reconcileFindings({ findings, activeAlerts, confirmations, reminderEveryHours: 24, now }).map(({ type }) => type)

  it("n'alerte pas sur un constat isolé quand la règle exige deux constats consécutifs", () => {
    expect(reconcile([finding("global")], [], 2)).toEqual(["en_attente"])
  })

  it("abandonne sans notifier un constat non confirmé qui disparaît", () => {
    expect(reconcile([], [alertFixture({ status: "en_attente", opened_at: null, last_notified_at: null })], 2)).toEqual(["abandon"])
  })

  it("ne confirme pas deux fois le même créneau, quand l'évaluation est reprise après un échec", () => {
    const pending = alertFixture({ status: "en_attente", opened_at: null, last_notified_at: null, hits: 1, last_seen_at: now })
    expect(reconcile([finding("global")], [pending], 2)).toEqual(["en_attente"])
  })

  it("entre en alerte au constat qui atteint le nombre de confirmations", () => {
    const pending = alertFixture({ status: "en_attente", opened_at: null, last_notified_at: null, hits: 1, last_seen_at: new Date(now.getTime() - HOUR_MS) })
    expect(reconcile([finding("global")], [pending], 2)).toEqual(["entree"])
  })

  it("ne renotifie pas une alerte ouverte avant l'intervalle de rappel", () => {
    const open = alertFixture({ last_notified_at: new Date(now.getTime() - 24 * HOUR_MS + 1) })
    expect(reconcile([finding("global")], [open])).toEqual(["maintien"])
  })

  it("rappelle une alerte ouverte à l'intervalle de rappel", () => {
    const open = alertFixture({ last_notified_at: new Date(now.getTime() - 24 * HOUR_MS) })
    expect(reconcile([finding("global")], [open])).toEqual(["rappel"])
  })

  it("sort d'alerte quand le constat disparaît, objet par objet", () => {
    const open = [alertFixture({ key: "a" }), alertFixture({ key: "b", last_notified_at: now })]
    expect(reconcile([finding("b"), finding("c")], open)).toEqual(["maintien", "entree", "sortie"])
  })
})

describe("assertNoEmailInFinding", () => {
  it.each([
    ["une mention Slack", { summary: "cc <@U04ABCDEF>" }],
    ["une arobase dans un chemin d'URL", { links: [{ label: "profil", url: "https://exemple.fr/@lba" }] }],
    ["une arobase isolée", { summary: "3 @ 50 rôles" }],
  ])("laisse passer %s", (_, overrides) => {
    expect(() => assertNoEmailInFinding("regle_factice", { ...finding("global"), ...overrides })).not.toThrow()
  })

  it.each([
    ["la clé", { key: "contact@entreprise.fr" }],
    ["la phrase", { summary: "compte de prenom.nom@entreprise.fr" }],
    ["une métrique", { metrics: { domaine: "x", contact: "rh@entreprise.com" } }],
    ["un lien", { links: [{ label: "fiche", url: "https://exemple.fr/?email=rh@entreprise.com" }] }],
  ])("écarte un constat qui porte une adresse email dans %s, sans la recopier dans l'erreur", (_, overrides) => {
    const check = () => assertNoEmailInFinding("regle_factice", { ...finding("global"), ...overrides })
    expect(check).toThrow("adresse email détectée")
    expect(check).not.toThrow(/entreprise\.(fr|com)/)
  })
})

describe("runDetectionRules", () => {
  useMongo()

  const at = (iso: string) => new Date(iso)
  const messages = () => vi.mocked(notifyToSlack).mock.calls.map(([{ message }]) => message)
  const alerts = () => getDbCollection("detection_alerts").find({}).sort({ first_seen_at: 1 }).toArray()

  beforeEach(() => {
    vi.mocked(notifyToSlack).mockReset()
  })

  it("notifie l'entrée, ne répète pas l'alerte, rappelle puis notifie la sortie", async () => {
    const { rule, counts, evaluate } = buildRule()
    counts.set("global", 12)

    await runDetectionRules({ rules: [rule], now: at("2026-10-22T08:05:00Z") })
    const [opened] = await alerts()
    expect(opened).toMatchObject({ status: "ouverte", opened_at: at("2026-10-22T08:00:00Z"), opening_metrics: { count: 12 }, notification_count: 1 })
    expect(messages()).toEqual([
      [
        "Entrée en alerte · Règle factice (gravité haute)",
        "12 éléments",
        "<https://labonnealternance.apprentissage.beta.gouv.fr/espace-pro/administration|back-office>",
        `\`regle_factice\` · \`global\` · alerte \`${opened?._id}\``,
      ].join("\n"),
    ])

    const sameSlot = await runDetectionRules({ rules: [rule], now: at("2026-10-22T08:50:00Z") })
    expect(sameSlot).toMatchObject([{ status: "deja_evaluee" }])
    expect(evaluate).toHaveBeenCalledTimes(1)

    await runDetectionRules({ rules: [rule], now: at("2026-10-22T09:05:00Z") })
    expect(notifyToSlack).toHaveBeenCalledTimes(1)

    await runDetectionRules({ rules: [rule], now: at("2026-10-23T08:05:00Z") })
    expect(messages()[1]).toContain("Rappel · Règle factice (gravité haute) · en alerte depuis le 22/10/2026 (24 h)")

    counts.set("global", 5)
    await runDetectionRules({ rules: [rule], now: at("2026-10-23T09:05:00Z") })
    expect(messages()[2]).toContain("Sortie d'alerte · Règle factice (gravité haute) · après 25 h\nDernier constat : 12 éléments")
    expect(await alerts()).toMatchObject([{ status: "fermee", closed_at: at("2026-10-23T09:00:00Z"), notification_count: 3 }])
    expect(vi.mocked(notifyToSlack).mock.calls.map(([{ error }]) => error)).toEqual([true, true, false])
  })

  it("n'alerte qu'au second constat consécutif, et abandonne en silence un constat isolé", async () => {
    const { rule, counts } = buildRule({ confirmations: 2 })
    counts.set("isole", 12)
    await runDetectionRules({ rules: [rule], now: at("2026-10-22T08:05:00Z") })
    expect(await alerts()).toMatchObject([{ key: "isole", status: "en_attente", opened_at: null }])

    counts.delete("isole")
    counts.set("durable", 12)
    await runDetectionRules({ rules: [rule], now: at("2026-10-22T09:05:00Z") })
    await runDetectionRules({ rules: [rule], now: at("2026-10-22T10:05:00Z") })

    expect(await alerts()).toMatchObject([{ key: "durable", status: "ouverte", hits: 2, first_seen_at: at("2026-10-22T09:00:00Z") }])
    expect(notifyToSlack).toHaveBeenCalledTimes(1)
  })

  it("ne notifie qu'une fois quand deux exécutions évaluent le même créneau en parallèle", async () => {
    const { rule, counts } = buildRule()
    counts.set("global", 12)

    const reports = await Promise.all([
      runDetectionRules({ rules: [rule], now: at("2026-10-22T08:05:00Z") }),
      runDetectionRules({ rules: [rule], now: at("2026-10-22T08:06:00Z") }),
    ])

    expect(
      reports
        .flat()
        .map(({ status }) => status)
        .sort()
    ).toEqual(["deja_evaluee", "evaluee"])
    expect(notifyToSlack).toHaveBeenCalledTimes(1)
    expect(await alerts()).toHaveLength(1)
  })

  it("évalue sans rien écrire ni notifier en dry run", async () => {
    const { rule, counts } = buildRule()
    counts.set("global", 12)

    const [report] = await runDetectionRules({ rules: [rule], now: at("2026-10-22T08:05:00Z"), dryRun: true })

    expect(report).toMatchObject({ status: "evaluee", observations: { total: 12 }, transitions: [{ type: "entree", key: "global", metrics: { count: 12 } }] })
    expect(notifyToSlack).not.toHaveBeenCalled()
    expect(await getDbCollection("detection_rules").countDocuments()).toBe(0)
    expect(await alerts()).toHaveLength(0)
  })

  it("continue les autres règles quand une règle échoue, signale l'échec une fois et réessaie au passage suivant du cron", async () => {
    const { rule: failing, evaluate: failingEvaluate } = buildRule({ id: "regle_en_echec", title: "Règle en échec" })
    failingEvaluate.mockRejectedValue(new Error("délai dépassé sur https://hooks.slack.com/services/SECRET"))
    const { rule: healthy, counts } = buildRule({ id: "regle_saine", title: "Règle saine" })
    counts.set("global", 12)
    const rules = [failing, healthy]

    await expect(runDetectionRules({ rules, now: at("2026-10-22T08:05:00Z") })).rejects.toThrow("règles de détection en échec : regle_en_echec")
    expect(messages()).toHaveLength(2)
    expect(messages()[0]).toContain("Entrée en alerte · Évaluation de « Règle en échec » (incident technique)\nÉvaluation impossible (Error)")
    expect(messages().join("\n")).not.toContain("SECRET")
    expect(messages()[1]).toContain("Entrée en alerte · Règle saine")

    await expect(runDetectionRules({ rules, now: at("2026-10-22T08:20:00Z") })).rejects.toThrow()
    expect(failingEvaluate).toHaveBeenCalledTimes(2)
    expect(messages()).toHaveLength(2)

    failingEvaluate.mockResolvedValue({ findings: [], observations: { total: 0 } })
    await runDetectionRules({ rules, now: at("2026-10-22T08:35:00Z") })
    expect(messages()[2]).toContain("Sortie d'alerte · Évaluation de « Règle en échec » (incident technique)")
    expect(await getDbCollection("detection_alerts").findOne({ key: EVALUATION_FAILURE_KEY })).toMatchObject({ rule_id: "regle_en_echec", status: "fermee" })
  })

  it("retente une entrée en alerte dont la notification a échoué, sans la marquer notifiée", async () => {
    const { rule, counts } = buildRule()
    counts.set("global", 12)
    vi.mocked(notifyToSlack).mockRejectedValueOnce(new Error("Slack indisponible"))

    await expect(runDetectionRules({ rules: [rule], now: at("2026-10-22T08:05:00Z") })).rejects.toThrow()
    expect(await getDbCollection("detection_alerts").findOne({ key: "global" })).toBeNull()

    await runDetectionRules({ rules: [rule], now: at("2026-10-22T08:20:00Z") })
    expect(await getDbCollection("detection_alerts").findOne({ key: "global" })).toMatchObject({ status: "ouverte" })
    expect(messages().filter((message) => message.startsWith("Entrée en alerte · Règle factice"))).toHaveLength(2)
  })

  it("écarte un constat qui porte une adresse email, sans l'écrire ni l'envoyer", async () => {
    const { rule } = buildRule({ evaluate: async () => ({ findings: [{ key: "global", metrics: {}, summary: "compte rh@entreprise.fr" }] }) })

    await expect(runDetectionRules({ rules: [rule], now: at("2026-10-22T08:05:00Z") })).rejects.toThrow()

    expect(await getDbCollection("detection_alerts").findOne({ key: "global" })).toBeNull()
    expect(messages().join("\n")).not.toContain("entreprise.fr")
  })

  it("garantit un seul épisode actif par objet", async () => {
    const insert = (status: IDetectionAlert["status"]) => getDbCollection("detection_alerts").insertOne(alertFixture({ status }))
    await insert("fermee")
    await insert("fermee")
    await insert("ouverte")

    await expect(insert("en_attente")).rejects.toThrow("E11000")
  })

  describe("réglages sans redéploiement", () => {
    it("désactive une règle à l'exécution suivante", async () => {
      const { rule, counts, evaluate } = buildRule()
      counts.set("global", 12)

      await configureDetectionRule({ rule: rule.id, enabled: "false", rules: [rule] })
      const [report] = await runDetectionRules({ rules: [rule], now: at("2026-10-22T08:05:00Z") })

      expect(report).toMatchObject({ status: "desactivee" })
      expect(evaluate).not.toHaveBeenCalled()
    })

    it("surcharge un seuil, complète la surcharge existante et revient aux valeurs du code", async () => {
      const { rule, counts } = buildRule()
      counts.set("global", 12)

      await configureDetectionRule({ rule: rule.id, thresholds: '{"minCount":20}', rules: [rule] })
      await configureDetectionRule({ rule: rule.id, enabled: "true", rules: [rule] })
      const [listed] = await listDetectionRules({ rules: [rule] })
      expect(listed).toMatchObject({ enabled: true, thresholds: { minCount: 20 }, overrides: { enabled: true, thresholds: { minCount: 20 } } })
      await runDetectionRules({ rules: [rule], now: at("2026-10-22T08:05:00Z") })
      expect(notifyToSlack).not.toHaveBeenCalled()

      await configureDetectionRule({ rule: rule.id, reset: true, rules: [rule] })
      await runDetectionRules({ rules: [rule], now: at("2026-10-22T09:05:00Z") })
      expect(notifyToSlack).toHaveBeenCalledTimes(1)
    })

    it.each([
      ["un seuil mal orthographié", { thresholds: '{"minCont":20}' }],
      ["un seuil du mauvais type", { thresholds: '{"minCount":"vingt"}' }],
      ["un tableau", { thresholds: "[20]" }],
      ["une activation ambiguë", { enabled: "oui" }],
      ["aucun réglage", {}],
    ])("refuse %s sans rien écrire", async (_, payload) => {
      const { rule } = buildRule()
      await expect(configureDetectionRule({ rule: rule.id, rules: [rule], ...payload })).rejects.toThrow()
      expect(await getDbCollection("detection_rules").countDocuments()).toBe(0)
    })

    it("fait échouer la règle, de façon visible, sur une surcharge invalide écrite à la main", async () => {
      const { rule } = buildRule()
      await getDbCollection("detection_rules").insertOne({
        _id: new ObjectId(),
        rule_id: rule.id,
        enabled: null,
        thresholds: { minCount: "dix" },
        updated_at: null,
        last_slot_at: null,
      })

      await expect(runDetectionRules({ rules: [rule], now: at("2026-10-22T08:05:00Z") })).rejects.toThrow()
      expect(messages()[0]).toContain("Évaluation impossible (ZodError)")
    })
  })

  describe("qualifyDetectionAlert", () => {
    it("qualifie un épisode notifié", async () => {
      const { insertedId } = await getDbCollection("detection_alerts").insertOne(alertFixture({ status: "fermee" }))

      await qualifyDetectionAlert({ id: insertedId.toString(), verdict: "faux_positif" })

      expect(await getDbCollection("detection_alerts").findOne({ _id: insertedId })).toMatchObject({ qualification: { verdict: "faux_positif" } })
    })

    it("refuse un épisode jamais notifié et un verdict inconnu", async () => {
      const { insertedId } = await getDbCollection("detection_alerts").insertOne(alertFixture({ status: "en_attente", opened_at: null, last_notified_at: null }))

      await expect(qualifyDetectionAlert({ id: insertedId.toString(), verdict: "vrai_positif" })).rejects.toThrow("jamais notifiée")
      await expect(qualifyDetectionAlert({ id: insertedId.toString(), verdict: "peut-être" })).rejects.toThrow("--verdict")
    })
  })
})
