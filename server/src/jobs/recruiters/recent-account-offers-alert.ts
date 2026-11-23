import type { ObjectId } from "mongodb"
import type { IDetectionMetrics } from "shared/models/detection-alerts.model"
import { DETECTION_ALERT_STATUS } from "shared/models/detection-alerts.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { MODERATION_REVIEW_STATUS } from "shared/models/jobs-partners-moderation.model"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import { z } from "zod"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import type { IDetectionFinding, IDetectionRule } from "@/jobs/detection/detection-rule"
import { API_KEY_CREATION_REASON } from "@/services/auto-validation-reasons"
import { accountUrl, autoValidatedOf, formatParisDate, getRolesWindowFilter, lastStatusOf } from "./recruiter-detection-utils"

const HOUR_MS = 60 * 60 * 1000
const PERIOD_MINUTES = 60

// Le message doit tenir dans SLACK_MESSAGE_MAX_LENGTH : la liste complète reste dans les métriques de l'alerte.
const LISTED_SIRETS = 10

// Au-delà, l'utilisateur existait avant son rôle : il revient après le refus ou la désactivation de ses rôles précédents.
const REREGISTRATION_DELAY_MS = HOUR_MS

// Valeurs par défaut tirées du rejeu sur la production (avril-novembre 2026), cf. docs/detection.md.
const thresholdsSchema = z.strictObject({
  windowHours: z.number().int().positive().default(168).describe("Heures suivant l'ouverture du compte pendant lesquelles ses offres sont comptées"),
  minOffers: z.number().int().positive().default(10).describe("Offres déposées dans la fenêtre"),
  minOpenings: z.number().int().positive().default(20).describe("Postes cumulés des offres déposées dans la fenêtre"),
  minNonConformeOffers: z.number().int().positive().default(2).describe("Offres non conformes selon la modération, dans la fenêtre"),
  holdHours: z
    .number()
    .int()
    .gte(Math.ceil(PERIOD_MINUTES / 60))
    .default(24)
    .describe("Le compte reste suivi ce nombre d'heures après la fin de la fenêtre : au moins une période de la règle, pour voir une offre déposée juste avant la fin"),
})

export type IRecentAccountThresholds = z.output<typeof thresholdsSchema>

/**
 * Un compte ouvert pendant la période suivie, à son dernier rôle entreprise ou CFA dont tous les rôles plus anciens sont
 * refusés ou désactivés. Ses rôles depuis l'ouverture sont lus à l'instant évalué, ses offres LBA sur la fenêtre qui suit.
 */
export type IRecentAccount = {
  userId: ObjectId
  startedAt: Date
  userCreatedAt: Date
  /** Rôle créé par clé API partenaire (cf. classifyRole) : un intégrateur publie légitimement en volume. */
  apiKeyCreated: boolean
  entrepriseRoles: number
  cfaRoles: number
  grantedRoles: number
  awaitingRoles: number
  deniedRoles: number
  autoValidatedRoles: number
  offers: number
  nonConformeOffers: number
  openings: number
  sirets: string[]
  firstOfferAt: Date | null
  lastOfferAt: Date | null
}

export const getObservationStart = (now: Date, { windowHours, holdHours }: Pick<IRecentAccountThresholds, "windowHours" | "holdHours">) =>
  new Date(now.getTime() - (windowHours + holdHours) * HOUR_MS)

export const isReregistration = ({ startedAt, userCreatedAt }: Pick<IRecentAccount, "startedAt" | "userCreatedAt">) =>
  startedAt.getTime() - userCreatedAt.getTime() > REREGISTRATION_DELAY_MS

/**
 * Le nombre d'offres déposées ne baisse pas, celui des non conformes si : une offre validée par un modérateur en sort,
 * et y revient quand une modification relance la classification. Comme dans evaluateDomainSpike, une alerte ouverte
 * reste donc ouverte jusqu'à la fin du suivi, sauf si tous les rôles du compte sont refusés ou désactivés.
 */
export const evaluateRecentAccount = (account: IRecentAccount, thresholds: IRecentAccountThresholds, open = false) => {
  const deactivated = account.deniedRoles > 0 && account.deniedRoles === account.entrepriseRoles + account.cfaRoles
  const volume = account.offers >= thresholds.minOffers
  const openings = account.openings >= thresholds.minOpenings
  const nonConforme = account.nonConformeOffers >= thresholds.minNonConformeOffers
  const excluded = account.apiKeyCreated ? "cle_api" : deactivated ? "desactive" : null
  const opens = volume || openings || nonConforme
  const alert = excluded === null && (opens || open)
  return { volume, openings, nonConforme, excluded, alert, held: alert && !opens }
}

const statusBefore = (now: Date) => ({ $filter: { input: "$status", cond: { $lt: ["$$this.date", now] } } })

// Comme OFFER_RANK (account-offer-conformity.service), une offre validée par un modérateur est conforme. Le verdict est
// celui du champ le plus sévère (cf. classifyOffreFreeTexts) : un champ jugé non conforme compte même si l'analyse de
// l'autre a échoué, alors qu'OFFER_RANK affiche cette offre « indisponible ».
const isNonConforme = {
  $and: [{ $ne: ["$offer_moderation_review", MODERATION_REVIEW_STATUS.VALIDEE] }, { $eq: ["$offer_moderation_verdict", "non_conforme"] }],
}

const countRolesSince = (condition: unknown) => ({ $size: { $filter: { input: "$roles", as: "role", cond: condition } } })

/**
 * Comptes ouverts sur [observationStart, now[ et leurs offres LBA déposées dans les `windowMs` suivant l'ouverture, avant
 * `now`. Les rôles sont lus à `now` d'après leurs événements datés : le rejeu d'un créneau passé voit ce qu'aurait vu le
 * cron. Le verdict de modération et le nombre de postes, réécrit à chaque modification de l'offre, sont les derniers connus.
 */
export const recentAccountsPipeline = (observationStart: Date, now: Date, windowMs: number) => [
  { $match: getRolesWindowFilter(observationStart, now) },
  { $group: { _id: "$user_id" } },
  // Le sous-pipeline ne filtre rien : avec un filtre sur le type ou la date, le planificateur parcourt
  // { authorized_type, createdAt } au lieu de user_id.
  {
    $lookup: {
      from: "rolemanagements",
      localField: "_id",
      foreignField: "user_id",
      pipeline: [{ $project: { _id: 0, authorized_type: 1, createdAt: 1, status: statusBefore(now) } }],
      as: "user_roles",
    },
  },
  {
    $set: {
      user_roles: {
        $filter: {
          input: "$user_roles",
          as: "role",
          cond: { $and: [{ $in: ["$$role.authorized_type", [AccessEntityType.ENTREPRISE, AccessEntityType.CFA]] }, { $lt: ["$$role.createdAt", now] }] },
        },
      },
    },
  },
  // Ouverture : le dernier rôle de la période dont tous les rôles plus anciens sont refusés ou désactivés. Une adresse
  // sanctionnée qui se réinscrit garde son utilisateur (cf. findOrCreateUserWithAccount) : son nouveau rôle rouvre le
  // compte, sans les offres de l'ancien. Un rôle plus ancien encore actif ne vient d'aucun parcours d'inscription
  // actuel, qui le refusent tous, mais de données anciennes ou d'un rôle réaccordé par un administrateur.
  {
    $set: {
      started_at: {
        $max: {
          $map: {
            input: {
              $filter: {
                input: "$user_roles",
                as: "role",
                cond: {
                  $and: [
                    { $gte: ["$$role.createdAt", observationStart] },
                    {
                      $not: {
                        $anyElementTrue: {
                          $map: {
                            input: "$user_roles",
                            as: "older",
                            in: { $and: [{ $lt: ["$$older.createdAt", "$$role.createdAt"] }, { $ne: [lastStatusOf("$$older.status"), AccessStatus.DENIED] }] },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
            as: "role",
            in: "$$role.createdAt",
          },
        },
      },
    },
  },
  { $match: { started_at: { $type: "date" } } },
  { $set: { roles: { $filter: { input: "$user_roles", as: "role", cond: { $gte: ["$$role.createdAt", "$started_at"] } } } } },
  {
    $set: {
      entreprise_roles: countRolesSince({ $eq: ["$$role.authorized_type", AccessEntityType.ENTREPRISE] }),
      cfa_roles: countRolesSince({ $eq: ["$$role.authorized_type", AccessEntityType.CFA] }),
      granted_roles: countRolesSince({ $eq: [lastStatusOf("$$role.status"), AccessStatus.GRANTED] }),
      awaiting_roles: countRolesSince({ $eq: [lastStatusOf("$$role.status"), AccessStatus.AWAITING_VALIDATION] }),
      denied_roles: countRolesSince({ $eq: [lastStatusOf("$$role.status"), AccessStatus.DENIED] }),
      auto_validated_roles: countRolesSince(autoValidatedOf("$$role.status")),
      api_key_created: { $gt: [countRolesSince({ $in: [API_KEY_CREATION_REASON, "$$role.status.reason"] }), 0] },
    },
  },
  { $lookup: { from: "userswithaccounts", localField: "_id", foreignField: "_id", pipeline: [{ $project: { _id: 0, createdAt: 1 } }], as: "user" } },
  { $set: { user_created_at: { $first: "$user.createdAt" } } },
  { $match: { user_created_at: { $type: "date" } } },
  {
    $lookup: {
      from: "jobs_partners",
      localField: "_id",
      foreignField: "managed_by",
      let: { started_at: "$started_at" },
      pipeline: [
        {
          $match: {
            partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
            $expr: { $and: [{ $gte: ["$created_at", "$$started_at"] }, { $lt: ["$created_at", { $min: [now, { $add: ["$$started_at", windowMs] }] }] }] },
          },
        },
        { $project: { _id: 0, created_at: 1, workplace_siret: 1, offer_opening_count: 1, non_conforme: isNonConforme } },
      ],
      as: "offers",
    },
  },
  {
    $set: {
      offer_count: { $size: "$offers" },
      non_conforme_offers: { $size: { $filter: { input: "$offers", cond: "$$this.non_conforme" } } },
      openings: { $sum: "$offers.offer_opening_count" },
      sirets: { $setDifference: [{ $setUnion: ["$offers.workplace_siret"] }, [null]] },
      first_offer_at: { $min: "$offers.created_at" },
      last_offer_at: { $max: "$offers.created_at" },
    },
  },
  { $unset: ["user_roles", "roles", "user", "offers"] },
]

type IPipelineAccount = {
  _id: ObjectId
  started_at: Date
  user_created_at: Date
  entreprise_roles: number
  cfa_roles: number
  granted_roles: number
  awaiting_roles: number
  denied_roles: number
  auto_validated_roles: number
  api_key_created: boolean
  offer_count: number
  non_conforme_offers: number
  openings: number
  sirets: string[]
  first_offer_at: Date | null
  last_offer_at: Date | null
}

export const loadRecentAccounts = async (now: Date, thresholds: IRecentAccountThresholds): Promise<IRecentAccount[]> => {
  const accounts = await getDbCollection("rolemanagements")
    .aggregate<IPipelineAccount>(recentAccountsPipeline(getObservationStart(now, thresholds), now, thresholds.windowHours * HOUR_MS))
    .toArray()
  return accounts.map((account) => ({
    userId: account._id,
    startedAt: account.started_at,
    userCreatedAt: account.user_created_at,
    apiKeyCreated: account.api_key_created,
    entrepriseRoles: account.entreprise_roles,
    cfaRoles: account.cfa_roles,
    grantedRoles: account.granted_roles,
    awaitingRoles: account.awaiting_roles,
    deniedRoles: account.denied_roles,
    autoValidatedRoles: account.auto_validated_roles,
    offers: account.offer_count,
    nonConformeOffers: account.non_conforme_offers,
    openings: account.openings,
    sirets: [...account.sirets].sort(),
    firstOfferAt: account.first_offer_at ?? null,
    lastOfferAt: account.last_offer_at ?? null,
  }))
}

// En jours au-delà de 48 h, arrondi au supérieur : jamais en dessous de la durée réelle.
const formatDuration = (hours: number) => (hours < 48 ? `${hours} h` : `${Math.ceil(hours / 24)} jours`)

// 30 offres en 2 h 10 s'écrivent « dans les 3 h ».
const formatHoursAfter = (from: Date, to: Date) => formatDuration(Math.max(1, Math.ceil((to.getTime() - from.getTime()) / HOUR_MS)))

const formatSirets = (sirets: string[]) => {
  if (!sirets.length) return "aucun"
  const listed = sirets.slice(0, LISTED_SIRETS).join(", ")
  return sirets.length > LISTED_SIRETS ? `${listed} et ${sirets.length - LISTED_SIRETS} autres` : listed
}

// Identifiants techniques et SIRET : jamais d'adresse ni de raison sociale (cf. assertNoEmailInFinding).
export const buildRecentAccountFinding = (
  account: IRecentAccount,
  { volume, openings, nonConforme, held }: ReturnType<typeof evaluateRecentAccount>,
  thresholds: IRecentAccountThresholds
): IDetectionFinding => {
  const id = account.userId.toHexString()
  const reregistration = isReregistration(account)
  const closesAt = new Date(account.startedAt.getTime() + (thresholds.windowHours + thresholds.holdHours) * HOUR_MS)
  const metrics: IDetectionMetrics = {
    compte_ouvert_le: account.startedAt.toISOString(),
    utilisateur_cree_le: account.userCreatedAt.toISOString(),
    reinscription: reregistration,
    offres: account.offers,
    offres_non_conformes: account.nonConformeOffers,
    postes: account.openings,
    sirets: account.sirets.join(","),
    premiere_offre: account.firstOfferAt?.toISOString() ?? null,
    derniere_offre: account.lastOfferAt?.toISOString() ?? null,
    roles_entreprise: account.entrepriseRoles,
    roles_cfa: account.cfaRoles,
    roles_acces_accorde: account.grantedRoles,
    roles_en_attente: account.awaitingRoles,
    roles_refuses: account.deniedRoles,
    roles_valides_auto: account.autoValidatedRoles,
    critere_volume: volume,
    critere_postes: openings,
    critere_non_conforme: nonConforme,
    maintenue_sous_le_seuil: held,
  }
  const span = account.lastOfferAt ? formatHoursAfter(account.startedAt, account.lastOfferAt) : formatDuration(thresholds.windowHours)
  const reregistrationText = reregistration
    ? ` Utilisateur créé le ${formatParisDate(account.userCreatedAt)} : il revient sur un nouveau rôle, ses rôles précédents étant tous refusés ou désactivés.`
    : ""
  // Sans cette phrase, un rappel afficherait moins d'offres que les seuils sans dire pourquoi l'alerte reste ouverte.
  const heldText = held
    ? " Le compte est repassé sous les seuils, par exemple après la validation d'une offre par un modérateur : l'alerte reste ouverte jusqu'à la fin du suivi."
    : ""
  const summary = [
    `Le compte ${id}, ouvert le ${formatParisDate(account.startedAt)}, a déposé ${account.offers} offres (${account.openings} postes) dans les ${span} suivant son ouverture, dont ${account.nonConformeOffers} non conformes selon la modération. Seuils : ${thresholds.minOffers} offres, ${thresholds.minOpenings} postes ou ${thresholds.minNonConformeOffers} non conformes, en ${formatDuration(thresholds.windowHours)}.${reregistrationText}${heldText}`,
    `Rôles depuis l'ouverture : ${account.entrepriseRoles} entreprise, ${account.cfaRoles} CFA ; aujourd'hui ${account.grantedRoles} accès accordés, dont ${account.autoValidatedRoles} par validation automatique, ${account.awaitingRoles} en attente, ${account.deniedRoles} refusés.`,
    `SIRET des offres : ${formatSirets(account.sirets)}`,
    `Le compte n'est plus suivi après le ${formatParisDate(closesAt)} : l'alerte se ferme alors, ou dès que tous ses rôles sont refusés ou désactivés.`,
  ].join("\n")
  return { key: id, metrics, summary, links: [{ label: `compte ${id}`, url: accountUrl(account.userId) }] }
}

/**
 * Dépôt d'offres ou de postes en volume dans les jours qui suivent l'ouverture d'un compte (#5423). Un compte établi qui
 * publie plusieurs offres est normal, un compte neuf qui en publie beaucoup ne l'est pas. Variante du commentaire de
 * #5423 : des offres non conformes sur un compte neuf. Désactivée par défaut, seuils et rejeu : docs/detection.md.
 */
export const recentAccountOffersRule: IDetectionRule<IRecentAccountThresholds> = {
  id: "offres_compte_recent",
  title: "Dépôt massif d'offres juste après l'ouverture d'un compte",
  severity: "haute",
  periodicity: { everyMinutes: PERIOD_MINUTES },
  enabledByDefault: false,
  thresholds: thresholdsSchema,
  confirmations: 1,
  // Une alerte dure au plus 8 jours avec les seuils par défaut : un rappel au plus, à mi-parcours.
  reminderEveryHours: 96,
  evaluate: async ({ now, thresholds, activeAlerts }) => {
    const accounts = await loadRecentAccounts(now, thresholds)
    // Le maintien ne vaut que pour l'ouverture qui a déclenché l'alerte : un compte rouvert après sanction repart de zéro.
    const openedAccounts = new Map(
      activeAlerts.filter(({ status }) => status === DETECTION_ALERT_STATUS.OUVERTE).map(({ key, last_metrics }) => [key, last_metrics.compte_ouvert_le])
    )
    const isOpen = (account: IRecentAccount) => openedAccounts.get(account.userId.toHexString()) === account.startedAt.toISOString()
    const evaluations = accounts.map((account) => ({ account, evaluation: evaluateRecentAccount(account, thresholds, isOpen(account)) }))
    const findings = evaluations.filter(({ evaluation }) => evaluation.alert).map(({ account, evaluation }) => buildRecentAccountFinding(account, evaluation, thresholds))
    const excluded = (reason: string) => evaluations.filter(({ evaluation }) => evaluation.excluded === reason).length
    return {
      findings,
      observations: {
        suivi_debut: getObservationStart(now, thresholds).toISOString(),
        comptes_suivis: accounts.length,
        comptes_reinscrits: accounts.filter(isReregistration).length,
        comptes_avec_offres: accounts.filter(({ offers }) => offers > 0).length,
        comptes_cle_api: excluded("cle_api"),
        comptes_desactives: excluded("desactive"),
        comptes_en_alerte: findings.length,
        max_offres_compte: Math.max(0, ...accounts.map(({ offers }) => offers)),
        max_postes_compte: Math.max(0, ...accounts.map(({ openings }) => openings)),
        max_offres_non_conformes_compte: Math.max(0, ...accounts.map(({ nonConformeOffers }) => nonConformeOffers)),
      },
    }
  },
}
