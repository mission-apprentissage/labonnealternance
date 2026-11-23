import type { ObjectId } from "mongodb"
import type { IDetectionMetrics } from "shared/models/detection-alerts.model"
import { DETECTION_ALERT_STATUS } from "shared/models/detection-alerts.model"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import { z } from "zod"

import { isFreeEmailProviderDomain } from "@/common/utils/mail-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import type { IDetectionFinding, IDetectionRule } from "@/jobs/detection/detection-rule"
import { JOB_PENDING_EXPIRATION_ORIGIN } from "@/services/job-partner-status.service"

// Le message doit tenir dans SLACK_MESSAGE_MAX_LENGTH : la liste complète reste dans les métriques de l'alerte.
const LISTED_ACCOUNTS = 20
const LINKED_ACCOUNTS = 10

const HOUR_MS = 60 * 60 * 1000

/** Un compte entreprise actif sur le SIRET. */
export type ISiretAccount = {
  userId: ObjectId
  /** Création du rôle sur l'entreprise. */
  createdAt: Date
  /** Domaine de l'adresse email : sert au critère d'identités, ne sort jamais de l'évaluation. */
  domain: string
  activeOffers: number
}

export type ISiretAccounts = { siret: string; accounts: ISiretAccount[] }

const thresholdsSchema = z.strictObject({
  minAccounts: z.number().int().gte(2).default(2).describe("Comptes actifs ayant chacun au moins une offre active sur le SIRET"),
  minIdentities: z
    .number()
    .int()
    .positive()
    .default(2)
    .describe("Identités email distinctes parmi ces comptes : un domaine d'entreprise compte une fois, chaque compte webmail à part. 1 désactive le critère"),
  maxCreationGapHours: z
    .number()
    .positive()
    .default(24)
    .describe("Deux au moins de ces comptes créés à moins de cet écart, en heures. Une valeur plus grande que l'âge des comptes désactive le critère"),
  exitRatio: z
    .number()
    .gt(0)
    .lte(1)
    .default(1)
    .describe(
      "Une alerte ouverte reste ouverte tant que le SIRET garde minAccounts comptes actifs, dont cette fraction de minAccounts avec une offre active. 1 : elle se ferme dès que moins de minAccounts comptes publient"
    ),
})

export type IMultiAccountSiretThresholds = z.output<typeof thresholdsSchema>

/**
 * Premier et dernier événement d'un historique par date, à date égale dans l'ordre du tableau, comme le tri stable de
 * getLastStatusEvent. `$sortArray` ne garantit pas l'ordre des égalités : au-delà de 16 éléments, il le mélange (mongod 8.3).
 */
const firstEventExpr = (events: string) => ({ $first: { $filter: { input: events, cond: { $eq: ["$$this.date", { $min: `${events}.date` }] } } } })
const lastEventExpr = (events: string) => ({ $last: { $filter: { input: events, cond: { $eq: ["$$this.date", { $max: `${events}.date` }] } } } })

const eventsUntil = (events: string, at: unknown) => ({ $filter: { input: events, cond: { $lte: ["$$this.date", at] } } })

/** Statut d'un rôle à la date `at` : son dernier événement daté au plus tard de `at`. */
const roleStatusAtExpr = (at: unknown) => ({
  $let: { vars: { past: eventsUntil("$status", at) }, in: { $getField: { field: "status", input: lastEventExpr("$$past") } } },
})

/**
 * Statut d'une offre à la date `at`, lu dans `offer_status_history`. Avant le premier événement, l'offre a son statut
 * de dépôt, qui n'est pas tracé : en attente si l'historique commence par sa publication ou par l'expiration d'une offre
 * en attente, publiée sinon. Sans historique, le statut n'a jamais changé.
 */
const offerStatusAtExpr = (at: unknown) => ({
  $let: {
    vars: { history: { $ifNull: ["$offer_status_history", []] } },
    in: {
      $let: {
        vars: { past: eventsUntil("$$history", at), first: firstEventExpr("$$history") },
        in: {
          $switch: {
            branches: [
              { case: { $gt: [{ $size: "$$past" }, 0] }, then: { $getField: { field: "status", input: lastEventExpr("$$past") } } },
              { case: { $eq: [{ $size: "$$history" }, 0] }, then: "$offer_status" },
              {
                case: { $or: [{ $eq: ["$$first.status", JOB_STATUS_ENGLISH.ACTIVE] }, { $eq: ["$$first.granted_by", JOB_PENDING_EXPIRATION_ORIGIN] }] },
                then: JOB_STATUS_ENGLISH.EN_ATTENTE,
              },
            ],
            default: JOB_STATUS_ENGLISH.ACTIVE,
          },
        },
      },
    },
  },
})

/** Offre en ligne à la date `at` : déposée, pas encore expirée, et publiée à cette date. */
const isOfferActiveAtExpr = (at: unknown) => ({
  $and: [{ $lte: ["$created_at", at] }, { $gt: ["$offer_expiration", at] }, { $eq: [offerStatusAtExpr(at), JOB_STATUS_ENGLISH.ACTIVE] }],
})

/** Offres déposées par le compte lui-même : une offre déléguée est déposée par un compte CFA au nom de l'entreprise. */
const OWN_LBA_OFFERS_FILTER = { partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, is_delegated: { $ne: true } }

/** Comptes qu'une alerte ouverte doit garder avec une offre active pour ne pas se fermer. */
const heldMinAccountsWithOffers = ({ minAccounts, exitRatio }: IMultiAccountSiretThresholds) => Math.ceil(exitRatio * minAccounts - 1e-9)

/**
 * SIRET qui portent au moins `minAccounts` comptes entreprise actifs à la date `at`, dont assez avec une offre active
 * pour entrer en alerte ou y rester. `entreprises.siret` est unique : les comptes d'un SIRET partagent l'`authorized_id`
 * de leur rôle (cf. getSameSiretAccounts). Les comptes CFA n'en font pas partie, même au SIRET d'une entreprise.
 */
export const multiAccountSiretsPipeline = (at: Date, thresholds: IMultiAccountSiretThresholds) => [
  { $match: { authorized_type: AccessEntityType.ENTREPRISE, createdAt: { $lte: at } } },
  { $project: { _id: 0, user_id: 1, authorized_id: 1, createdAt: 1, status_at: roleStatusAtExpr(at) } },
  { $match: { status_at: AccessStatus.GRANTED } },
  { $group: { _id: "$authorized_id", roles: { $push: { user_id: "$user_id", created_at: "$createdAt" } } } },
  { $match: { [`roles.${thresholds.minAccounts - 1}`]: { $exists: true } } },
  { $set: { entreprise_id: { $convert: { input: "$_id", to: "objectId", onError: null, onNull: null } } } },
  { $lookup: { from: "entreprises", localField: "entreprise_id", foreignField: "_id", pipeline: [{ $project: { _id: 0, siret: 1 } }], as: "entreprise" } },
  { $set: { siret: { $first: "$entreprise.siret" } } },
  // Le SIRET est filtré après la jointure : dans la sous-requête, l'index workplace_siret_1 peut l'emporter sur
  // managed_by_1 et lire toutes les offres partenaires d'un grand établissement.
  {
    $lookup: {
      from: "jobs_partners",
      localField: "roles.user_id",
      foreignField: "managed_by",
      pipeline: [
        { $match: { ...OWN_LBA_OFFERS_FILTER, $expr: isOfferActiveAtExpr(at) } },
        { $group: { _id: { user_id: "$managed_by", siret: "$workplace_siret" }, count: { $sum: 1 } } },
      ],
      as: "offers",
    },
  },
  { $set: { offers: { $filter: { input: "$offers", cond: { $eq: ["$$this._id.siret", "$siret"] } } } } },
  // Les rôles d'une entreprise introuvable ou sans SIRET passent, pour être comptés dans les observations.
  { $match: { $or: [{ [`offers.${heldMinAccountsWithOffers(thresholds) - 1}`]: { $exists: true } }, { siret: { $not: { $type: "string" } } }] } },
  {
    $lookup: {
      from: "userswithaccounts",
      localField: "roles.user_id",
      foreignField: "_id",
      pipeline: [{ $project: { domain: { $toLower: { $arrayElemAt: [{ $split: ["$email", "@"] }, -1] } } } }],
      as: "users",
    },
  },
  { $project: { _id: 0, siret: 1, roles: 1, offers: 1, users: 1 } },
]

type IPipelineSiret = {
  siret?: string | null
  roles: Array<{ user_id: ObjectId; created_at: Date }>
  offers: Array<{ _id: { user_id: ObjectId; siret: string }; count: number }>
  users: Array<{ _id: ObjectId; domain: string }>
}

/** Un utilisateur supprimé depuis (effacement RGPD) n'est plus un compte du SIRET : les pertes sont comptées, pas levées. */
const loadMultiAccountSirets = async (at: Date, thresholds: IMultiAccountSiretThresholds) => {
  const results = await getDbCollection("rolemanagements").aggregate<IPipelineSiret>(multiAccountSiretsPipeline(at, thresholds)).toArray()
  let deletedAccounts = 0
  let rolesWithoutSiret = 0
  const sirets: ISiretAccounts[] = []
  for (const { siret, roles, offers, users } of results) {
    if (typeof siret !== "string") {
      rolesWithoutSiret += roles.length
      continue
    }
    const domains = new Map(users.map(({ _id, domain }) => [_id.toHexString(), domain]))
    const offerCounts = new Map(offers.map(({ _id, count }) => [_id.user_id.toHexString(), count]))
    const accounts = roles.flatMap(({ user_id, created_at }): ISiretAccount[] => {
      const domain = domains.get(user_id.toHexString())
      return domain === undefined ? [] : [{ userId: user_id, createdAt: created_at, domain, activeOffers: offerCounts.get(user_id.toHexString()) ?? 0 }]
    })
    deletedAccounts += roles.length - accounts.length
    if (accounts.length >= thresholds.minAccounts) {
      sirets.push({ siret, accounts: accounts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.userId.toHexString().localeCompare(b.userId.toHexString())) })
    }
  }
  return { sirets: sirets.sort((a, b) => a.siret.localeCompare(b.siret)), deletedAccounts, rolesWithoutSiret }
}

/**
 * Identités email des comptes : des collègues partagent le domaine de leur entreprise, qui compte une fois ; une adresse
 * webmail ne dit rien de l'employeur, chaque compte webmail compte à part.
 */
export const countEmailIdentities = (accounts: Pick<ISiretAccount, "domain">[]) => {
  const corporateDomains = new Set<string>()
  let webmailAccounts = 0
  for (const { domain } of accounts) {
    if (domain && !isFreeEmailProviderDomain(domain)) {
      corporateDomains.add(domain)
    } else {
      webmailAccounts++
    }
  }
  return { identities: corporateDomains.size + webmailAccounts, corporateDomains: corporateDomains.size, webmailAccounts }
}

/** Plus petit écart de création entre deux des comptes, en heures. */
const closestCreationGapHours = (accounts: Pick<ISiretAccount, "createdAt">[]) => {
  const times = accounts.map(({ createdAt }) => createdAt.getTime()).sort((a, b) => a - b)
  let gap = Number.POSITIVE_INFINITY
  for (let index = 1; index < times.length; index++) {
    gap = Math.min(gap, times[index] - times[index - 1])
  }
  return gap / HOUR_MS
}

/**
 * Entrée : `minAccounts` comptes actifs avec une offre active, d'au moins `minIdentities` identités email, dont deux
 * créés à moins de `maxCreationGapHours`. Une alerte ouverte reste ouverte tant que le SIRET garde `minAccounts`
 * comptes actifs, dont `exitRatio` × `minAccounts` avec une offre active, et que l'ensemble de ses comptes actifs
 * remplit les deux critères. Elle se ferme quand le support désactive les comptes en trop, ou quand le SIRET ne publie plus.
 */
export const evaluateMultiAccountSiret = ({ accounts }: Pick<ISiretAccounts, "accounts">, thresholds: IMultiAccountSiretThresholds, open = false) => {
  const withOffers = accounts.filter(({ activeOffers }) => activeOffers > 0)
  const enoughIdentities = countEmailIdentities(withOffers).identities >= thresholds.minIdentities
  const closeCreations = closestCreationGapHours(withOffers) < thresholds.maxCreationGapHours
  const opens = withOffers.length >= thresholds.minAccounts && enoughIdentities && closeCreations
  const holds =
    open &&
    accounts.length >= thresholds.minAccounts &&
    withOffers.length >= heldMinAccountsWithOffers(thresholds) &&
    countEmailIdentities(accounts).identities >= thresholds.minIdentities &&
    closestCreationGapHours(accounts) < thresholds.maxCreationGapHours
  const alert = opens || holds
  return {
    accounts: accounts.length,
    accountsWithOffers: withOffers.length,
    ...countEmailIdentities(accounts),
    closestCreationGapHours: closestCreationGapHours(accounts),
    enoughIdentities,
    closeCreations,
    alert,
    held: alert && !opens,
  }
}

const formatParisDate = (date: Date) => date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })

const plural = (count: number, singular: string, pluralForm: string) => `${count} ${count > 1 ? pluralForm : singular}`

const accountUrl = (id: ObjectId) => `${config.publicUrl}/espace-pro/administration/users/${id.toHexString()}`

const formatAccount = ({ userId, createdAt, activeOffers }: ISiretAccount) =>
  `${userId.toHexString()} (créé le ${formatParisDate(createdAt)}, ${plural(activeOffers, "offre", "offres")})`

const formatAccountList = (accounts: ISiretAccount[]) => {
  const listed = accounts.slice(0, LISTED_ACCOUNTS).map(formatAccount)
  return accounts.length > LISTED_ACCOUNTS ? `${listed.join(", ")} et ${accounts.length - LISTED_ACCOUNTS} autres` : listed.join(", ")
}

const formatGap = (hours: number) => {
  if (hours < 1) return "moins d'une heure"
  if (hours < 48) return plural(Math.floor(hours), "heure", "heures")
  return plural(Math.floor(hours / 24), "jour", "jours")
}

// Le SIRET, des comptes et des identifiants techniques : ni adresse, ni domaine, ni nom (cf. assertNoEmailInFinding).
export const buildSiretFinding = (
  { siret, accounts }: ISiretAccounts,
  { accountsWithOffers, corporateDomains, webmailAccounts, closestCreationGapHours, held }: ReturnType<typeof evaluateMultiAccountSiret>,
  thresholds: IMultiAccountSiretThresholds
): IDetectionFinding => {
  const activeOffers = accounts.reduce((total, { activeOffers }) => total + activeOffers, 0)
  const [first] = accounts
  const last = accounts.at(-1) ?? first
  const metrics: IDetectionMetrics = {
    siret,
    comptes_actifs: accounts.length,
    comptes_avec_offres: accountsWithOffers,
    offres_actives: activeOffers,
    domaines_entreprise: corporateDomains,
    comptes_webmail: webmailAccounts,
    premiere_creation: first?.createdAt.toISOString() ?? null,
    derniere_creation: last?.createdAt.toISOString() ?? null,
    ecart_creation_min_heures: Number.isFinite(closestCreationGapHours) ? Math.round(closestCreationGapHours * 10) / 10 : null,
    comptes_ids: accounts.map(({ userId }) => userId.toHexString()).join(","),
    maintenue_sous_le_seuil: held,
  }
  const gapText = Number.isFinite(closestCreationGapHours) ? ` Les deux plus proches ont été créés à ${formatGap(closestCreationGapHours)} d'écart.` : ""
  // Sans cette phrase, un rappel afficherait des comptes avec offres qui ne remplissent plus les critères d'entrée sans dire pourquoi l'alerte reste ouverte.
  const heldText = held
    ? ` Sous le seuil d'entrée, l'alerte reste ouverte tant que le SIRET garde ${thresholds.minAccounts} comptes actifs, dont ${plural(heldMinAccountsWithOffers(thresholds), "compte", "comptes")} avec des offres en ligne, et que l'ensemble de ses comptes actifs remplit les critères d'identités et d'écart de création.`
    : ""
  const summary = [
    `${accounts.length} comptes entreprise actifs sur le SIRET ${siret}, dont ${accountsWithOffers} avec des offres en ligne (${plural(activeOffers, "offre", "offres")}). Leurs adresses relèvent de ${plural(corporateDomains, "domaine d'entreprise", "domaines d'entreprise")} et de ${plural(webmailAccounts, "webmail", "webmails")}.${first && last ? ` Comptes créés du ${formatParisDate(first.createdAt)} au ${formatParisDate(last.createdAt)}.` : ""}${gapText}${heldText}`,
    `Comptes : ${formatAccountList(accounts)}`,
  ].join("\n")
  return {
    key: siret,
    metrics,
    summary,
    links: accounts.slice(0, LINKED_ACCOUNTS).map(({ userId }) => ({ label: `compte ${userId.toHexString()}`, url: accountUrl(userId) })),
  }
}

/**
 * Comptes entreprise actifs multiples sur un même SIRET, avec des offres en ligne (#5424). Signal, pas preuve : des
 * collègues d'un même établissement publient légitimement, d'où les critères d'identités email et d'écart de création.
 * La règle lit un stock reconstitué à la date du créneau : le rejeu vaut pour les dates passées. Désactivée par défaut,
 * elle s'active après un rejeu sur la production. Choix des critères, volumes et activation : docs/detection.md.
 */
export const multiAccountSiretRule: IDetectionRule<IMultiAccountSiretThresholds> = {
  id: "comptes_multiples_siret",
  title: "Comptes actifs multiples sur un même SIRET",
  severity: "moyenne",
  periodicity: { everyMinutes: 24 * 60, offsetMinutes: 6 * 60 },
  enabledByDefault: false,
  thresholds: thresholdsSchema,
  confirmations: 1,
  reminderEveryHours: 30 * 24,
  evaluate: async ({ now, thresholds, activeAlerts }) => {
    const { sirets, deletedAccounts, rolesWithoutSiret } = await loadMultiAccountSirets(now, thresholds)
    const openSirets = new Set(activeAlerts.filter(({ status }) => status === DETECTION_ALERT_STATUS.OUVERTE).map(({ key }) => key))
    const evaluations = sirets.map((siretAccounts) => ({ siretAccounts, evaluation: evaluateMultiAccountSiret(siretAccounts, thresholds, openSirets.has(siretAccounts.siret)) }))
    const findings = evaluations.filter(({ evaluation }) => evaluation.alert).map(({ siretAccounts, evaluation }) => buildSiretFinding(siretAccounts, evaluation, thresholds))
    const atThreshold = evaluations.filter(({ evaluation }) => evaluation.accountsWithOffers >= thresholds.minAccounts)
    return {
      findings,
      observations: {
        sirets_candidats: sirets.length,
        sirets_au_seuil_de_comptes: atThreshold.length,
        sirets_ecartes_par_les_identites: atThreshold.filter(({ evaluation }) => !evaluation.alert && !evaluation.enoughIdentities).length,
        sirets_ecartes_par_l_ecart_de_creation: atThreshold.filter(({ evaluation }) => !evaluation.alert && !evaluation.closeCreations).length,
        sirets_en_alerte: findings.length,
        max_comptes_avec_offres: Math.max(0, ...evaluations.map(({ evaluation }) => evaluation.accountsWithOffers)),
        comptes_supprimes: deletedAccounts,
        roles_sans_siret: rolesWithoutSiret,
      },
    }
  },
}
