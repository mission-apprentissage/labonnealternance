import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { generateRoleManagementFixture, generateRoleManagementStatusEventFixture } from "shared/fixtures/role-management.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/user-with-account.fixture"
import type { IRoleManagement } from "shared/models/role-management.model"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import type { IUserWithAccount } from "shared/models/user-with-account.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import config from "@/config"
import { assertValidEvaluation, nextAlertState, runDetectionRules } from "@/jobs/detection/detection-engine"
import { formatDetectionNotification } from "@/jobs/detection/detection-notification"
import { replayDetectionRule } from "@/jobs/detection/detection-replay"
import { API_KEY_CREATION_REASON } from "@/services/auto-validation-reasons"
import type { IDomainCreations } from "./account-creation-domain-alert"
import { accountCreationDomainSpikeRule, buildDomainFinding, creationsByDomainPipeline, domainKind, evaluateDomainSpike, getCreationWindows } from "./account-creation-domain-alert"

vi.mock("@/common/utils/slack-utils")
vi.mock("@/common/utils/sentry-utils")

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

const rule = accountCreationDomainSpikeRule
const defaults = rule.thresholds.parse({})

// Webmail à fort volume habituel, et webmail de la liste sans volume habituel.
const WEBMAIL_COURANT = "gmail.com"
const WEBMAIL_RARE = "zzn.com"
const DOMAINE_ENTREPRISE = "entreprise.exemple.fr"

const accounts = (count: number) => Array.from({ length: count }, () => new ObjectId())

const messages = () => vi.mocked(notifyToSlack).mock.calls.map(([{ message }]) => message)

describe("domainKind", () => {
  it.each([
    [WEBMAIL_COURANT, "webmail"],
    [WEBMAIL_RARE, "webmail"],
    ["0815.ru", "webmail"],
    [DOMAINE_ENTREPRISE, "entreprise"],
    ["orange.com", "entreprise"],
  ])("classe %s en %s, comme BAL", (domain, kind) => {
    expect(domainKind(domain)).toBe(kind)
  })
})

describe("evaluateDomainSpike", () => {
  const totals = { windowAccounts: 120, baselineAccounts: 1000 }

  it("(faux positif) n'alerte pas sur un webmail à fort volume qui garde sa part, même quand la rentrée multiplie les créations", () => {
    // 28 % des comptes de la référence, 28 % de ceux de la fenêtre : 140 comptes, bien au-dessus du seuil absolu.
    const evaluation = evaluateDomainSpike({ domain: WEBMAIL_COURANT, accountIds: accounts(140), baselineAccounts: 280 }, { windowAccounts: 500, baselineAccounts: 1000 }, defaults)
    expect(evaluation).toMatchObject({ kind: "webmail", accounts: 140, expected: 140, alert: false })
  })

  it("(faux positif) n'alerte pas sous le seuil absolu, même sur un domaine sans historique", () => {
    expect(evaluateDomainSpike({ domain: DOMAINE_ENTREPRISE, accountIds: accounts(9), baselineAccounts: 0 }, totals, defaults).alert).toBe(false)
    expect(evaluateDomainSpike({ domain: DOMAINE_ENTREPRISE, accountIds: accounts(10), baselineAccounts: 0 }, totals, defaults).alert).toBe(true)
  })

  it("(faux positif) n'alerte pas sous le multiple du volume attendu, frontière comprise", () => {
    // 20 comptes sur 1 000 en référence, 300 dans la fenêtre : 6 attendus, alerte à partir de 18.
    const domain = (count: number) => ({ domain: DOMAINE_ENTREPRISE, accountIds: accounts(count), baselineAccounts: 20 })
    const busyWindow = { windowAccounts: 300, baselineAccounts: 1000 }
    expect(evaluateDomainSpike(domain(17), busyWindow, defaults)).toMatchObject({ expected: 6, alert: false })
    expect(evaluateDomainSpike(domain(18), busyWindow, defaults)).toMatchObject({ expected: 6, alert: true })
  })

  // 1,8 × 8,33… vaut 15,000000000000002 en virgule flottante : 15 comptes atteignent pourtant le multiple.
  it("alerte pile au multiple quand la virgule flottante le place au-dessus", () => {
    const thresholds = rule.thresholds.parse({ companySpikeRatio: 1.8 })
    expect(evaluateDomainSpike({ domain: DOMAINE_ENTREPRISE, accountIds: accounts(15), baselineAccounts: 5 }, { windowAccounts: 50, baselineAccounts: 30 }, thresholds).alert).toBe(
      true
    )
  })

  it("applique aux webmails leur propre seuil", () => {
    const thresholds = rule.thresholds.parse({ webmailMinAccounts: 20 })
    expect(evaluateDomainSpike({ domain: WEBMAIL_RARE, accountIds: accounts(15), baselineAccounts: 0 }, totals, thresholds).alert).toBe(false)
    expect(evaluateDomainSpike({ domain: DOMAINE_ENTREPRISE, accountIds: accounts(15), baselineAccounts: 0 }, totals, thresholds).alert).toBe(true)
  })

  it("applique aux webmails leur propre multiple", () => {
    const thresholds = rule.thresholds.parse({ webmailSpikeRatio: 5 })
    // 20 comptes sur 1 000 en référence, 300 dans la fenêtre : 6 attendus, 24 comptes en font 4 fois plus.
    const busyWindow = { windowAccounts: 300, baselineAccounts: 1000 }
    expect(evaluateDomainSpike({ domain: WEBMAIL_RARE, accountIds: accounts(24), baselineAccounts: 20 }, busyWindow, thresholds).alert).toBe(false)
    expect(evaluateDomainSpike({ domain: DOMAINE_ENTREPRISE, accountIds: accounts(24), baselineAccounts: 20 }, busyWindow, thresholds).alert).toBe(true)
  })

  // cf. docs/detection.md : avec le multiple 3, un pic de P comptes passe inaperçu au-delà d'une part habituelle de P / (2W + 3P).
  it("(limite) laisse passer un pic de 25 comptes sur un webmail qui pèse plus de 9 % des créations, pour 100 comptes hors pic", () => {
    const withSpike = { windowAccounts: 100 + 25, baselineAccounts: 1000 }
    expect(evaluateDomainSpike({ domain: WEBMAIL_COURANT, accountIds: accounts(10 + 25), baselineAccounts: 100 }, withSpike, defaults)).toMatchObject({
      expected: 12.5,
      alert: false,
    })
    expect(evaluateDomainSpike({ domain: WEBMAIL_COURANT, accountIds: accounts(8 + 25), baselineAccounts: 80 }, withSpike, defaults)).toMatchObject({
      expected: 10,
      alert: true,
    })
  })

  it("alerte sur 25 comptes en 3 jours sur un webmail peu utilisé", () => {
    expect(evaluateDomainSpike({ domain: WEBMAIL_RARE, accountIds: accounts(25), baselineAccounts: 1 }, totals, defaults)).toMatchObject({
      kind: "webmail",
      accounts: 25,
      expected: 0.12,
      alert: true,
    })
  })
})

describe("constat d'un pic de créations", () => {
  const creations = (domain: string): IDomainCreations => ({
    domain,
    accountIds: accounts(12),
    baselineAccounts: 0,
    entrepriseRoles: 12,
    cfaRoles: 0,
    grantedRoles: 12,
    awaitingRoles: 0,
    deniedRoles: 0,
    autoValidatedRoles: 12,
    firstCreatedAt: new Date("2026-10-05T08:00:00Z"),
    lastCreatedAt: new Date("2026-10-06T08:00:00Z"),
  })
  const findingFor = (domain: string) => {
    const evaluated = creations(domain)
    return buildDomainFinding(evaluated, evaluateDomainSpike(evaluated, { windowAccounts: 100, baselineAccounts: 1000 }, defaults), defaults)
  }

  it("passe le garde-fou du socle quand il ne porte que le domaine", () => {
    expect(() => assertValidEvaluation(rule, { findings: [findingFor(WEBMAIL_RARE)] })).not.toThrow()
  })

  it("(faux positif) est écarté par le socle si une adresse prenait la place du domaine", () => {
    expect(() => assertValidEvaluation(rule, { findings: [findingFor(`recrutement@${WEBMAIL_RARE}`)] })).toThrow("adresse email détectée")
  })

  it("plafonne les identifiants cités et les liens, la liste complète restant dans les métriques", () => {
    const many = { ...creations(WEBMAIL_RARE), accountIds: accounts(45) }
    const finding = buildDomainFinding(many, evaluateDomainSpike(many, { windowAccounts: 100, baselineAccounts: 1000 }, defaults), defaults)

    expect(finding.summary).toContain(`${many.accountIds[29].toHexString()} et 15 autres`)
    expect(finding.summary).not.toContain(many.accountIds[30].toHexString())
    expect(finding.links).toHaveLength(10)
    expect(finding.links?.[0]).toEqual({
      label: `compte ${many.accountIds[0].toHexString()}`,
      url: `${config.publicUrl}/espace-pro/administration/users/${many.accountIds[0].toHexString()}`,
    })
    expect(String(finding.metrics.comptes_ids).split(",")).toHaveLength(45)
  })

  it("écrit le volume attendu en décimal français dans le message, en nombre dans les métriques", () => {
    const evaluated = { ...creations(WEBMAIL_RARE), baselineAccounts: 1 }
    const finding = buildDomainFinding(evaluated, evaluateDomainSpike(evaluated, { windowAccounts: 100, baselineAccounts: 1000 }, defaults), defaults)

    expect(finding.summary).toContain("pour 0,1 attendus")
    expect(finding.metrics.comptes_attendus).toBe(0.1)
  })

  // Slack coupe l'affichage vers 4 000 caractères ; notifyToSlack préfixe le message d'une cinquantaine de caractères.
  it("tient sous la coupure Slack au pire cas : rappel, domaine de 253 caractères, 500 comptes, URL de production", () => {
    const publicUrl = config.publicUrl
    config.publicUrl = "https://labonnealternance.apprentissage.beta.gouv.fr"
    try {
      const domain = `${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(58)}.fr`
      const worst: IDomainCreations = {
        ...creations(domain),
        accountIds: accounts(500),
        baselineAccounts: 12_345,
        entrepriseRoles: 400,
        cfaRoles: 100,
        grantedRoles: 300,
        awaitingRoles: 150,
        deniedRoles: 50,
        autoValidatedRoles: 250,
      }
      const finding = buildDomainFinding(worst, evaluateDomainSpike(worst, { windowAccounts: 9_999, baselineAccounts: 99_999 }, defaults), defaults)
      const openedAt = new Date("2026-10-05T08:00:00Z")
      const alert = nextAlertState(rule, { type: "entree", finding, hits: 1, alert: null }, openedAt)
      if (!alert) throw new Error("épisode attendu")

      const message = formatDetectionNotification(rule, "rappel", alert, finding.links, new Date(openedAt.getTime() + 40 * DAY_MS))

      expect(domain).toHaveLength(253)
      expect(message).toContain(`${config.publicUrl}/espace-pro/administration/users/`)
      expect(message.length).toBeLessThanOrEqual(3_900)
    } finally {
      config.publicUrl = publicUrl
    }
  })
})

describe("règle creations_comptes_domaine dans le socle de détection", () => {
  useMongo()

  const NOW = new Date("2026-10-15T10:00:00Z")
  let sequence = 0

  beforeEach(() => {
    sequence = 0
    vi.mocked(notifyToSlack).mockReset()
  })

  const creationEvent = generateRoleManagementStatusEventFixture({ status: AccessStatus.AWAITING_VALIDATION, reason: "création de compte" })

  const role = (
    user_id: ObjectId,
    createdAt: Date,
    { type = AccessEntityType.ENTREPRISE, status = AccessStatus.GRANTED }: { type?: AccessEntityType; status?: AccessStatus } = {}
  ) =>
    generateRoleManagementFixture({
      user_id,
      authorized_id: new ObjectId().toString(),
      authorized_type: type,
      createdAt,
      updatedAt: createdAt,
      status: [creationEvent, generateRoleManagementStatusEventFixture({ status })],
    })

  type IAccountOptions = { type?: AccessEntityType; status?: AccessStatus; localPart?: () => string }

  /** Un compte avec son adresse sur `domain` et un rôle créé à `createdAt`. */
  const buildAccount = (domain: string, createdAt: Date, { type, status, localPart = () => `recrutement.${sequence}` }: IAccountOptions = {}) => {
    sequence++
    const user = generateUserWithAccountFixture({ email: `${localPart()}@${domain}` })
    return { user, role: role(user._id, createdAt, { type, status }) }
  }

  const insertAccounts = async (built: Array<{ user: IUserWithAccount; role: IRoleManagement }>) => {
    if (!built.length) return []
    await getDbCollection("userswithaccounts").insertMany(built.map(({ user }) => user))
    await getDbCollection("rolemanagements").insertMany(built.map(({ role }) => role))
    return built.map(({ user }) => user)
  }

  /** Un compte par date. */
  const createAccounts = (domain: string, dates: Date[], options: IAccountOptions = {}) => insertAccounts(dates.map((date) => buildAccount(domain, date, options)))

  const every = (start: Date, count: number, stepMs: number) => Array.from({ length: count }, (_, index) => new Date(start.getTime() + index * stepMs))

  /** Activité habituelle chaque jour à midi UTC : 10 entreprises sur des domaines distincts et 4 comptes sur un webmail courant. */
  const seedBackground = async (from: string, to: string) => {
    const built: ReturnType<typeof buildAccount>[] = []
    for (let date = new Date(`${from}T12:00:00Z`); date <= new Date(`${to}T12:00:00Z`); date = new Date(date.getTime() + DAY_MS)) {
      for (let index = 0; index < 10; index++) {
        built.push(buildAccount(`societe-${sequence + 1}.exemple.fr`, date))
      }
      for (let index = 0; index < 4; index++) {
        built.push(buildAccount(WEBMAIL_COURANT, date))
      }
    }
    await insertAccounts(built)
  }

  const evaluate = (now: Date, thresholds = defaults) => rule.evaluate({ now, thresholds, activeAlerts: [] })

  it("(faux positif) n'alerte pas sur l'activité habituelle, dont un webmail courant au-dessus du seuil absolu", async () => {
    await seedBackground("2026-09-10", "2026-10-14")

    const { findings, observations } = await evaluate(NOW)

    expect(findings).toEqual([])
    expect(observations).toEqual({
      fenetre_debut: "2026-10-12T10:00:00.000Z",
      comptes_fenetre: 42,
      comptes_reference: 392,
      domaines_fenetre: 31,
      domaines_en_alerte: 0,
      max_comptes_domaine_entreprise: 1,
      max_comptes_domaine_webmail: 12,
    })
  })

  it("(faux positif) n'alerte pas sur des créations étalées : 25 comptes à un jour d'intervalle", async () => {
    await createAccounts(DOMAINE_ENTREPRISE, every(new Date(NOW.getTime() - 25 * DAY_MS), 25, DAY_MS))

    const { findings, observations } = await evaluate(NOW)

    expect(findings).toEqual([])
    expect(observations).toMatchObject({ comptes_fenetre: 3, max_comptes_domaine_entreprise: 3 })
  })

  it("(faux positif) n'alerte pas sur 25 comptes répartis sur 25 domaines", async () => {
    for (let index = 0; index < 25; index++) {
      await createAccounts(`agence-${index}.exemple.fr`, [new Date(NOW.getTime() - HOUR_MS)])
    }

    expect((await evaluate(NOW)).findings).toEqual([])
  })

  it("(faux positif) compte une fois l'utilisateur qui rattache plusieurs entreprises", async () => {
    const [user] = await createAccounts(DOMAINE_ENTREPRISE, [new Date(NOW.getTime() - 2 * HOUR_MS)])
    await getDbCollection("rolemanagements").insertMany(every(new Date(NOW.getTime() - HOUR_MS), 11, 60 * 1000).map((createdAt) => role(user._id, createdAt)))

    const { findings, observations } = await evaluate(NOW)

    expect(findings).toEqual([])
    expect(observations).toMatchObject({ comptes_fenetre: 1, max_comptes_domaine_entreprise: 1 })
  })

  it("(faux positif) ignore les rôles OPCO et administrateur, et les rôles dont l'utilisateur n'existe plus", async () => {
    const dates = every(new Date(NOW.getTime() - 10 * HOUR_MS), 12, HOUR_MS / 2)
    await createAccounts(DOMAINE_ENTREPRISE, dates, { type: AccessEntityType.OPCO })
    await createAccounts("autre.exemple.fr", dates, { type: AccessEntityType.ADMIN })
    await getDbCollection("rolemanagements").insertMany(dates.map((createdAt) => role(new ObjectId(), createdAt)))

    const { findings, observations } = await evaluate(NOW)

    expect(findings).toEqual([])
    expect(observations).toMatchObject({ comptes_fenetre: 0, domaines_fenetre: 0 })
  })

  it("borne la fenêtre : un compte créé pile à son début compte, un compte créé à l'instant évalué attend le créneau suivant", async () => {
    const { windowStart } = getCreationWindows(NOW, defaults)
    await createAccounts(DOMAINE_ENTREPRISE, every(new Date(NOW.getTime() - 9 * HOUR_MS), 9, HOUR_MS))
    await createAccounts(DOMAINE_ENTREPRISE, [NOW])
    const [atWindowStart] = await createAccounts(DOMAINE_ENTREPRISE, [windowStart])

    expect((await evaluate(NOW)).findings.map(({ key }) => key)).toEqual([DOMAINE_ENTREPRISE])

    await getDbCollection("rolemanagements").updateOne({ user_id: atWindowStart._id }, { $set: { createdAt: new Date(windowStart.getTime() - 1) } })
    expect((await evaluate(NOW)).findings).toEqual([])
  })

  it("regroupe les adresses d'un domaine quelle que soit leur casse", async () => {
    const dates = every(new Date(NOW.getTime() - 10 * HOUR_MS), 5, HOUR_MS)
    await createAccounts("Entreprise.Exemple.FR", dates)
    await createAccounts(DOMAINE_ENTREPRISE, dates)

    expect((await evaluate(NOW)).findings.map(({ key, metrics }) => [key, metrics.comptes])).toEqual([[DOMAINE_ENTREPRISE, 10]])
  })

  it("(faux positif) ne compte comme validés automatiquement ni une création par clé API ni une validation manuelle", async () => {
    const created = await createAccounts(DOMAINE_ENTREPRISE, every(new Date(NOW.getTime() - 10 * HOUR_MS), 10, HOUR_MS))
    const setStatus = (users: IUserWithAccount[], status: AccessStatus, reason: string, validation_type: VALIDATION_UTILISATEUR) =>
      getDbCollection("rolemanagements").updateMany(
        { user_id: { $in: users.map(({ _id }) => _id) } },
        { $set: { status: [creationEvent, generateRoleManagementStatusEventFixture({ status, reason, validation_type })] } }
      )
    await setStatus(created.slice(6, 8), AccessStatus.GRANTED, API_KEY_CREATION_REASON, VALIDATION_UTILISATEUR.AUTO)
    await setStatus(created.slice(8), AccessStatus.GRANTED, "validé par un administrateur", VALIDATION_UTILISATEUR.MANUAL)

    const [finding] = (await evaluate(NOW)).findings

    expect(finding.metrics).toMatchObject({ comptes: 10, roles_acces_accorde: 10, roles_valides_auto: 6 })
    expect(finding.summary).toContain("Rôles créés : 10 entreprise, 0 CFA, dont 6 validés automatiquement ;")
  })

  it("lit le statut courant d'un rôle par date, pas par position dans l'historique", async () => {
    const created = await createAccounts(DOMAINE_ENTREPRISE, every(new Date(NOW.getTime() - 10 * HOUR_MS), 10, HOUR_MS))
    // Désactivation enregistrée avant l'événement de création dans le tableau, mais datée après.
    const outOfOrder = [
      generateRoleManagementStatusEventFixture({ status: AccessStatus.DENIED, validation_type: VALIDATION_UTILISATEUR.MANUAL, date: new Date(NOW.getTime() - HOUR_MS) }),
      generateRoleManagementStatusEventFixture({ status: AccessStatus.AWAITING_VALIDATION, reason: "création de compte", date: new Date(NOW.getTime() - 9 * HOUR_MS) }),
    ]
    await getDbCollection("rolemanagements").updateMany({ user_id: { $in: created.slice(8).map(({ _id }) => _id) } }, { $set: { status: outOfOrder } })

    const [finding] = (await evaluate(NOW)).findings

    expect(finding.metrics).toMatchObject({ roles_acces_accorde: 8, roles_en_attente: 0, roles_refuses: 2 })
  })

  it("notifie le pic avec le domaine, les rôles et les identifiants des comptes, sans aucune adresse", async () => {
    await seedBackground("2026-09-10", "2026-10-14")
    // Partie locale en forme de domaine : elle ne doit pas plus sortir que l'adresse.
    const created = await createAccounts(WEBMAIL_RARE, every(new Date(NOW.getTime() - 60 * HOUR_MS), 25, 2 * HOUR_MS), {
      localPart: () => `rh.societe-usurpee.fr.${sequence}`,
    })
    await getDbCollection("rolemanagements").updateMany({ user_id: { $in: created.slice(0, 5).map(({ _id }) => _id) } }, { $set: { authorized_type: AccessEntityType.CFA } })
    await getDbCollection("rolemanagements").updateMany({ user_id: { $in: created.slice(20).map(({ _id }) => _id) } }, { $set: { status: [creationEvent] } })

    await runDetectionRules({ rules: [rule], now: NOW })

    expect(messages()).toHaveLength(1)
    const [message] = messages()
    expect(message).toContain("Entrée en alerte · Pic de créations de comptes sur un domaine email (gravité haute)")
    expect(message).toContain(
      `25 comptes recruteur créés en 72 h sur le domaine ${WEBMAIL_RARE} (webmail grand public ou jetable), pour 0 attendus d'après les 28 jours précédents. Premier le 13/10/2026 00:00, dernier le 15/10/2026 00:00.`
    )
    expect(message).toContain("Rôles créés : 20 entreprise, 5 CFA, dont 20 validés automatiquement ; aujourd'hui 20 accès accordés, 5 en attente, 0 refusés.")
    expect(message).toContain(`Comptes : ${created.map(({ _id }) => _id.toHexString()).join(", ")}`)
    expect(message).toContain(`<${config.publicUrl}/espace-pro/administration/users/${created[0]._id.toHexString()}|compte ${created[0]._id.toHexString()}>`)
    expect(message).toContain(`\`creations_comptes_domaine\` · \`${WEBMAIL_RARE}\``)
    expect(message).not.toContain("@")
    expect(message).not.toContain("rh.societe-usurpee")

    const [alert] = await getDbCollection("detection_alerts").find({ rule_id: rule.id }).toArray()
    expect(alert).toMatchObject({ key: WEBMAIL_RARE, status: "ouverte", opening_metrics: { domaine: WEBMAIL_RARE, type_domaine: "webmail", comptes: 25 } })
  })

  // 120 évaluations horaires : plus de 5 s sur les runners de la CI, d'où le délai explicite.
  it("rejoue un pic de 25 comptes en 3 jours : une entrée au 10e compte, un rappel par jour, une sortie quand la fenêtre redescend sous le seuil", async () => {
    await seedBackground("2026-09-01", "2026-10-10")
    // Un compte toutes les 3 h à partir du 05/10 00:30 UTC : le 10e le 06/10 à 03:30, le 16e le 06/10 à 21:30.
    await createAccounts(WEBMAIL_RARE, every(new Date("2026-10-05T00:30:00Z"), 25, 3 * HOUR_MS))

    const { lines, episodes } = await replayDetectionRule({ rule, from: new Date("2026-10-05T00:00:00Z"), to: new Date("2026-10-10T00:00:00Z"), thresholds: defaults })

    expect(episodes).toEqual([{ key: WEBMAIL_RARE, opened_at: new Date("2026-10-06T04:00:00Z"), closed_at: new Date("2026-10-09T22:00:00Z"), notifications: 5 }])
    expect(lines.filter(({ notifications }) => notifications.length).map(({ slot, notifications }) => `${slot} ${notifications.join(",")}`)).toEqual([
      "2026-10-06T04:00:00.000Z entree",
      "2026-10-07T04:00:00.000Z rappel",
      "2026-10-08T04:00:00.000Z rappel",
      "2026-10-09T04:00:00.000Z rappel",
      "2026-10-09T22:00:00.000Z sortie",
    ])
    expect(lines.find(({ slot }) => slot === "2026-10-06T03:00:00.000Z")?.observations).toMatchObject({ domaines_en_alerte: 0, max_comptes_domaine_webmail: 12 })
    expect(notifyToSlack).not.toHaveBeenCalled()
  }, 20_000)

  it("lit la fenêtre par l'index { authorized_type, createdAt } et joint les comptes par leur _id", async () => {
    await seedBackground("2026-10-01", "2026-10-14")
    const { windowStart, baselineStart } = getCreationWindows(NOW, defaults)

    const explain = await getDbCollection("rolemanagements")
      .aggregate(creationsByDomainPipeline(baselineStart, windowStart, NOW))
      .explain("executionStats")
    const lookup = explain.stages.find((stage: Record<string, unknown>) => "$lookup" in stage)

    expect(JSON.stringify(explain.stages[0])).toContain("authorized_type_1_createdAt_1")
    expect(JSON.stringify(explain)).not.toContain("COLLSCAN")
    expect(lookup).toMatchObject({ collectionScans: 0, indexesUsed: ["_id_"] })
  })
})
