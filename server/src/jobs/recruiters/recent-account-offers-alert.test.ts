import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { generateRoleManagementFixture, generateRoleManagementStatusEventFixture } from "shared/fixtures/role-management.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/user-with-account.fixture"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { MODERATION_REVIEW_STATUS, OFFER_MODERATION_STATUS } from "shared/models/jobs-partners-moderation.model"
import type { IRoleManagementEvent } from "shared/models/role-management.model"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack, SLACK_MESSAGE_MAX_LENGTH } from "@/common/utils/slack-utils"
import config from "@/config"
import { configureDetectionRule } from "@/jobs/detection/detection-cli"
import { assertValidEvaluation, nextAlertState, runDetectionRules } from "@/jobs/detection/detection-engine"
import { formatDetectionNotification } from "@/jobs/detection/detection-notification"
import { replayDetectionRule } from "@/jobs/detection/detection-replay"
import { API_KEY_CREATION_REASON } from "@/services/auto-validation-reasons"
import type { IRecentAccount } from "./recent-account-offers-alert"
import { buildRecentAccountFinding, evaluateRecentAccount, getObservationStart, recentAccountOffersRule, recentAccountsPipeline } from "./recent-account-offers-alert"

vi.mock("@/common/utils/slack-utils")
vi.mock("@/common/utils/sentry-utils")

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

const rule = recentAccountOffersRule
const defaults = rule.thresholds.parse({})
// Fenêtre courte et seuil d'offres bas : la mécanique de la règle (ouverture, refus, suivi) ne dépend pas des seuils.
const SHORT_SETTINGS = { windowHours: 24, minOffers: 5 }
const SHORT = rule.thresholds.parse(SHORT_SETTINGS)

// SIRET fictifs.
const SIRET = "00000000000018"
const AUTRES_SIRETS = ["00000000000026", "00000000000034"]

const messages = () => vi.mocked(notifyToSlack).mock.calls.map(([{ message }]) => message)

const account = (overrides: Partial<IRecentAccount> = {}): IRecentAccount => ({
  userId: new ObjectId(),
  startedAt: new Date("2026-10-15T08:00:00Z"),
  userCreatedAt: new Date("2026-10-15T08:00:00Z"),
  apiKeyCreated: false,
  entrepriseRoles: 1,
  cfaRoles: 0,
  grantedRoles: 1,
  awaitingRoles: 0,
  deniedRoles: 0,
  autoValidatedRoles: 1,
  offers: 10,
  nonConformeOffers: 0,
  openings: 10,
  sirets: [SIRET],
  firstOfferAt: new Date("2026-10-15T08:30:00Z"),
  lastOfferAt: new Date("2026-10-15T10:10:00Z"),
  ...overrides,
})

describe("evaluateRecentAccount", () => {
  // Valeurs issues du rejeu sur la production (cf. docs/detection.md) : les changer est un choix, pas un effet de bord.
  it("compte par défaut 10 offres, 20 postes ou 2 non conformes dans les 7 jours suivant l'ouverture", () => {
    expect(defaults).toEqual({ windowHours: 168, minOffers: 10, minOpenings: 20, minNonConformeOffers: 2, holdHours: 24 })
  })

  it("(faux positif) n'alerte pas sur un compte créé par clé API partenaire, quel que soit son volume, même alerte ouverte", () => {
    const integrator = account({ apiKeyCreated: true, offers: 40, openings: 400, nonConformeOffers: 3 })
    expect(evaluateRecentAccount(integrator, defaults)).toEqual({ volume: true, openings: true, nonConforme: true, excluded: "cle_api", alert: false, held: false })
    expect(evaluateRecentAccount(integrator, defaults, true)).toMatchObject({ alert: false, held: false })
  })

  it("(faux positif) n'alerte pas sur un compte dont tous les rôles sont refusés ou désactivés, même alerte ouverte", () => {
    expect(evaluateRecentAccount(account({ grantedRoles: 0, deniedRoles: 1 }), defaults, true)).toMatchObject({ excluded: "desactive", alert: false, held: false })
    expect(evaluateRecentAccount(account({ entrepriseRoles: 2, grantedRoles: 1, deniedRoles: 1 }), defaults)).toMatchObject({ excluded: null, alert: true })
    // Un rôle en attente de validation peut encore recevoir son accès, puis déposer : le compte reste suivi.
    expect(evaluateRecentAccount(account({ entrepriseRoles: 2, grantedRoles: 0, awaitingRoles: 1, deniedRoles: 1 }), defaults)).toMatchObject({ excluded: null, alert: true })
  })

  it("(faux positif) n'alerte pas sous le seuil d'offres, frontière comprise", () => {
    expect(evaluateRecentAccount(account({ offers: 9, openings: 9 }), defaults)).toMatchObject({ volume: false, openings: false, alert: false })
    expect(evaluateRecentAccount(account({ offers: 10, openings: 10 }), defaults)).toMatchObject({ volume: true, openings: false, alert: true, held: false })
  })

  it("(faux positif) n'alerte pas sous le seuil de postes cumulés, frontière comprise, même sous le seuil d'offres", () => {
    expect(evaluateRecentAccount(account({ offers: 2, openings: 19 }), defaults)).toMatchObject({ openings: false, alert: false })
    expect(evaluateRecentAccount(account({ offers: 2, openings: 20 }), defaults)).toMatchObject({ volume: false, openings: true, alert: true })
  })

  it("alerte sur deux offres non conformes, sous les seuils d'offres et de postes, et pas sur une seule", () => {
    expect(evaluateRecentAccount(account({ offers: 2, openings: 2, nonConformeOffers: 1 }), defaults)).toMatchObject({ nonConforme: false, alert: false })
    expect(evaluateRecentAccount(account({ offers: 2, openings: 2, nonConformeOffers: 2 }), defaults)).toMatchObject({
      volume: false,
      openings: false,
      nonConforme: true,
      alert: true,
    })
  })

  it("garde ouverte jusqu'à la fin du suivi une alerte repassée sous les seuils, et seulement une alerte ouverte", () => {
    const belowThresholds = account({ offers: 2, openings: 2, nonConformeOffers: 1 })
    expect(evaluateRecentAccount(belowThresholds, defaults, true)).toMatchObject({ alert: true, held: true })
    expect(evaluateRecentAccount(belowThresholds, defaults, false)).toMatchObject({ alert: false, held: false })
  })

  it("applique les seuils réglés en base", () => {
    const thresholds = rule.thresholds.parse({ minOffers: 12, minOpenings: 30, minNonConformeOffers: 3 })
    expect(evaluateRecentAccount(account({ offers: 11, openings: 29, nonConformeOffers: 2 }), thresholds).alert).toBe(false)
  })

  it("refuse un suivi plus court que la période de la règle et un seuil mal orthographié", () => {
    expect(rule.periodicity.everyMinutes).toBe(60)
    expect(() => rule.thresholds.parse({ holdHours: 0 })).toThrow()
    expect(() => rule.thresholds.parse({ minOffer: 3 })).toThrow()
  })
})

describe("constat d'un dépôt massif", () => {
  const findingFor = (overrides: Partial<IRecentAccount> = {}, open = false) => {
    const evaluated = account(overrides)
    return buildRecentAccountFinding(evaluated, evaluateRecentAccount(evaluated, defaults, open), defaults)
  }

  it("donne le compte, ses SIRET et le lien vers le back-office, et passe le garde-fou du socle", () => {
    const evaluated = account()
    const finding = findingFor(evaluated)

    expect(finding.key).toBe(evaluated.userId.toHexString())
    expect(finding.links).toEqual([
      { label: `compte ${evaluated.userId.toHexString()}`, url: `${config.publicUrl}/espace-pro/administration/users/${evaluated.userId.toHexString()}` },
    ])
    expect(finding.summary).toContain(`SIRET des offres : ${SIRET}`)
    expect(() => assertValidEvaluation(rule, { findings: [finding] })).not.toThrow()
  })

  it("(faux positif) est écarté par le socle si une adresse se glissait parmi les SIRET", () => {
    expect(() => assertValidEvaluation(rule, { findings: [findingFor({ sirets: ["rh@entreprise.exemple.fr"] })] })).toThrow("adresse email détectée")
  })

  it("arrondit au supérieur la durée entre l'ouverture et la dernière offre", () => {
    expect(findingFor({ lastOfferAt: new Date("2026-10-15T10:10:00Z") }).summary).toContain("dans les 3 h suivant son ouverture")
    expect(findingFor({ lastOfferAt: new Date("2026-10-15T08:05:00Z") }).summary).toContain("dans les 1 h suivant son ouverture")
  })

  it("compte en jours au-delà de 48 h, arrondi au supérieur, et rappelle les seuils en vigueur", () => {
    const finding = findingFor({ lastOfferAt: new Date("2026-10-17T09:00:00Z") })

    expect(finding.summary).toContain("dans les 3 jours suivant son ouverture")
    expect(finding.summary).toContain("Seuils : 10 offres, 20 postes ou 2 non conformes, en 7 jours.")
    expect(findingFor({ lastOfferAt: new Date("2026-10-17T07:00:00Z") }).summary).toContain("dans les 47 h suivant son ouverture")
  })

  it("signale un utilisateur qui revient sur un nouveau rôle, au-delà d'une heure entre sa création et l'ouverture", () => {
    const reregistered = findingFor({ userCreatedAt: new Date("2026-09-15T08:00:00Z") })
    const sameHour = findingFor({ userCreatedAt: new Date("2026-10-15T07:00:00Z") })

    expect(reregistered.summary).toContain("Utilisateur créé le 15/09/2026 10:00 : il revient sur un nouveau rôle, ses rôles précédents étant tous refusés ou désactivés.")
    expect(reregistered.metrics).toMatchObject({ reinscription: true, utilisateur_cree_le: "2026-09-15T08:00:00.000Z", compte_ouvert_le: "2026-10-15T08:00:00.000Z" })
    expect(sameHour.summary).not.toContain("il revient")
    expect(sameHour.metrics.reinscription).toBe(false)
  })

  it("explique dans le message pourquoi une alerte reste ouverte sous les seuils", () => {
    const held = findingFor({ offers: 2, nonConformeOffers: 1 }, true)

    expect(held.summary).toContain(
      "Le compte est repassé sous les seuils, par exemple après la validation d'une offre par un modérateur : l'alerte reste ouverte jusqu'à la fin du suivi."
    )
    expect(held.metrics.maintenue_sous_le_seuil).toBe(true)
    expect(findingFor().summary).not.toContain("repassé sous les seuils")
  })

  it("plafonne les SIRET cités, la liste complète restant dans les métriques", () => {
    const sirets = Array.from({ length: 14 }, (_, index) => String(index).padStart(14, "0"))
    const finding = findingFor({ sirets })

    expect(finding.summary).toContain(`${sirets[9]} et 4 autres`)
    expect(finding.summary).not.toContain(sirets[10])
    expect(String(finding.metrics.sirets).split(",")).toHaveLength(14)
  })

  it("tient sous la longueur d'un message Slack au pire cas : rappel, réinscription, maintien, 500 SIRET, gros volumes, URL de production", () => {
    const publicUrl = config.publicUrl
    config.publicUrl = "https://labonnealternance.apprentissage.beta.gouv.fr"
    try {
      const worst = account({
        userCreatedAt: new Date("2025-01-01T08:00:00Z"),
        offers: 123_456,
        nonConformeOffers: 12_345,
        openings: 1_234_567,
        sirets: Array.from({ length: 500 }, (_, index) => String(index).padStart(14, "9")),
        entrepriseRoles: 999,
        cfaRoles: 999,
        grantedRoles: 999,
        awaitingRoles: 999,
        deniedRoles: 999,
        autoValidatedRoles: 999,
      })
      const thresholds = rule.thresholds.parse({ windowHours: 99_999, holdHours: 99_999, minOffers: 99_999, minOpenings: 99_999, minNonConformeOffers: 99_999 })
      const finding = buildRecentAccountFinding(worst, { volume: true, openings: true, nonConforme: true, excluded: null, alert: true, held: true }, thresholds)
      const openedAt = new Date("2026-10-15T08:00:00Z")
      const alert = nextAlertState(rule, { type: "entree", finding, hits: 1, alert: null }, openedAt)
      if (!alert) throw new Error("épisode attendu")

      const message = formatDetectionNotification(rule, "rappel", alert, finding.links, new Date(openedAt.getTime() + 40 * DAY_MS))

      expect(message).toContain(`${config.publicUrl}/espace-pro/administration/users/`)
      expect(message).toContain("il revient sur un nouveau rôle")
      expect(message).toContain("l'alerte reste ouverte jusqu'à la fin du suivi")
      expect(message).toContain("et 490 autres")
      expect(message.length).toBeLessThanOrEqual(SLACK_MESSAGE_MAX_LENGTH)
    } finally {
      config.publicUrl = publicUrl
    }
  })
})

describe("règle offres_compte_recent dans le socle de détection", () => {
  useMongo()

  const NOW = new Date("2026-10-15T10:00:00Z")
  let sequence = 0

  beforeEach(() => {
    sequence = 0
    vi.mocked(notifyToSlack).mockReset()
  })

  const event = (status: AccessStatus, date: Date, props: Partial<IRoleManagementEvent> = {}) =>
    generateRoleManagementStatusEventFixture({ status, date, reason: "création de compte", validation_type: VALIDATION_UTILISATEUR.AUTO, ...props })

  /** Rôle créé en attente, accès accordé par validation automatique une minute plus tard. */
  const grantedEvents = (roleCreatedAt: Date) => [
    event(AccessStatus.AWAITING_VALIDATION, roleCreatedAt),
    event(AccessStatus.GRANTED, new Date(roleCreatedAt.getTime() + MINUTE_MS), { reason: "validation par : BAL" }),
  ]

  const deactivatedEvents = (roleCreatedAt: Date, deactivatedAt: Date) => [
    ...grantedEvents(roleCreatedAt),
    event(AccessStatus.DENIED, deactivatedAt, { validation_type: VALIDATION_UTILISATEUR.MANUAL, reason: "désactivé" }),
  ]

  type IRoleOptions = { type?: AccessEntityType; events?: IRoleManagementEvent[] }

  const addRole = async (user_id: ObjectId, createdAt: Date, { type = AccessEntityType.ENTREPRISE, events = grantedEvents(createdAt) }: IRoleOptions = {}) => {
    await getDbCollection("rolemanagements").insertOne(
      generateRoleManagementFixture({ user_id, authorized_id: new ObjectId().toString(), authorized_type: type, createdAt, updatedAt: createdAt, status: events })
    )
  }

  /** Un utilisateur et son premier rôle, créés au même instant par défaut. */
  const createAccount = async (createdAt: Date, { roleCreatedAt = createdAt, ...options }: IRoleOptions & { roleCreatedAt?: Date } = {}) => {
    sequence++
    const user = generateUserWithAccountFixture({ email: `recrutement.${sequence}@entreprise.exemple.fr`, createdAt, updatedAt: createdAt })
    await getDbCollection("userswithaccounts").insertOne(user)
    await addRole(user._id, roleCreatedAt, { events: grantedEvents(roleCreatedAt), ...options })
    return user
  }

  const depositOffers = async (managed_by: ObjectId | null, dates: Date[], props: Partial<IJobsPartnersOfferPrivate> = {}) => {
    const offers = dates.map((created_at) =>
      generateJobsPartnersOfferPrivate({
        partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
        managed_by,
        created_at,
        updated_at: created_at,
        offer_creation: created_at,
        workplace_siret: SIRET,
        ...props,
      })
    )
    await getDbCollection("jobs_partners").insertMany(offers)
    return offers
  }

  const every = (start: Date, count: number, stepMs: number) => Array.from({ length: count }, (_, index) => new Date(start.getTime() + index * stepMs))

  const evaluate = (now: Date, thresholds = SHORT) => rule.evaluate({ now, thresholds, activeAlerts: [] })
  const keys = async (now: Date, thresholds = SHORT) => (await evaluate(now, thresholds)).findings.map(({ key }) => key)

  const enableRule = (settings: Record<string, number> = SHORT_SETTINGS) =>
    configureDetectionRule({ rule: rule.id, enabled: "true", thresholds: JSON.stringify(settings), rules: [rule] })

  it("(faux positif) ne suit pas un utilisateur dont un rôle plus ancien est encore actif : données anciennes ou rôle réaccordé", async () => {
    const user = await createAccount(new Date(NOW.getTime() - 30 * DAY_MS))
    await addRole(user._id, new Date(NOW.getTime() - 2 * HOUR_MS))
    await depositOffers(user._id, every(new Date(NOW.getTime() - 90 * MINUTE_MS), 20, MINUTE_MS))

    const { findings, observations } = await evaluate(NOW)

    expect(findings).toEqual([])
    expect(observations).toMatchObject({ comptes_suivis: 0, max_offres_compte: 0 })
  })

  it("suit un utilisateur qui revient sur un nouveau rôle après la désactivation de ses rôles précédents", async () => {
    const userCreatedAt = new Date(NOW.getTime() - 30 * DAY_MS)
    const user = await createAccount(userCreatedAt, { events: deactivatedEvents(userCreatedAt, new Date(NOW.getTime() - 10 * DAY_MS)) })
    const startedAt = new Date(NOW.getTime() - 5 * HOUR_MS)
    await addRole(user._id, startedAt)
    // Offres du rôle désactivé : avant l'ouverture, non comptées.
    await depositOffers(user._id, every(new Date(userCreatedAt.getTime() + HOUR_MS), 10, MINUTE_MS))
    await depositOffers(user._id, every(new Date(startedAt.getTime() + HOUR_MS), 5, 30 * MINUTE_MS))

    const { findings, observations } = await evaluate(NOW)

    expect(findings.map(({ key }) => key)).toEqual([user._id.toHexString()])
    expect(findings[0].metrics).toMatchObject({ offres: 5, reinscription: true, compte_ouvert_le: startedAt.toISOString(), utilisateur_cree_le: userCreatedAt.toISOString() })
    expect(observations).toMatchObject({ comptes_suivis: 1, comptes_reinscrits: 1 })
  })

  it("ouvre le compte au rôle de la réinscription, même quand le rôle refusé est encore dans la période suivie", async () => {
    const userCreatedAt = new Date(NOW.getTime() - 30 * HOUR_MS)
    const user = await createAccount(userCreatedAt, { events: deactivatedEvents(userCreatedAt, new Date(NOW.getTime() - 28 * HOUR_MS)) })
    const startedAt = new Date(NOW.getTime() - 5 * HOUR_MS)
    await addRole(user._id, startedAt)
    await depositOffers(user._id, every(new Date(NOW.getTime() - 4 * HOUR_MS), 5, MINUTE_MS))

    const [finding] = (await evaluate(NOW)).findings

    expect(finding.metrics).toMatchObject({ compte_ouvert_le: startedAt.toISOString(), reinscription: true, offres: 5, roles_entreprise: 1, roles_refuses: 0 })
    expect(finding.summary).toContain("il revient sur un nouveau rôle")
  })

  it("(faux positif) ne compte pas les offres du rôle refusé avec celles de la réinscription", async () => {
    const userCreatedAt = new Date(NOW.getTime() - 20 * HOUR_MS)
    const user = await createAccount(userCreatedAt, { events: deactivatedEvents(userCreatedAt, new Date(NOW.getTime() - 18 * HOUR_MS)) })
    await depositOffers(user._id, [new Date(NOW.getTime() - 19 * HOUR_MS)])
    await addRole(user._id, new Date(NOW.getTime() - 10 * HOUR_MS))
    await depositOffers(user._id, every(new Date(NOW.getTime() - 9 * HOUR_MS), 4, MINUTE_MS))

    const { findings, observations } = await evaluate(NOW)

    expect(findings).toEqual([])
    expect(observations).toMatchObject({ comptes_suivis: 1, comptes_reinscrits: 1, max_offres_compte: 4 })
  })

  it("(faux positif) ferme l'alerte du rôle désactivé et n'en rouvre pas une au retour du compte sans offre, même avant le créneau suivant", async () => {
    const createdAt = new Date(NOW.getTime() - 5 * HOUR_MS)
    const user = await createAccount(createdAt, { events: deactivatedEvents(createdAt, new Date(NOW.getTime() + 30 * MINUTE_MS)) })
    await depositOffers(user._id, every(new Date(createdAt.getTime() + MINUTE_MS), 5, MINUTE_MS))
    // Réinscription entre la désactivation et le créneau suivant.
    await addRole(user._id, new Date(NOW.getTime() + 45 * MINUTE_MS))
    await enableRule()

    for (const hours of [0, 1, 2]) {
      await runDetectionRules({ rules: [rule], now: new Date(NOW.getTime() + hours * HOUR_MS) })
    }

    expect(messages().map((message) => message.split(" · ")[0])).toEqual(["Entrée en alerte", "Sortie d'alerte"])
  })

  it("ignore un rôle créé après l'instant évalué : le rejeu d'un créneau passé ne voit pas la réinscription à venir", async () => {
    const createdAt = new Date(NOW.getTime() - 5 * HOUR_MS)
    const user = await createAccount(createdAt, { events: deactivatedEvents(createdAt, new Date(NOW.getTime() - HOUR_MS)) })
    await depositOffers(user._id, every(new Date(createdAt.getTime() + MINUTE_MS), 5, MINUTE_MS))
    await addRole(user._id, new Date(NOW.getTime() + HOUR_MS))

    expect((await evaluate(NOW)).observations).toMatchObject({ comptes_suivis: 1, comptes_desactives: 1, comptes_reinscrits: 0 })
  })

  it("(faux positif) lit le statut d'un rôle plus ancien à l'instant évalué : désactivé après, il est encore actif", async () => {
    const userCreatedAt = new Date(NOW.getTime() - 30 * DAY_MS)
    const user = await createAccount(userCreatedAt, { events: deactivatedEvents(userCreatedAt, NOW) })
    await addRole(user._id, new Date(NOW.getTime() - 5 * HOUR_MS))
    await depositOffers(user._id, every(new Date(NOW.getTime() - 4 * HOUR_MS), 6, MINUTE_MS))

    expect((await evaluate(NOW)).observations).toMatchObject({ comptes_suivis: 0 })
    expect((await evaluate(new Date(NOW.getTime() + HOUR_MS))).observations).toMatchObject({ comptes_suivis: 1, comptes_reinscrits: 1, comptes_en_alerte: 1 })
  })

  it("(faux positif) ignore un rôle dont l'utilisateur n'existe plus", async () => {
    const orphan = new ObjectId()
    await addRole(orphan, new Date(NOW.getTime() - 5 * HOUR_MS))
    await depositOffers(orphan, every(new Date(NOW.getTime() - 4 * HOUR_MS), 6, MINUTE_MS))

    expect((await evaluate(NOW)).observations).toMatchObject({ comptes_suivis: 0 })
  })

  it("(faux positif) ne compte pas les offres déposées après les 24 h suivant l'ouverture, frontière comprise", async () => {
    // Compte ouvert 25 h avant l'instant évalué, encore suivi pendant son délai de maintien.
    const createdAt = new Date(NOW.getTime() - 25 * HOUR_MS)
    const user = await createAccount(createdAt)
    const windowEnd = new Date(createdAt.getTime() + SHORT.windowHours * HOUR_MS)
    await depositOffers(user._id, [windowEnd, ...every(new Date(windowEnd.getTime() + MINUTE_MS), 10, MINUTE_MS)])
    await depositOffers(user._id, every(createdAt, 4, HOUR_MS))

    expect(await keys(NOW)).toEqual([])

    await depositOffers(user._id, [new Date(windowEnd.getTime() - 1)])
    const [finding] = (await evaluate(NOW)).findings
    expect(finding.metrics).toMatchObject({ offres: 5 })
  })

  it("(faux positif) cesse de suivre un compte ouvert juste avant le début de la période suivie, frontière comprise", async () => {
    const observationStart = getObservationStart(NOW, SHORT)
    const atStart = await createAccount(observationStart)
    const justBefore = await createAccount(new Date(observationStart.getTime() - 1))
    await depositOffers(atStart._id, every(new Date(observationStart.getTime() + MINUTE_MS), 5, MINUTE_MS))
    await depositOffers(justBefore._id, every(observationStart, 5, MINUTE_MS))

    const { findings, observations } = await evaluate(NOW)

    expect(findings.map(({ key }) => key)).toEqual([atStart._id.toHexString()])
    expect(observations).toMatchObject({ comptes_suivis: 1 })
  })

  it("(faux positif) n'alerte pas sur un intégrateur créé par clé API partenaire", async () => {
    const createdAt = new Date(NOW.getTime() - 5 * HOUR_MS)
    const integrator = await createAccount(createdAt, {
      events: [event(AccessStatus.GRANTED, createdAt, { reason: API_KEY_CREATION_REASON, validation_type: VALIDATION_UTILISATEUR.AUTO })],
    })
    await depositOffers(integrator._id, every(createdAt, 40, MINUTE_MS))

    const { findings, observations } = await evaluate(NOW)

    expect(findings).toEqual([])
    expect(observations).toMatchObject({ comptes_suivis: 1, comptes_cle_api: 1, max_offres_compte: 40 })
  })

  it("(faux positif) ne compte que les offres LBA du compte, pas celles d'un partenaire publiées par l'API", async () => {
    const user = await createAccount(new Date(NOW.getTime() - 5 * HOUR_MS))
    await depositOffers(user._id, every(new Date(NOW.getTime() - 4 * HOUR_MS), 30, MINUTE_MS), { partner_label: JOBPARTNERS_LABEL.HELLOWORK })
    await depositOffers(null, every(new Date(NOW.getTime() - 4 * HOUR_MS), 30, MINUTE_MS))
    await depositOffers(user._id, every(new Date(NOW.getTime() - 4 * HOUR_MS), 4, MINUTE_MS))

    const { findings, observations } = await evaluate(NOW)

    expect(findings).toEqual([])
    expect(observations).toMatchObject({ comptes_avec_offres: 1, max_offres_compte: 4 })
  })

  it("(faux positif) lit le statut des rôles à l'instant évalué : désactivé avant, il n'alerte pas ; désactivé après, il alerte", async () => {
    const createdAt = new Date(NOW.getTime() - 5 * HOUR_MS)
    const before = await createAccount(createdAt, { events: deactivatedEvents(createdAt, new Date(NOW.getTime() - HOUR_MS)) })
    const after = await createAccount(createdAt, { events: deactivatedEvents(createdAt, NOW) })
    const refused = await createAccount(createdAt, {
      events: [
        event(AccessStatus.AWAITING_VALIDATION, createdAt),
        event(AccessStatus.DENIED, new Date(createdAt.getTime() + HOUR_MS), { validation_type: VALIDATION_UTILISATEUR.MANUAL }),
      ],
    })
    for (const user of [before, after, refused]) {
      await depositOffers(user._id, every(new Date(createdAt.getTime() + MINUTE_MS), 6, MINUTE_MS))
    }

    const { findings, observations } = await evaluate(NOW)

    expect(findings.map(({ key }) => key)).toEqual([after._id.toHexString()])
    expect(observations).toMatchObject({ comptes_desactives: 2 })
  })

  it("lit le statut d'un rôle par date, pas par position dans l'historique", async () => {
    const createdAt = new Date(NOW.getTime() - 5 * HOUR_MS)
    // Désactivation enregistrée avant l'événement de création dans le tableau, mais datée après.
    const user = await createAccount(createdAt, {
      events: [event(AccessStatus.DENIED, new Date(NOW.getTime() - HOUR_MS), { validation_type: VALIDATION_UTILISATEUR.MANUAL }), ...grantedEvents(createdAt)],
    })
    await depositOffers(user._id, every(new Date(createdAt.getTime() + MINUTE_MS), 6, MINUTE_MS))

    expect((await evaluate(NOW)).observations).toMatchObject({ comptes_desactives: 1, comptes_en_alerte: 0 })
  })

  it("(faux positif) ne compte comme non conforme ni une offre validée par un modérateur ni une offre à vérifier, analyse réussie ou en échec", async () => {
    const createdAt = new Date(NOW.getTime() - 5 * HOUR_MS)
    const user = await createAccount(createdAt)
    const at = every(new Date(createdAt.getTime() + MINUTE_MS), 4, MINUTE_MS)
    const nonConforme = { offer_moderation_verdict: "non_conforme", offer_moderation_status: OFFER_MODERATION_STATUS.OK } as const
    await depositOffers(user._id, [at[0]], nonConforme)
    await depositOffers(user._id, [at[1]], { ...nonConforme, offer_moderation_review: MODERATION_REVIEW_STATUS.VALIDEE })
    await depositOffers(user._id, [at[2]], { offer_moderation_verdict: "a_verifier", offer_moderation_status: OFFER_MODERATION_STATUS.INDISPONIBLE })
    await depositOffers(user._id, [at[3]], { offer_moderation_verdict: "a_verifier", offer_moderation_status: OFFER_MODERATION_STATUS.OK })

    expect((await evaluate(NOW)).observations).toMatchObject({ max_offres_compte: 4, max_offres_non_conformes_compte: 1, comptes_en_alerte: 0 })

    await depositOffers(user._id, [new Date(at[3].getTime() + MINUTE_MS)], { ...nonConforme, offer_moderation_review: MODERATION_REVIEW_STATUS.REFUSEE })
    const [finding] = (await evaluate(NOW)).findings
    expect(finding.metrics).toMatchObject({ offres: 5, offres_non_conformes: 2, critere_volume: true, critere_non_conforme: true })
  })

  it("compte non conforme une offre dont un champ est non conforme et l'analyse de l'autre en échec", async () => {
    const createdAt = new Date(NOW.getTime() - 5 * HOUR_MS)
    const user = await createAccount(createdAt)
    const at = every(new Date(createdAt.getTime() + MINUTE_MS), 2, MINUTE_MS)
    await depositOffers(user._id, [at[0]], { offer_moderation_verdict: "non_conforme", offer_moderation_status: OFFER_MODERATION_STATUS.OK })
    await depositOffers(user._id, [at[1]], { offer_moderation_verdict: "non_conforme", offer_moderation_status: OFFER_MODERATION_STATUS.EPUISE })

    const [finding] = (await evaluate(NOW)).findings

    expect(finding.metrics).toMatchObject({ offres: 2, offres_non_conformes: 2, critere_non_conforme: true })
  })

  it("alerte sur deux offres non conformes d'un compte neuf, sous le seuil d'offres", async () => {
    const createdAt = new Date(NOW.getTime() - 5 * HOUR_MS)
    const user = await createAccount(createdAt)
    await depositOffers(user._id, every(new Date(createdAt.getTime() + MINUTE_MS), 2, MINUTE_MS), {
      offer_moderation_verdict: "non_conforme",
      offer_moderation_status: OFFER_MODERATION_STATUS.OK,
    })

    const [finding] = (await evaluate(NOW)).findings

    expect(finding.metrics).toMatchObject({ offres: 2, offres_non_conformes: 2, critere_volume: false, critere_non_conforme: true })
  })

  it("compte les offres d'un CFA sur plusieurs entreprises, avec leurs postes", async () => {
    const createdAt = new Date(NOW.getTime() - 5 * HOUR_MS)
    const cfa = await createAccount(createdAt, { type: AccessEntityType.CFA })
    for (const siret of [SIRET, ...AUTRES_SIRETS]) {
      await depositOffers(cfa._id, every(new Date(createdAt.getTime() + HOUR_MS), 2, MINUTE_MS), { workplace_siret: siret, offer_opening_count: 3, is_delegated: true })
    }

    const [finding] = (await evaluate(NOW)).findings

    expect(finding.metrics).toMatchObject({ offres: 6, postes: 18, sirets: [SIRET, ...AUTRES_SIRETS].sort().join(","), roles_cfa: 1, roles_entreprise: 0 })
    expect(finding.summary).toContain(`SIRET des offres : ${[SIRET, ...AUTRES_SIRETS].sort().join(", ")}`)
  })

  it("(faux positif) ne notifie rien tant que la règle n'est pas activée en base", async () => {
    const user = await createAccount(new Date(NOW.getTime() - 5 * HOUR_MS))
    await depositOffers(user._id, every(new Date(NOW.getTime() - 4 * HOUR_MS), 6, MINUTE_MS))

    const [report] = await runDetectionRules({ rules: [rule], now: NOW })

    expect(report).toMatchObject({ status: "desactivee" })
    expect(notifyToSlack).not.toHaveBeenCalled()
    expect(await getDbCollection("detection_alerts").countDocuments({ rule_id: rule.id })).toBe(0)
  })

  it("notifie le compte, ses offres, ses SIRET et le lien vers le back-office, sans aucune adresse", async () => {
    const createdAt = new Date("2026-10-15T06:20:00Z")
    const user = await createAccount(createdAt)
    await depositOffers(user._id, every(new Date("2026-10-15T07:00:00Z"), 5, 30 * MINUTE_MS))
    await enableRule()

    await runDetectionRules({ rules: [rule], now: NOW })

    expect(messages()).toHaveLength(1)
    const [message] = messages()
    const id = user._id.toHexString()
    expect(message).toContain("Entrée en alerte · Dépôt massif d'offres juste après l'ouverture d'un compte (gravité haute)")
    expect(message).toContain(
      `Le compte ${id}, ouvert le 15/10/2026 08:20, a déposé 5 offres (5 postes) dans les 3 h suivant son ouverture, dont 0 non conformes selon la modération. Seuils : 5 offres, 20 postes ou 2 non conformes, en 24 h.`
    )
    expect(message).toContain("Rôles depuis l'ouverture : 1 entreprise, 0 CFA ; aujourd'hui 1 accès accordés, dont 1 par validation automatique, 0 en attente, 0 refusés.")
    expect(message).toContain(`SIRET des offres : ${SIRET}`)
    expect(message).toContain("Le compte n'est plus suivi après le 17/10/2026 08:20 : l'alerte se ferme alors, ou dès que tous ses rôles sont refusés ou désactivés.")
    expect(message).toContain(`<${config.publicUrl}/espace-pro/administration/users/${id}|compte ${id}>`)
    expect(message).toContain(`\`offres_compte_recent\` · \`${id}\``)
    expect(message).not.toContain("il revient")
    expect(message).not.toContain("@")
    expect(message).not.toContain("recrutement.")

    const [alert] = await getDbCollection("detection_alerts").find({ rule_id: rule.id }).toArray()
    expect(alert).toMatchObject({
      key: id,
      status: "ouverte",
      opening_metrics: { offres: 5, compte_ouvert_le: createdAt.toISOString(), critere_volume: true, reinscription: false },
    })
  })

  it("(faux positif) ne ferme pas puis rouvre une alerte quand une offre non conforme est validée puis reclassée", async () => {
    const createdAt = new Date(NOW.getTime() - 5 * HOUR_MS)
    const user = await createAccount(createdAt)
    const [validated] = await depositOffers(user._id, every(new Date(createdAt.getTime() + MINUTE_MS), 2, MINUTE_MS), {
      offer_moderation_verdict: "non_conforme",
      offer_moderation_status: OFFER_MODERATION_STATUS.OK,
    })
    await enableRule()
    const setReview = (review: (typeof MODERATION_REVIEW_STATUS)[keyof typeof MODERATION_REVIEW_STATUS] | null) =>
      getDbCollection("jobs_partners").updateOne({ _id: validated._id }, { $set: { offer_moderation_review: review } })

    await runDetectionRules({ rules: [rule], now: NOW })
    await setReview(MODERATION_REVIEW_STATUS.VALIDEE)
    await runDetectionRules({ rules: [rule], now: new Date(NOW.getTime() + HOUR_MS) })
    // Une modification relance la classification, qui remet la revue à null (cf. buildOfferModerationFields).
    await setReview(null)
    await runDetectionRules({ rules: [rule], now: new Date(NOW.getTime() + 2 * HOUR_MS) })
    await setReview(MODERATION_REVIEW_STATUS.VALIDEE)
    await runDetectionRules({ rules: [rule], now: new Date(NOW.getTime() + 3 * HOUR_MS) })

    expect(messages().map((message) => message.split(" · ")[0])).toEqual(["Entrée en alerte"])
    const [alert] = await getDbCollection("detection_alerts").find({ rule_id: rule.id }).toArray()
    expect(alert).toMatchObject({ status: "ouverte", notification_count: 1, last_metrics: { offres_non_conformes: 1, maintenue_sous_le_seuil: true } })
    expect(alert.summary).toContain("l'alerte reste ouverte jusqu'à la fin du suivi")

    // Pas de rappel avant 96 h, toujours sous les seuils ; puis fin du suivi 48 h après l'ouverture, le créneau suivant ferme l'alerte.
    await runDetectionRules({ rules: [rule], now: new Date(NOW.getTime() + 24 * HOUR_MS) })
    await runDetectionRules({ rules: [rule], now: new Date(createdAt.getTime() + 49 * HOUR_MS) })
    expect(messages().map((message) => message.split(" · ")[0])).toEqual(["Entrée en alerte", "Sortie d'alerte"])
  })

  const notifiedSlots = (lines: Awaited<ReturnType<typeof replayDetectionRule>>["lines"]) =>
    lines.filter(({ notifications }) => notifications.length).map(({ slot, notifications }) => `${slot} ${notifications.join(",")}`)

  // Les rejeux enchaînent une centaine d'évaluations horaires : plus de 5 s sur les runners de la CI, d'où le délai explicite.
  it("rejoue un dépôt massif sur une fenêtre de 24 h : entrée au créneau qui suit la 5e offre, sortie à la fin du suivi, sans rappel", async () => {
    const createdAt = new Date("2026-10-13T08:30:00Z")
    const user = await createAccount(createdAt)
    await depositOffers(user._id, every(new Date("2026-10-13T09:00:00Z"), 5, 30 * MINUTE_MS))

    const { lines, episodes } = await replayDetectionRule({ rule, from: new Date("2026-10-13T00:00:00Z"), to: new Date("2026-10-16T00:00:00Z"), thresholds: SHORT })

    // 5e offre à 11:00 : vue au créneau de 12:00. Suivi jusqu'à 48 h après l'ouverture, soit le créneau de 08:00 le 15/10.
    expect(episodes).toEqual([{ key: user._id.toHexString(), opened_at: new Date("2026-10-13T12:00:00Z"), closed_at: new Date("2026-10-15T09:00:00Z"), notifications: 2 }])
    expect(notifiedSlots(lines)).toEqual(["2026-10-13T12:00:00.000Z entree", "2026-10-15T09:00:00.000Z sortie"])
    expect(notifyToSlack).not.toHaveBeenCalled()
  }, 20_000)

  it("rejoue une désactivation : sortie au créneau qui suit, et une offre déposée en fin de fenêtre vue pendant le suivi", async () => {
    const createdAt = new Date("2026-10-13T08:30:00Z")
    const deactivated = await createAccount(createdAt, { events: deactivatedEvents(createdAt, new Date("2026-10-13T15:20:00Z")) })
    await depositOffers(deactivated._id, every(new Date("2026-10-13T09:00:00Z"), 5, 30 * MINUTE_MS))
    // 5e offre une minute avant la fin des 24 h : vue au créneau suivant, pendant le délai de maintien.
    const late = await createAccount(createdAt)
    await depositOffers(late._id, every(new Date("2026-10-14T08:25:00Z"), 5, MINUTE_MS))

    const { episodes } = await replayDetectionRule({ rule, from: new Date("2026-10-13T00:00:00Z"), to: new Date("2026-10-16T00:00:00Z"), thresholds: SHORT })

    expect(episodes).toEqual([
      { key: deactivated._id.toHexString(), opened_at: new Date("2026-10-13T12:00:00Z"), closed_at: new Date("2026-10-13T16:00:00Z"), notifications: 2 },
      // Fin du suivi 24 h après l'entrée, avant le rappel.
      { key: late._id.toHexString(), opened_at: new Date("2026-10-14T09:00:00Z"), closed_at: new Date("2026-10-15T09:00:00Z"), notifications: 2 },
    ])
  }, 20_000)

  it("signale par défaut 20 postes cumulés dans les 7 jours, sous le seuil d'offres", async () => {
    const createdAt = new Date(NOW.getTime() - 5 * DAY_MS)
    const user = await createAccount(createdAt)
    await depositOffers(user._id, every(new Date(createdAt.getTime() + 3 * DAY_MS), 2, HOUR_MS), { offer_opening_count: 10 })

    const [finding] = (await evaluate(NOW, defaults)).findings

    expect(finding.metrics).toMatchObject({ offres: 2, postes: 20, critere_volume: false, critere_postes: true })
    expect(finding.summary).toContain("a déposé 2 offres (20 postes) dans les 4 jours suivant son ouverture")
  })

  it("(faux positif) n'alerte pas par défaut sur 9 offres et 19 postes dans les 7 jours", async () => {
    const createdAt = new Date(NOW.getTime() - 5 * DAY_MS)
    const user = await createAccount(createdAt)
    await depositOffers(user._id, every(new Date(createdAt.getTime() + DAY_MS), 8, HOUR_MS))
    await depositOffers(user._id, [new Date(createdAt.getTime() + 4 * DAY_MS)], { offer_opening_count: 11 })

    const { findings, observations } = await evaluate(NOW, defaults)

    expect(findings).toEqual([])
    expect(observations).toMatchObject({ max_offres_compte: 9, max_postes_compte: 19 })
  })

  it("rejoue un dépôt sur les seuils par défaut : une alerte de 8 jours au plus, un seul rappel", async () => {
    const createdAt = new Date("2026-10-10T08:30:00Z")
    const user = await createAccount(createdAt)
    // 10e offre le 11/10 à 13:30 : vue au créneau de 14:00.
    await depositOffers(user._id, every(new Date("2026-10-11T09:00:00Z"), 10, 30 * MINUTE_MS))

    const { lines, episodes } = await replayDetectionRule({ rule, from: new Date("2026-10-10T00:00:00Z"), to: new Date("2026-10-19T00:00:00Z"), thresholds: defaults })

    // Suivi jusqu'à 192 h après l'ouverture, soit le créneau de 08:00 le 18/10.
    expect(episodes).toEqual([{ key: user._id.toHexString(), opened_at: new Date("2026-10-11T14:00:00Z"), closed_at: new Date("2026-10-18T09:00:00Z"), notifications: 3 }])
    expect(notifiedSlots(lines)).toEqual(["2026-10-11T14:00:00.000Z entree", "2026-10-15T14:00:00.000Z rappel", "2026-10-18T09:00:00.000Z sortie"])
  }, 30_000)

  it("lit les rôles par l'index { authorized_type, createdAt }, puis les rôles anciens par user_id, les comptes par _id et les offres par managed_by", async () => {
    for (const hoursAgo of [2, 10, 30]) {
      const user = await createAccount(new Date(NOW.getTime() - hoursAgo * HOUR_MS))
      await depositOffers(user._id, every(new Date(NOW.getTime() - HOUR_MS), 3, MINUTE_MS))
    }
    // Comme en production, les rôles et les offres LBA d'autres comptes sont bien plus nombreux que ceux d'un compte neuf.
    for (let index = 0; index < 10; index++) {
      const established = await createAccount(new Date(NOW.getTime() - 60 * DAY_MS))
      await depositOffers(established._id, every(new Date(NOW.getTime() - 3 * HOUR_MS), 5, MINUTE_MS))
    }
    await depositOffers(null, every(new Date(NOW.getTime() - HOUR_MS), 50, MINUTE_MS), { partner_label: JOBPARTNERS_LABEL.HELLOWORK })

    const explain = await getDbCollection("rolemanagements")
      .aggregate(recentAccountsPipeline(getObservationStart(NOW, defaults), NOW, defaults.windowHours * HOUR_MS))
      .explain("executionStats")
    const lookups = explain.stages.filter((stage: Record<string, unknown>) => "$lookup" in stage)

    expect(JSON.stringify(explain.stages[0])).toContain("authorized_type_1_createdAt_1")
    expect(JSON.stringify(explain)).not.toContain("COLLSCAN")
    expect(lookups).toMatchObject([
      { $lookup: { from: "rolemanagements" }, collectionScans: 0, indexesUsed: [expect.stringMatching(/^user_id_1/)] },
      { $lookup: { from: "userswithaccounts" }, collectionScans: 0, indexesUsed: ["_id_"] },
      { $lookup: { from: "jobs_partners" }, collectionScans: 0, indexesUsed: ["managed_by_1"] },
    ])
  })
})
