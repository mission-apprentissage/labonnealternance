import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { generateCfaFixture } from "shared/fixtures/cfa.fixture"
import { generateEntrepriseFixture } from "shared/fixtures/entreprise.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { generateRoleManagementFixture, generateRoleManagementStatusEventFixture } from "shared/fixtures/role-management.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/user-with-account.fixture"
import type { IEntreprise } from "shared/models/entreprise.model"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IRoleManagementEvent } from "shared/models/role-management.model"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import type { IUserWithAccount } from "shared/models/user-with-account.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack, SLACK_MESSAGE_MAX_LENGTH } from "@/common/utils/slack-utils"
import config from "@/config"
import { configureDetectionRule } from "@/jobs/detection/detection-cli"
import { assertValidEvaluation, nextAlertState, runDetectionRules } from "@/jobs/detection/detection-engine"
import { formatDetectionNotification } from "@/jobs/detection/detection-notification"
import { replayDetectionRule } from "@/jobs/detection/detection-replay"
import { JOB_PENDING_EXPIRATION_ORIGIN } from "@/services/job-partner-status.service"
import type { ISiretAccount, ISiretAccounts } from "./multi-account-siret-alert"
import { buildSiretFinding, countEmailIdentities, evaluateMultiAccountSiret, multiAccountSiretRule, multiAccountSiretsPipeline } from "./multi-account-siret-alert"

vi.mock("@/common/utils/slack-utils")
vi.mock("@/common/utils/sentry-utils")

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

const rule = multiAccountSiretRule
const defaults = rule.thresholds.parse({})
const withHold = rule.thresholds.parse({ exitRatio: 0.5 })
// Isole un critère d'un test dont les comptes ne peuvent pas être créés à moins de 24 h d'écart.
const anyCreationGap = rule.thresholds.parse({ maxCreationGapHours: 1_000_000 })

const DOMAINE_GROUPE = "groupe.exemple.fr"
const AUTRE_DOMAINE = "cabinet-rh.exemple.fr"
const WEBMAIL = "gmail.com"
// SIRET fictifs : 14 chiffres, aucun établissement réel.
const SIRET = "00000000000017"
const AUTRE_SIRET = "00000000000025"

const messages = () => vi.mocked(notifyToSlack).mock.calls.map(([{ message }]) => message)

const account = (domain: string, activeOffers: number, createdAt = new Date("2026-01-15T10:00:00Z")): ISiretAccount => ({ userId: new ObjectId(), createdAt, domain, activeOffers })

describe("countEmailIdentities", () => {
  it("compte une fois un domaine d'entreprise, chaque compte webmail à part", () => {
    expect(countEmailIdentities([{ domain: DOMAINE_GROUPE }, { domain: DOMAINE_GROUPE }, { domain: DOMAINE_GROUPE }])).toEqual({
      identities: 1,
      corporateDomains: 1,
      webmailAccounts: 0,
    })
    expect(countEmailIdentities([{ domain: WEBMAIL }, { domain: WEBMAIL }])).toEqual({ identities: 2, corporateDomains: 0, webmailAccounts: 2 })
    expect(countEmailIdentities([{ domain: DOMAINE_GROUPE }, { domain: AUTRE_DOMAINE }, { domain: WEBMAIL }])).toEqual({ identities: 3, corporateDomains: 2, webmailAccounts: 1 })
  })

  it("compte à part une adresse sans domaine lisible", () => {
    expect(countEmailIdentities([{ domain: "" }, { domain: DOMAINE_GROUPE }])).toEqual({ identities: 2, corporateDomains: 1, webmailAccounts: 1 })
  })
})

describe("evaluateMultiAccountSiret", () => {
  it("(faux positif) n'alerte pas sur des collègues qui publient sous le domaine de leur entreprise, quel que soit leur nombre", () => {
    const colleagues = { accounts: Array.from({ length: 12 }, () => account(DOMAINE_GROUPE, 3)) }
    expect(evaluateMultiAccountSiret(colleagues, defaults)).toMatchObject({ accounts: 12, accountsWithOffers: 12, identities: 1, alert: false })
    expect(evaluateMultiAccountSiret(colleagues, rule.thresholds.parse({ minIdentities: 1 })).alert).toBe(true)
  })

  it("(faux positif) n'alerte pas tant qu'un seul compte publie, même parmi plusieurs comptes actifs d'identités différentes", () => {
    const evaluation = evaluateMultiAccountSiret({ accounts: [account(DOMAINE_GROUPE, 4), account(WEBMAIL, 0), account(AUTRE_DOMAINE, 0)] }, defaults)
    expect(evaluation).toMatchObject({ accounts: 3, accountsWithOffers: 1, identities: 3, alert: false })
  })

  it("(faux positif) ne compte que les identités des comptes qui publient pour entrer en alerte", () => {
    // Deux collègues publient, le compte webmail n'a pas d'offre : rien de suspect ne publie.
    const evaluation = evaluateMultiAccountSiret({ accounts: [account(DOMAINE_GROUPE, 1), account(DOMAINE_GROUPE, 2), account(WEBMAIL, 0)] }, defaults)
    expect(evaluation).toMatchObject({ accountsWithOffers: 2, identities: 2, alert: false })
  })

  it("(faux positif) n'alerte pas sur deux comptes qui publient, créés à 24 h d'écart ou plus, frontière comprise", () => {
    const created = new Date("2026-01-15T10:00:00Z")
    const pair = (gapMs: number) => ({ accounts: [account(DOMAINE_GROUPE, 1, created), account(WEBMAIL, 1, new Date(created.getTime() + gapMs))] })

    expect(evaluateMultiAccountSiret(pair(24 * HOUR_MS), defaults)).toMatchObject({ alert: false, closeCreations: false, enoughIdentities: true })
    expect(evaluateMultiAccountSiret(pair(24 * HOUR_MS - 1), defaults)).toMatchObject({ alert: true, closeCreations: true })
    expect(evaluateMultiAccountSiret(pair(400 * DAY_MS), anyCreationGap).alert).toBe(true)
  })

  it("(faux positif) ne lit l'écart de création qu'entre comptes qui publient pour entrer en alerte", () => {
    // Le compte sans offre a été créé juste après le premier ; celui qui publie, un mois plus tard.
    const created = new Date("2026-01-15T10:00:00Z")
    const accounts = [
      account(DOMAINE_GROUPE, 1, created),
      account(WEBMAIL, 0, new Date(created.getTime() + 2 * HOUR_MS)),
      account(WEBMAIL, 1, new Date(created.getTime() + 30 * DAY_MS)),
    ]

    expect(evaluateMultiAccountSiret({ accounts }, defaults)).toMatchObject({ accountsWithOffers: 2, closestCreationGapHours: 2, closeCreations: false, alert: false })
  })

  it("lit les identités et l'écart de création indépendamment, au-delà de deux comptes qui publient", () => {
    // Deux collègues créés le même jour, un compte webmail un an plus tard : la paire rapprochée partage un domaine.
    const created = new Date("2025-01-15T10:00:00Z")
    const accounts = [
      account(DOMAINE_GROUPE, 1, created),
      account(DOMAINE_GROUPE, 1, new Date(created.getTime() + HOUR_MS)),
      account(WEBMAIL, 1, new Date(created.getTime() + 365 * DAY_MS)),
    ]

    expect(evaluateMultiAccountSiret({ accounts }, defaults)).toMatchObject({ identities: 2, closestCreationGapHours: 1, alert: true })
  })

  it.each([
    ["un domaine d'entreprise et un webmail", [DOMAINE_GROUPE, WEBMAIL]],
    ["deux webmails du même fournisseur", [WEBMAIL, WEBMAIL]],
    ["deux domaines d'entreprise", [DOMAINE_GROUPE, AUTRE_DOMAINE]],
  ])("alerte sur deux comptes qui publient avec %s", (_label, domains) => {
    expect(evaluateMultiAccountSiret({ accounts: domains.map((domain) => account(domain, 1)) }, defaults)).toMatchObject({ alert: true, held: false })
  })

  it("applique le seuil de comptes, frontière comprise", () => {
    const thresholds = rule.thresholds.parse({ minAccounts: 3 })
    expect(evaluateMultiAccountSiret({ accounts: [account(DOMAINE_GROUPE, 1), account(WEBMAIL, 1)] }, thresholds).alert).toBe(false)
    expect(evaluateMultiAccountSiret({ accounts: [account(DOMAINE_GROUPE, 1), account(WEBMAIL, 1), account(DOMAINE_GROUPE, 1)] }, thresholds).alert).toBe(true)
  })

  it("applique le seuil d'identités, frontière comprise", () => {
    const thresholds = rule.thresholds.parse({ minAccounts: 3, minIdentities: 3 })
    const accounts = [account(DOMAINE_GROUPE, 1), account(WEBMAIL, 1), account(DOMAINE_GROUPE, 1)]
    expect(evaluateMultiAccountSiret({ accounts }, thresholds).alert).toBe(false)
    expect(evaluateMultiAccountSiret({ accounts: [...accounts.slice(0, 2), account(AUTRE_DOMAINE, 1)] }, thresholds).alert).toBe(true)
  })

  it("refuse un seuil de comptes sous 2 : un compte seul sur son SIRET n'est pas un doublon", () => {
    expect(() => rule.thresholds.parse({ minAccounts: 1 })).toThrow()
  })

  describe("alerte ouverte", () => {
    const suspicious = (corporateOffers: number, webmailOffers: number) => ({ accounts: [account(DOMAINE_GROUPE, corporateOffers), account(WEBMAIL, webmailOffers)] })

    it("par défaut, se ferme dès qu'il reste moins de deux comptes qui publient", () => {
      expect(evaluateMultiAccountSiret(suspicious(2, 1), defaults, true)).toMatchObject({ alert: true, held: false })
      expect(evaluateMultiAccountSiret(suspicious(2, 0), defaults, true).alert).toBe(false)
    })

    it("lit alors les critères sur l'ensemble des comptes actifs", () => {
      // Les deux comptes qui publient sont créés à un mois d'écart, un troisième sans offre deux heures après le premier.
      const created = new Date("2026-01-15T10:00:00Z")
      const accounts = [
        account(DOMAINE_GROUPE, 1, created),
        account(WEBMAIL, 0, new Date(created.getTime() + 2 * HOUR_MS)),
        account(WEBMAIL, 1, new Date(created.getTime() + 30 * DAY_MS)),
      ]

      expect(evaluateMultiAccountSiret({ accounts }, defaults, true)).toMatchObject({ alert: true, held: true })
      expect(evaluateMultiAccountSiret({ accounts }, defaults).alert).toBe(false)
      expect(evaluateMultiAccountSiret({ accounts: [accounts[0], accounts[2]] }, defaults, true).alert).toBe(false)
    })

    it("avec maintien, reste ouverte tant que les comptes restent actifs et qu'un seul publie encore", () => {
      expect(evaluateMultiAccountSiret(suspicious(2, 0), withHold, true)).toMatchObject({ alert: true, held: true })
      expect(evaluateMultiAccountSiret(suspicious(0, 1), withHold, true)).toMatchObject({ alert: true, held: true })
      expect(evaluateMultiAccountSiret(suspicious(2, 0), withHold)).toMatchObject({ alert: false, held: false })
      expect(evaluateMultiAccountSiret(suspicious(2, 1), withHold, true)).toMatchObject({ alert: true, held: false })
    })

    it("se ferme quand plus aucun compte ne publie", () => {
      expect(evaluateMultiAccountSiret(suspicious(0, 0), withHold, true).alert).toBe(false)
    })

    it("se ferme quand le support désactive le compte en trop", () => {
      expect(evaluateMultiAccountSiret({ accounts: [account(DOMAINE_GROUPE, 2)] }, withHold, true).alert).toBe(false)
    })

    it("se ferme quand les comptes restants partagent un domaine d'entreprise", () => {
      expect(evaluateMultiAccountSiret({ accounts: [account(DOMAINE_GROUPE, 2), account(DOMAINE_GROUPE, 0)] }, withHold, true).alert).toBe(false)
    })

    it("arrondit au compte supérieur la part de comptes qui doivent publier encore, frontière comprise", () => {
      const thresholds = rule.thresholds.parse({ minAccounts: 3, exitRatio: 0.5 })
      const accounts = (offers: number[]) => ({ accounts: offers.map((count, index) => account(index ? WEBMAIL : DOMAINE_GROUPE, count)) })
      expect(evaluateMultiAccountSiret(accounts([1, 1, 0]), thresholds, true)).toMatchObject({ alert: true, held: true })
      expect(evaluateMultiAccountSiret(accounts([1, 0, 0]), thresholds, true).alert).toBe(false)
    })
  })
})

describe("constat sur un SIRET", () => {
  const siretAccounts = (accounts: ISiretAccount[]): ISiretAccounts => ({ siret: SIRET, accounts })
  const findingFor = (evaluated: ISiretAccounts, open = false) => buildSiretFinding(evaluated, evaluateMultiAccountSiret(evaluated, defaults, open), defaults)

  it("passe le garde-fou du socle et ne restitue ni domaine ni adresse", () => {
    const finding = findingFor(siretAccounts([account(DOMAINE_GROUPE, 2), account(WEBMAIL, 1)]))
    expect(() => assertValidEvaluation(rule, { findings: [finding] })).not.toThrow()
    expect(JSON.stringify(finding)).not.toContain(DOMAINE_GROUPE)
    expect(JSON.stringify(finding)).not.toContain(WEBMAIL)
  })

  it("(faux positif) est écarté par le socle si une adresse prenait la place du SIRET", () => {
    const evaluated = { siret: `recrutement@${DOMAINE_GROUPE}`, accounts: [account(DOMAINE_GROUPE, 2), account(WEBMAIL, 1)] }
    expect(() => assertValidEvaluation(rule, { findings: [findingFor(evaluated)] })).toThrow("adresse email détectée")
  })

  it("décrit les comptes par ancienneté, avec leurs offres, les identités email en nombre et l'écart de création", () => {
    const older = account(DOMAINE_GROUPE, 2, new Date("2026-02-04T08:00:00Z"))
    const newer = account(WEBMAIL, 1, new Date("2026-02-04T13:20:00Z"))
    const idle = account(AUTRE_DOMAINE, 0, new Date("2026-05-20T10:00:00Z"))
    const finding = findingFor(siretAccounts([older, newer, idle]))

    expect(finding.key).toBe(SIRET)
    expect(finding.summary).toBe(
      [
        `3 comptes entreprise actifs sur le SIRET ${SIRET}, dont 2 avec des offres en ligne (3 offres). Leurs adresses relèvent de 2 domaines d'entreprise et de 1 webmail. Comptes créés du 04/02/2026 au 20/05/2026. Les deux plus proches ont été créés à 5 heures d'écart.`,
        `Comptes : ${older.userId.toHexString()} (créé le 04/02/2026, 2 offres), ${newer.userId.toHexString()} (créé le 04/02/2026, 1 offre), ${idle.userId.toHexString()} (créé le 20/05/2026, 0 offre)`,
      ].join("\n")
    )
    expect(finding.metrics).toEqual({
      siret: SIRET,
      comptes_actifs: 3,
      comptes_avec_offres: 2,
      offres_actives: 3,
      domaines_entreprise: 2,
      comptes_webmail: 1,
      premiere_creation: "2026-02-04T08:00:00.000Z",
      derniere_creation: "2026-05-20T10:00:00.000Z",
      ecart_creation_min_heures: 5.3,
      comptes_ids: [older, newer, idle].map(({ userId }) => userId.toHexString()).join(","),
      maintenue_sous_le_seuil: false,
    })
    expect(finding.links).toEqual(
      [older, newer, idle].map(({ userId }) => ({
        label: `compte ${userId.toHexString()}`,
        url: `${config.publicUrl}/espace-pro/administration/users/${userId.toHexString()}`,
      }))
    )
  })

  it("explique dans le message pourquoi une alerte reste ouverte sous le seuil d'entrée", () => {
    // Les deux comptes qui publient partagent le domaine de l'entreprise : seul le compte webmail sans offre fait deux identités.
    const held = findingFor(siretAccounts([account(DOMAINE_GROUPE, 2), account(DOMAINE_GROUPE, 1), account(WEBMAIL, 0)]), true)

    expect(held.summary).toContain(
      "Sous le seuil d'entrée, l'alerte reste ouverte tant que le SIRET garde 2 comptes actifs, dont 2 comptes avec des offres en ligne, et que l'ensemble de ses comptes actifs remplit les critères d'identités et d'écart de création."
    )
    expect(held.metrics.maintenue_sous_le_seuil).toBe(true)
    expect(findingFor(siretAccounts([account(DOMAINE_GROUPE, 2), account(WEBMAIL, 1)])).summary).not.toContain("reste ouverte")

    const evaluated = siretAccounts([account(DOMAINE_GROUPE, 2), account(WEBMAIL, 0)])
    expect(buildSiretFinding(evaluated, evaluateMultiAccountSiret(evaluated, withHold, true), withHold).summary).toContain("dont 1 compte avec des offres en ligne,")
  })

  it.each([
    [0, "moins d'une heure"],
    [59 * 60 * 1000, "moins d'une heure"],
    [HOUR_MS, "1 heure"],
    [48 * HOUR_MS - 1, "47 heures"],
    [48 * HOUR_MS, "2 jours"],
    [45 * DAY_MS, "45 jours"],
  ])("formule un écart de création de %i ms : %s", (gapMs, text) => {
    const created = new Date("2026-01-15T10:00:00Z")
    const finding = findingFor(siretAccounts([account(DOMAINE_GROUPE, 1, created), account(WEBMAIL, 1, new Date(created.getTime() + gapMs))]))
    expect(finding.summary).toContain(`Les deux plus proches ont été créés à ${text} d'écart.`)
  })

  it("plafonne les comptes cités et les liens, la liste complète restant dans les métriques", () => {
    const accounts = Array.from({ length: 45 }, (_, index) => account(index % 2 ? WEBMAIL : DOMAINE_GROUPE, 1, new Date(Date.UTC(2026, 0, 1 + index))))
    const finding = findingFor(siretAccounts(accounts))

    expect(finding.summary).toContain(`${accounts[19].userId.toHexString()} (créé le 20/01/2026, 1 offre) et 25 autres`)
    expect(finding.summary).not.toContain(accounts[20].userId.toHexString())
    expect(finding.links).toHaveLength(10)
    expect(String(finding.metrics.comptes_ids).split(",")).toHaveLength(45)
  })

  it("tient sous la longueur d'un message Slack au pire cas : rappel, alerte maintenue, 500 comptes à 999 offres, URL de production", () => {
    const publicUrl = config.publicUrl
    config.publicUrl = "https://labonnealternance.apprentissage.beta.gouv.fr"
    try {
      const accounts = Array.from({ length: 500 }, (_, index) => account(index % 2 ? WEBMAIL : `domaine-${index}.exemple.fr`, 999, new Date(Date.UTC(2026, 0, 1 + index))))
      const evaluated = siretAccounts(accounts)
      const evaluation = { ...evaluateMultiAccountSiret(evaluated, defaults, true), held: true }
      const finding = buildSiretFinding(evaluated, evaluation, defaults)
      const openedAt = new Date("2026-10-05T06:00:00Z")
      const alert = nextAlertState(rule, { type: "entree", finding, hits: 1, alert: null }, openedAt)
      if (!alert) throw new Error("épisode attendu")

      const message = formatDetectionNotification(rule, "rappel", alert, finding.links, new Date(openedAt.getTime() + 400 * DAY_MS))

      expect(message).toContain(`${config.publicUrl}/espace-pro/administration/users/`)
      expect(message).toContain("l'alerte reste ouverte")
      expect(message).toContain("(499500 offres)")
      expect(message.length).toBeLessThanOrEqual(SLACK_MESSAGE_MAX_LENGTH)
    } finally {
      config.publicUrl = publicUrl
    }
  })
})

describe("règle comptes_multiples_siret dans le socle de détection", () => {
  useMongo()

  // Créneau de la règle : chaque jour à 6 h UTC.
  const NOW = new Date("2026-11-18T06:00:00Z")
  const daysFromNow = (days: number, hours = 0) => new Date(NOW.getTime() + days * DAY_MS + hours * HOUR_MS)
  let sequence = 0

  beforeEach(() => {
    sequence = 0
    vi.mocked(notifyToSlack).mockReset()
  })

  const event = (status: AccessStatus, date: Date, validation_type = VALIDATION_UTILISATEUR.AUTO) =>
    generateRoleManagementStatusEventFixture({ status, date, validation_type, reason: status === AccessStatus.DENIED ? "désactivé par un administrateur" : "" })

  const grantedSince = (date: Date): IRoleManagementEvent[] => [event(AccessStatus.AWAITING_VALIDATION, date), event(AccessStatus.GRANTED, date)]

  const insertEntreprise = async (siret = SIRET) => {
    const entreprise = generateEntrepriseFixture({ siret, raison_sociale: "Entreprise fictive", enseigne: "Enseigne fictive" })
    await getDbCollection("entreprises").insertOne(entreprise)
    return entreprise
  }

  type IAccountOptions = { createdAt?: Date; status?: IRoleManagementEvent[]; type?: AccessEntityType; authorizedId?: string }

  /** Un utilisateur et son rôle sur l'organisation, actif depuis la création du rôle par défaut. */
  const insertAccount = async (
    organization: { _id: ObjectId },
    domain: string,
    { createdAt = daysFromNow(-200), status, type = AccessEntityType.ENTREPRISE }: IAccountOptions = {}
  ) => {
    sequence++
    const user = generateUserWithAccountFixture({ email: `recrutement.${sequence}@${domain}`, createdAt, updatedAt: createdAt })
    await getDbCollection("userswithaccounts").insertOne(user)
    await getDbCollection("rolemanagements").insertOne(
      generateRoleManagementFixture({
        user_id: user._id,
        authorized_id: organization._id.toString(),
        authorized_type: type,
        createdAt,
        updatedAt: createdAt,
        status: status ?? grantedSince(createdAt),
      })
    )
    return user
  }

  /** Une offre LBA déposée par le compte au SIRET, en ligne depuis 10 jours et pour 50 jours par défaut. */
  const insertOffer = async (user: IUserWithAccount, siret: string, data: Partial<IJobsPartnersOfferPrivate> = {}) => {
    const offer = generateJobsPartnersOfferPrivate({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      managed_by: user._id,
      workplace_siret: siret,
      created_at: daysFromNow(-10),
      updated_at: daysFromNow(-10),
      offer_creation: daysFromNow(-10),
      offer_expiration: daysFromNow(50),
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_status_history: [],
      ...data,
    })
    await getDbCollection("jobs_partners").insertOne(offer)
    return offer
  }

  const historyEvent = (status: JOB_STATUS_ENGLISH, date: Date, granted_by = "test") => ({ status, date, reason: "test", granted_by })

  /** Un SIRET suspect : un compte au domaine de l'entreprise et un compte webmail créé trois heures après, chacun avec une offre en ligne. */
  const insertSuspiciousSiret = async (entreprise: IEntreprise) => {
    const corporate = await insertAccount(entreprise, DOMAINE_GROUPE, { createdAt: daysFromNow(-30, -3) })
    const webmail = await insertAccount(entreprise, WEBMAIL, { createdAt: daysFromNow(-30) })
    await insertOffer(corporate, entreprise.siret)
    await insertOffer(webmail, entreprise.siret)
    return { corporate, webmail }
  }

  const evaluate = (now = NOW, thresholds = defaults) => rule.evaluate({ now, thresholds, activeAlerts: [] })
  const alertedSirets = async (now = NOW, thresholds = defaults) => (await evaluate(now, thresholds)).findings.map(({ key }) => key)

  it("(faux positif) n'alerte pas sur les collègues d'un même établissement qui publient sous le domaine de leur entreprise", async () => {
    const entreprise = await insertEntreprise()
    for (let index = 0; index < 3; index++) {
      await insertOffer(await insertAccount(entreprise, DOMAINE_GROUPE), SIRET)
    }

    const { findings, observations } = await evaluate()

    expect(findings).toEqual([])
    expect(observations).toEqual({
      sirets_candidats: 1,
      sirets_au_seuil_de_comptes: 1,
      sirets_ecartes_par_les_identites: 1,
      sirets_ecartes_par_l_ecart_de_creation: 0,
      sirets_en_alerte: 0,
      max_comptes_avec_offres: 3,
      comptes_supprimes: 0,
      roles_sans_siret: 0,
    })
    expect(await alertedSirets(NOW, rule.thresholds.parse({ minIdentities: 1 }))).toEqual([SIRET])
  })

  it("(faux positif) n'alerte pas sur deux comptes d'identités différentes qui publient, créés à plusieurs mois d'écart", async () => {
    const entreprise = await insertEntreprise()
    await insertOffer(await insertAccount(entreprise, DOMAINE_GROUPE, { createdAt: daysFromNow(-400) }), SIRET)
    await insertOffer(await insertAccount(entreprise, WEBMAIL, { createdAt: daysFromNow(-30) }), SIRET)

    const { findings, observations } = await evaluate()

    expect(findings).toEqual([])
    expect(observations).toMatchObject({ sirets_au_seuil_de_comptes: 1, sirets_ecartes_par_les_identites: 0, sirets_ecartes_par_l_ecart_de_creation: 1 })
    expect(await alertedSirets(NOW, anyCreationGap)).toEqual([SIRET])
  })

  it("(faux positif) ne compte pas un compte désactivé qui garde des offres en ligne, quel que soit l'ordre de l'historique", async () => {
    const entreprise = await insertEntreprise()
    const { webmail } = await insertSuspiciousSiret(entreprise)
    // Désactivation enregistrée avant la création dans le tableau, mais datée après.
    await getDbCollection("rolemanagements").updateOne(
      { user_id: webmail._id },
      { $set: { status: [event(AccessStatus.DENIED, daysFromNow(-1), VALIDATION_UTILISATEUR.MANUAL), ...grantedSince(daysFromNow(-30))] } }
    )

    expect(await alertedSirets()).toEqual([])

    // Réactivé après sa désactivation : il compte de nouveau.
    await getDbCollection("rolemanagements").updateOne(
      { user_id: webmail._id },
      { $push: { status: event(AccessStatus.GRANTED, daysFromNow(0, -1), VALIDATION_UTILISATEUR.MANUAL) } }
    )
    expect(await alertedSirets()).toEqual([SIRET])
  })

  it("(faux positif) ne compte pas un compte sans offre active", async () => {
    const entreprise = await insertEntreprise()
    const autreEntreprise = await insertEntreprise(AUTRE_SIRET)
    const corporate = await insertAccount(entreprise, DOMAINE_GROUPE)
    await insertOffer(corporate, SIRET)
    const webmail = await insertAccount(entreprise, WEBMAIL)
    // Le même utilisateur publie aussi pour une autre entreprise : ces offres ne relèvent pas du SIRET.
    await getDbCollection("rolemanagements").insertOne(
      generateRoleManagementFixture({
        user_id: webmail._id,
        authorized_id: autreEntreprise._id.toString(),
        createdAt: daysFromNow(-200),
        updatedAt: daysFromNow(-200),
        status: grantedSince(daysFromNow(-200)),
      })
    )
    await insertOffer(webmail, AUTRE_SIRET)
    await insertOffer(webmail, SIRET, { offer_expiration: daysFromNow(0, -1) })
    await insertOffer(webmail, SIRET, { offer_status: JOB_STATUS_ENGLISH.POURVUE, offer_status_history: [historyEvent(JOB_STATUS_ENGLISH.POURVUE, daysFromNow(-2))] })
    await insertOffer(webmail, SIRET, { offer_status: JOB_STATUS_ENGLISH.ANNULEE, offer_status_history: [historyEvent(JOB_STATUS_ENGLISH.ANNULEE, daysFromNow(-2))] })
    await insertOffer(webmail, SIRET, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE })
    await insertOffer(webmail, SIRET, {
      offer_status: JOB_STATUS_ENGLISH.EN_MODERATION,
      offer_status_history: [historyEvent(JOB_STATUS_ENGLISH.EN_MODERATION, daysFromNow(-10))],
    })
    await insertOffer(webmail, SIRET, { partner_label: JOBPARTNERS_LABEL.HELLOWORK })
    await insertOffer(webmail, SIRET, { created_at: daysFromNow(0, 1), updated_at: daysFromNow(0, 1) })

    // Avec maintien, un SIRET d'un seul compte qui publie reste candidat : l'observation montre qui a été compté.
    const { findings, observations } = await evaluate(NOW, withHold)

    expect(findings).toEqual([])
    expect(observations).toMatchObject({ sirets_candidats: 1, sirets_au_seuil_de_comptes: 0, max_comptes_avec_offres: 1 })
  })

  it("(faux positif) ne mêle pas aux comptes de l'entreprise le compte d'un CFA au même SIRET, ni ses offres déléguées", async () => {
    const entreprise = await insertEntreprise()
    const cfa = generateCfaFixture({ siret: SIRET })
    await getDbCollection("cfas").insertOne(cfa)
    const cfaUser = await insertAccount(cfa, WEBMAIL, { type: AccessEntityType.CFA })
    await insertOffer(cfaUser, SIRET, { is_delegated: true, cfa_siret: SIRET })
    await insertOffer(await insertAccount(entreprise, DOMAINE_GROUPE), SIRET)

    expect(await evaluate()).toMatchObject({ findings: [], observations: { sirets_candidats: 0 } })

    // Même avec un rôle sur l'entreprise, le compte CFA n'y apporte pas ses offres déléguées.
    await getDbCollection("rolemanagements").insertOne(
      generateRoleManagementFixture({
        user_id: cfaUser._id,
        authorized_id: entreprise._id.toString(),
        createdAt: daysFromNow(-200),
        updatedAt: daysFromNow(-200),
        status: grantedSince(daysFromNow(-200)),
      })
    )

    // Avec maintien, un SIRET d'un seul compte qui publie reste candidat : l'observation montre qui a été compté.
    const { findings, observations } = await evaluate(NOW, withHold)

    expect(findings).toEqual([])
    expect(observations).toMatchObject({ sirets_candidats: 1, sirets_au_seuil_de_comptes: 0 })
  })

  it("(faux positif) ne compte ni un compte en attente de validation, ni un rôle créé après le créneau, ni un compte supprimé", async () => {
    const entreprise = await insertEntreprise()
    await insertOffer(await insertAccount(entreprise, DOMAINE_GROUPE), SIRET)
    await insertOffer(await insertAccount(entreprise, WEBMAIL, { status: [event(AccessStatus.AWAITING_VALIDATION, daysFromNow(-20))] }), SIRET)
    // Rôle créé après le créneau, même avec un historique antidaté.
    await insertOffer(await insertAccount(entreprise, WEBMAIL, { createdAt: daysFromNow(0, 1), status: grantedSince(daysFromNow(-10)) }), SIRET, { created_at: daysFromNow(-1) })
    const deleted = await insertAccount(entreprise, WEBMAIL)
    await insertOffer(deleted, SIRET)
    await getDbCollection("userswithaccounts").deleteOne({ _id: deleted._id })

    // Le rôle postérieur au créneau ne peut pas être créé dans les 24 h du premier compte.
    const { findings, observations } = await evaluate(NOW, anyCreationGap)
    expect(findings).toEqual([])
    expect(observations).toMatchObject({ comptes_supprimes: 1, roles_sans_siret: 0 })
  })

  it("(faux positif) écarte les comptes d'une entreprise introuvable, et les compte dans les observations", async () => {
    // Un identifiant d'entreprise valide mais absent, puis un identifiant illisible.
    for (const organization of [{ _id: new ObjectId() }, { _id: { toString: () => "pas-un-identifiant" } as ObjectId }]) {
      for (const domain of [DOMAINE_GROUPE, WEBMAIL]) {
        await insertOffer(await insertAccount(organization, domain), SIRET)
      }
    }

    const { findings, observations } = await evaluate()

    expect(findings).toEqual([])
    expect(observations).toMatchObject({ sirets_candidats: 0, comptes_supprimes: 0, roles_sans_siret: 4 })
  })

  it("ne tourne pas tant qu'elle n'a pas été activée", async () => {
    await insertSuspiciousSiret(await insertEntreprise())

    await runDetectionRules({ rules: [rule], now: NOW })

    expect(notifyToSlack).not.toHaveBeenCalled()
    expect(await getDbCollection("detection_alerts").countDocuments({ rule_id: rule.id })).toBe(0)
  })

  it("une fois activée, notifie le SIRET avec ses comptes et leurs liens, sans adresse ni domaine", async () => {
    const entreprise = await insertEntreprise()
    const { corporate, webmail } = await insertSuspiciousSiret(entreprise)
    await insertOffer(webmail, SIRET)

    await configureDetectionRule({ rule: rule.id, enabled: "true", rules: [rule] })
    await runDetectionRules({ rules: [rule], now: NOW })

    expect(messages()).toHaveLength(1)
    const [message] = messages()
    expect(message).toContain("Entrée en alerte · Comptes actifs multiples sur un même SIRET (gravité moyenne)")
    expect(message).toContain(
      `2 comptes entreprise actifs sur le SIRET ${SIRET}, dont 2 avec des offres en ligne (3 offres). Leurs adresses relèvent de 1 domaine d'entreprise et de 1 webmail. Comptes créés du 19/10/2026 au 19/10/2026. Les deux plus proches ont été créés à 3 heures d'écart.`
    )
    expect(message).toContain(`Comptes : ${corporate._id.toHexString()} (créé le 19/10/2026, 1 offre), ${webmail._id.toHexString()} (créé le 19/10/2026, 2 offres)`)
    expect(message).toContain(`<${config.publicUrl}/espace-pro/administration/users/${corporate._id.toHexString()}|compte ${corporate._id.toHexString()}>`)
    expect(message).toContain(`\`comptes_multiples_siret\` · \`${SIRET}\``)
    expect(message).not.toContain("@")
    expect(message).not.toContain(DOMAINE_GROUPE)
    expect(message).not.toContain(WEBMAIL)
    expect(message).not.toContain("fictive")

    const [alert] = await getDbCollection("detection_alerts").find({ rule_id: rule.id }).toArray()
    expect(alert).toMatchObject({ key: SIRET, status: "ouverte", opening_metrics: { siret: SIRET, comptes_actifs: 2, comptes_avec_offres: 2, offres_actives: 3 } })
  })

  describe("reconstitution du stock à une date passée", () => {
    const PAST = daysFromNow(-30)

    it("lit les rôles et les offres tels qu'ils étaient au créneau", async () => {
      const entreprise = await insertEntreprise()
      const corporate = await insertAccount(entreprise, DOMAINE_GROUPE)
      // Pourvue depuis : en ligne au créneau passé.
      await insertOffer(corporate, SIRET, {
        created_at: daysFromNow(-40),
        offer_status: JOB_STATUS_ENGLISH.POURVUE,
        offer_status_history: [historyEvent(JOB_STATUS_ENGLISH.POURVUE, daysFromNow(-20))],
      })
      // Désactivé depuis : actif au créneau passé.
      const webmail = await insertAccount(entreprise, WEBMAIL, {
        createdAt: daysFromNow(-200, 2),
        status: [...grantedSince(daysFromNow(-200, 2)), event(AccessStatus.DENIED, daysFromNow(-10), VALIDATION_UTILISATEUR.MANUAL)],
      })
      await insertOffer(webmail, SIRET, { created_at: daysFromNow(-35) })
      // Rôle et offre postérieurs au créneau passé.
      await insertOffer(await insertAccount(entreprise, AUTRE_DOMAINE, { createdAt: daysFromNow(-20) }), SIRET, { created_at: daysFromNow(-20) })

      const [finding] = (await evaluate(PAST)).findings
      expect(finding.metrics).toMatchObject({ comptes_actifs: 2, comptes_avec_offres: 2, domaines_entreprise: 1, comptes_webmail: 1 })
      expect(await alertedSirets(NOW)).toEqual([])
    })

    it("(faux positif) ne compte une offre déposée en attente qu'à partir de sa publication", async () => {
      const entreprise = await insertEntreprise()
      await insertOffer(await insertAccount(entreprise, DOMAINE_GROUPE), SIRET, { created_at: daysFromNow(-60) })
      const webmail = await insertAccount(entreprise, WEBMAIL)
      await insertOffer(webmail, SIRET, { created_at: daysFromNow(-40), offer_status_history: [historyEvent(JOB_STATUS_ENGLISH.ACTIVE, daysFromNow(-25))] })
      await insertOffer(webmail, SIRET, {
        created_at: daysFromNow(-40),
        offer_status: JOB_STATUS_ENGLISH.ANNULEE,
        offer_status_history: [historyEvent(JOB_STATUS_ENGLISH.ANNULEE, daysFromNow(-20), JOB_PENDING_EXPIRATION_ORIGIN)],
      })

      expect(await alertedSirets(PAST)).toEqual([])
      expect(await alertedSirets(daysFromNow(-24))).toEqual([SIRET])
    })

    it("(faux positif) ne compte pas une offre au créneau où elle était expirée, même republiée depuis", async () => {
      const entreprise = await insertEntreprise()
      await insertOffer(await insertAccount(entreprise, DOMAINE_GROUPE), SIRET, { created_at: daysFromNow(-100) })
      await insertOffer(await insertAccount(entreprise, WEBMAIL), SIRET, {
        created_at: daysFromNow(-120),
        offer_status_history: [historyEvent(JOB_STATUS_ENGLISH.ANNULEE, daysFromNow(-60), "expire-jobs-partners"), historyEvent(JOB_STATUS_ENGLISH.ACTIVE, daysFromNow(-10))],
      })

      expect(await alertedSirets(PAST)).toEqual([])
      expect(await alertedSirets(daysFromNow(-70))).toEqual([SIRET])
      expect(await alertedSirets(NOW)).toEqual([SIRET])
    })

    it("lit l'historique d'une offre par date, pas par position", async () => {
      const entreprise = await insertEntreprise()
      await insertOffer(await insertAccount(entreprise, DOMAINE_GROUPE), SIRET, { created_at: daysFromNow(-60) })
      // Republication enregistrée avant la clôture dans le tableau, mais datée après.
      await insertOffer(await insertAccount(entreprise, WEBMAIL), SIRET, {
        created_at: daysFromNow(-120),
        offer_status_history: [historyEvent(JOB_STATUS_ENGLISH.ACTIVE, daysFromNow(-10)), historyEvent(JOB_STATUS_ENGLISH.ANNULEE, daysFromNow(-60), "expire-jobs-partners")],
      })

      expect(await alertedSirets(PAST)).toEqual([])
      expect(await alertedSirets(NOW)).toEqual([SIRET])
    })

    // 30 égalités, au-delà du seuil où $sortArray les mélange (cf. lastEventOf).
    it("retient à date égale le dernier événement du tableau, comme getLastStatusEvent", async () => {
      const entreprise = await insertEntreprise()
      const { webmail } = await insertSuspiciousSiret(entreprise)
      const sameDate = daysFromNow(-20)
      const ties = (statuses: AccessStatus[]) => statuses.map((status) => event(status, sameDate))
      const setRoleStatus = (status: IRoleManagementEvent[]) => getDbCollection("rolemanagements").updateOne({ user_id: webmail._id }, { $set: { status } })

      await setRoleStatus(ties([...Array(29).fill(AccessStatus.GRANTED), AccessStatus.DENIED]))
      expect(await alertedSirets()).toEqual([])

      await setRoleStatus(ties([...Array(29).fill(AccessStatus.DENIED), AccessStatus.GRANTED]))
      expect(await alertedSirets()).toEqual([SIRET])

      const offerHistory = (statuses: JOB_STATUS_ENGLISH[]) => statuses.map((status) => historyEvent(status, sameDate))
      const setOfferHistory = (history: ReturnType<typeof offerHistory>) =>
        getDbCollection("jobs_partners").updateMany({ managed_by: webmail._id }, { $set: { offer_status_history: history } })

      await setOfferHistory(offerHistory([...Array(29).fill(JOB_STATUS_ENGLISH.ACTIVE), JOB_STATUS_ENGLISH.ANNULEE]))
      expect(await alertedSirets()).toEqual([])

      await setOfferHistory(offerHistory([...Array(29).fill(JOB_STATUS_ENGLISH.ANNULEE), JOB_STATUS_ENGLISH.ACTIVE]))
      expect(await alertedSirets()).toEqual([SIRET])
    })
  })

  const notifiedSlots = (lines: Awaited<ReturnType<typeof replayDetectionRule>>["lines"]) =>
    lines.filter(({ notifications }) => notifications.length).map(({ slot, notifications }) => `${slot.slice(0, 10)} ${notifications.join(",")}`)

  /** Le compte au domaine de l'entreprise publie sans interruption, le compte webmail par périodes de 10 jours, puis le support le désactive. */
  const seedIntermittentPublisher = async () => {
    const entreprise = await insertEntreprise()
    await insertOffer(await insertAccount(entreprise, DOMAINE_GROUPE, { createdAt: daysFromNow(-80, -2) }), SIRET, {
      created_at: daysFromNow(-90),
      offer_expiration: daysFromNow(60),
    })
    const webmail = await insertAccount(entreprise, WEBMAIL, {
      createdAt: daysFromNow(-80),
      status: [...grantedSince(daysFromNow(-80)), event(AccessStatus.DENIED, daysFromNow(-5, -1), VALIDATION_UTILISATEUR.MANUAL)],
    })
    for (const start of [-50, -30, -10]) {
      await insertOffer(webmail, SIRET, { created_at: daysFromNow(start, -1), offer_expiration: daysFromNow(start + 10, -1) })
    }
  }

  it("par défaut, ouvre un épisode par période de publication commune et notifie chaque entrée et chaque sortie", async () => {
    await seedIntermittentPublisher()

    const { lines, episodes } = await replayDetectionRule({ rule, from: daysFromNow(-60), to: NOW, thresholds: defaults })

    expect(episodes.map(({ opened_at, closed_at }) => [opened_at, closed_at])).toEqual([
      [daysFromNow(-50), daysFromNow(-40)],
      [daysFromNow(-30), daysFromNow(-20)],
      [daysFromNow(-10), daysFromNow(-5)],
    ])
    expect(notifiedSlots(lines)).toEqual(["2026-09-29 entree", "2026-10-09 sortie", "2026-10-19 entree", "2026-10-29 sortie", "2026-11-08 entree", "2026-11-13 sortie"])
    expect(notifyToSlack).not.toHaveBeenCalled()
  })

  it("avec maintien, n'ouvre qu'un épisode quand un compte publie par intermittence, et le ferme quand le support désactive le doublon", async () => {
    await seedIntermittentPublisher()

    const { lines, episodes } = await replayDetectionRule({ rule, from: daysFromNow(-60), to: NOW, thresholds: withHold })

    expect(episodes).toEqual([{ key: SIRET, opened_at: daysFromNow(-50), closed_at: daysFromNow(-5), notifications: 3 }])
    expect(notifiedSlots(lines)).toEqual(["2026-09-29 entree", "2026-10-29 rappel", "2026-11-13 sortie"])
  })

  it("lit les rôles par l'index { authorized_type, createdAt } et joint entreprises, offres et comptes par index", async () => {
    for (let index = 0; index < 5; index++) {
      await insertSuspiciousSiret(await insertEntreprise(String(index).padStart(14, "0")))
    }
    // Les offres LBA d'autres recruteurs : sans elles, tous les index sont aussi sélectifs et le choix du planificateur est arbitraire.
    await getDbCollection("jobs_partners").insertMany(
      Array.from({ length: 300 }, () =>
        generateJobsPartnersOfferPrivate({
          partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
          managed_by: new ObjectId(),
          created_at: daysFromNow(-10),
          offer_expiration: daysFromNow(50),
        })
      )
    )

    const explain = await getDbCollection("rolemanagements").aggregate(multiAccountSiretsPipeline(NOW, defaults)).explain("executionStats")
    const lookups = explain.stages.filter((stage: Record<string, unknown>) => "$lookup" in stage)

    expect(JSON.stringify(explain.stages[0])).toContain("authorized_type_1_createdAt_1")
    expect(JSON.stringify(explain)).not.toContain("COLLSCAN")
    expect(lookups.map(({ $lookup, collectionScans, indexesUsed }: Record<string, any>) => [$lookup.from, collectionScans, indexesUsed])).toEqual([
      ["entreprises", 0, ["_id_"]],
      ["jobs_partners", 0, ["managed_by_1"]],
      ["userswithaccounts", 0, ["_id_"]],
    ])
  })
})
