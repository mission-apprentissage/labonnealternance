import { badRequest, conflict, forbidden, notFound } from "@hapi/boom"
import { addJob } from "job-processor"
import { escapeRegExp, pick } from "lodash-es"
import type { Document, Filter } from "mongodb"
import { ObjectId } from "mongodb"
import type { OPCOS_LABEL } from "shared/constants/recruteur"
import type { ComputedUserAccess } from "shared/models/computed-user-access.model"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IJobsPartnersModeration, IJobsPartnersModerationReview } from "shared/models/jobs-partners-moderation.model"
import { MODERATION_CLASSIFICATION_STATUS, MODERATION_REVIEW_STATUS, MODERATION_TRIGGER, OFFER_MODERATION_STATUS } from "shared/models/jobs-partners-moderation.model"
import { buildAgentNoteParagraphs } from "shared/models/jobs-partners-moderation-notes"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import type { IUserWithAccount } from "shared/models/user-with-account.model"
import type {
  IModerationJobDetail,
  IModerationQueueConformity,
  IModerationQueueItem,
  IModerationQueueSort,
  IModerationRecruiter,
} from "shared/routes/jobs-partners-moderation.routes"
import { MODERATION_DECISION_BLOCKED_REASONS, ZModerationJobDetail, ZModerationLatestClassification } from "shared/routes/jobs-partners-moderation.routes"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { REPRISE_CLASSIFICATION_FILTER } from "@/jobs/moderation/retry-classification"
import { applyStoredOfferClassification, getStoredModerationTexts, releaseOfferInReview } from "./formulaire.service"
import { sendMailOffreRefusee } from "./formulaire-notifications.service"
import { buildJobStatusChangeUpdate } from "./job-partner-status.service"
import { classifyOffreTexts, getLatestModeration } from "./jobs-partners-moderation.service"
import { MODERATION_REFUSED_REASON, MODERATION_VALIDATED_REASON } from "./jobs-partners-moderation-reasons"
import { syncJobPartnersToSearchItemsInBackground } from "./search/search-items.service"

/** Un administrateur modère toutes les offres, un OPCO celles des entreprises de son OPCO (#5499). */
export type IModerationScope = { admin: true } | { admin: false; opcos: OPCOS_LABEL[] }

export const getModerationScope = (userAccess: ComputedUserAccess | undefined): IModerationScope => {
  if (userAccess?.admin) return { admin: true }
  const opcos = userAccess?.opcos ?? []
  if (!opcos.length) throw forbidden("La modération est réservée aux administrateurs et aux OPCO")
  return { admin: false, opcos }
}

const scopeFilter = (scope: IModerationScope): Filter<IJobsPartnersOfferPrivate> => (scope.admin ? {} : { workplace_opco: { $in: scope.opcos } })

const MODERATED_STATUSES = [JOB_STATUS_ENGLISH.ACTIVE, JOB_STATUS_ENGLISH.EN_MODERATION]

/** File « à traiter » : offres classifiées non conformes ou à vérifier (une classification en échec rend `a_verifier`), sans décision, ni closes. */
const QUEUE_FILTER: Filter<IJobsPartnersOfferPrivate> = {
  partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
  offer_status: { $in: MODERATED_STATUSES },
  offer_moderation_verdict: { $in: ["a_verifier", "non_conforme"] },
  offer_moderation_review: null,
}

// Le statut est testé avant le verdict : en échec, le verdict stocké vaut `a_verifier`.
const CONFORMITY_FILTERS: Record<IModerationQueueConformity, Filter<IJobsPartnersOfferPrivate>> = {
  non_conforme: { offer_moderation_status: OFFER_MODERATION_STATUS.OK, offer_moderation_verdict: "non_conforme" },
  a_verifier: { offer_moderation_status: OFFER_MODERATION_STATUS.OK, offer_moderation_verdict: "a_verifier" },
  indisponible: { offer_moderation_status: { $in: [OFFER_MODERATION_STATUS.INDISPONIBLE, OFFER_MODERATION_STATUS.EPUISE] } },
}

/**
 * Compte du recruteur de chaque offre : son rôle sur l'entreprise, ou sur le CFA pour une offre déposée par un CFA. Le
 * dernier statut du rôle conditionne la décision (cf. getDecisionBlockedReason).
 */
const RECRUITER_LOOKUP_STAGES: Document[] = [
  { $lookup: { from: "entreprises", localField: "workplace_siret", foreignField: "siret", as: "_entreprises", pipeline: [{ $project: { raison_sociale: 1, siret: 1 } }] } },
  { $lookup: { from: "cfas", localField: "cfa_siret", foreignField: "siret", as: "_cfas", pipeline: [{ $project: { raison_sociale: 1, siret: 1 } }] } },
  {
    $lookup: {
      from: "rolemanagements",
      localField: "managed_by",
      foreignField: "user_id",
      as: "_roles",
      pipeline: [{ $match: { authorized_type: { $in: [AccessEntityType.ENTREPRISE, AccessEntityType.CFA] } } }, { $project: { authorized_type: 1, authorized_id: 1, status: 1 } }],
    },
  },
  {
    $lookup: {
      from: "userswithaccounts",
      localField: "managed_by",
      foreignField: "_id",
      as: "_users",
      pipeline: [{ $project: { email: 1, first_name: 1, last_name: 1, phone: 1 } }],
    },
  },
  { $set: { _account_type: { $cond: [{ $eq: ["$is_delegated", true] }, AccessEntityType.CFA, AccessEntityType.ENTREPRISE] } } },
  { $set: { _organization: { $first: { $cond: [{ $eq: ["$_account_type", AccessEntityType.CFA] }, "$_cfas", "$_entreprises"] } }, _user: { $first: "$_users" } } },
  {
    $set: {
      _role: {
        $first: {
          $filter: {
            input: "$_roles",
            cond: { $and: [{ $eq: ["$$this.authorized_type", "$_account_type"] }, { $eq: ["$$this.authorized_id", { $toString: "$_organization._id" }] }] },
          },
        },
      },
    },
  },
  {
    $set: {
      recruiter: {
        user_id: { $ifNull: ["$managed_by", null] },
        first_name: { $ifNull: ["$_user.first_name", null] },
        last_name: { $ifNull: ["$_user.last_name", null] },
        email: { $ifNull: ["$_user.email", null] },
        phone: { $ifNull: ["$_user.phone", null] },
        account_type: "$_account_type",
        account_status: { $ifNull: [{ $last: { $sortArray: { input: { $ifNull: ["$_role.status", []] }, sortBy: { date: 1 } } } }, null] },
        organization_id: { $ifNull: [{ $toString: "$_organization._id" }, null] },
        raison_sociale: { $ifNull: ["$_organization.raison_sociale", null] },
        siret: { $ifNull: ["$_organization.siret", null] },
      },
    },
  },
  // `$last` rend l'événement entier : seul son statut sert.
  { $set: { "recruiter.account_status": { $ifNull: ["$recruiter.account_status.status", null] } } },
  { $unset: ["_entreprises", "_cfas", "_roles", "_users", "_account_type", "_organization", "_user", "_role"] },
]

const SUMMARY_PROJECTION = {
  _id: 1,
  offer_title: 1,
  offer_rome_appellation: 1,
  offer_status: 1,
  created_at: 1,
  workplace_siret: 1,
  workplace_legal_name: 1,
  workplace_name: 1,
  workplace_opco: 1,
  is_delegated: 1,
  cfa_siret: 1,
  cfa_legal_name: 1,
  offer_moderation_verdict: 1,
  offer_moderation_status: 1,
  offer_moderation_review: 1,
  recruiter: 1,
} as const

/** Clés de tri de la file, calculées sur l'offre seule : le tri ne dépend pas des jointures sur le compte. */
const SORT_KEYS: Record<IModerationQueueSort, unknown> = {
  created_at: "$created_at",
  offer_title: { $toLower: "$offer_title" },
  offer_status: "$offer_status",
  conformity: {
    $switch: {
      branches: [
        { case: { $ne: ["$offer_moderation_status", OFFER_MODERATION_STATUS.OK] }, then: 2 },
        { case: { $eq: ["$offer_moderation_verdict", "a_verifier"] }, then: 1 },
      ],
      default: 0,
    },
  },
  recruiter: { $toLower: { $ifNull: [{ $cond: [{ $eq: ["$is_delegated", true] }, "$cfa_legal_name", "$workplace_legal_name"] }, ""] } },
}

const SIRET_PATTERN = /^\d{14}$/

const buildSearchFilter = async (search: string): Promise<Filter<IJobsPartnersOfferPrivate>> => {
  if (/^[a-f\d]{24}$/i.test(search)) return { _id: new ObjectId(search) }
  if (SIRET_PATTERN.test(search)) return { $or: [{ workplace_siret: search }, { cfa_siret: search }] }
  if (search.includes("@")) {
    const users = await getDbCollection("userswithaccounts")
      .find({ email: { $regex: `^${escapeRegExp(search)}$`, $options: "i" } }, { projection: { _id: 1 } })
      .toArray()
    return { managed_by: { $in: users.map(({ _id }) => _id) } }
  }
  const pattern = { $regex: escapeRegExp(search), $options: "i" }
  return { $or: [{ workplace_legal_name: pattern }, { workplace_name: pattern }, { workplace_brand: pattern }, { cfa_legal_name: pattern }] }
}

export const listModerationQueue = async ({
  scope,
  conformity,
  account_status,
  account_type,
  opco,
  search,
  sort = "created_at",
  order = "desc",
  limit = 50,
  offset = 0,
}: {
  scope: IModerationScope
  conformity?: IModerationQueueConformity[]
  account_status?: (AccessStatus.GRANTED | AccessStatus.AWAITING_VALIDATION)[]
  account_type?: ("ENTREPRISE" | "CFA")[]
  opco?: OPCOS_LABEL[]
  search?: string
  sort?: IModerationQueueSort
  order?: "asc" | "desc"
  limit?: number
  offset?: number
}): Promise<{ jobs: IModerationQueueItem[]; total: number }> => {
  const filters: Filter<IJobsPartnersOfferPrivate>[] = [QUEUE_FILTER, scopeFilter(scope)]
  if (conformity?.length) filters.push({ $or: conformity.map((value) => CONFORMITY_FILTERS[value]) })
  if (account_type?.length === 1) filters.push(account_type[0] === AccessEntityType.CFA ? { is_delegated: true } : { is_delegated: { $ne: true } })
  // Le filtre OPCO de l'écran n'est proposé qu'aux administrateurs : celui d'un OPCO est imposé par scopeFilter.
  if (scope.admin && opco?.length) filters.push({ workplace_opco: { $in: opco } })
  if (search) filters.push(await buildSearchFilter(search))

  // Sans filtre sur le compte, les jointures ne portent que sur la page affichée.
  const filterOnAccount = Boolean(account_status?.length)
  const [{ data, totalCount }] = await getDbCollection("jobs_partners")
    .aggregate<{ data: IModerationQueueItem[]; totalCount: [{ count: number }] | [] }>([
      { $match: { $and: filters } },
      ...(filterOnAccount ? [...RECRUITER_LOOKUP_STAGES, { $match: { "recruiter.account_status": { $in: account_status } } }] : []),
      {
        $facet: {
          data: [
            { $set: { _sort: SORT_KEYS[sort] } },
            { $sort: { _sort: order === "asc" ? 1 : -1, _id: -1 } },
            { $skip: offset },
            { $limit: limit },
            ...(filterOnAccount ? [] : RECRUITER_LOOKUP_STAGES),
            { $project: SUMMARY_PROJECTION },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ])
    .toArray()
  return { jobs: data, total: totalCount[0]?.count ?? 0 }
}

/** Constats de la dernière classification des offres d'une fiche entreprise, pour la colonne Conformité. */
export const getModerationSummaries = async ({ scope, ids }: { scope: IModerationScope; ids: ObjectId[] }) => {
  const offers = await getDbCollection("jobs_partners")
    .find(
      { _id: { $in: ids }, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, ...scopeFilter(scope) },
      { projection: { _id: 1, offer_moderation_verdict: 1, offer_moderation_status: 1, offer_moderation_review: 1 } }
    )
    .toArray()
  const latest = await getDbCollection("jobs_partners_moderations")
    .aggregate<{ _id: ObjectId; findings: IJobsPartnersModeration["findings"] }>([
      { $match: { job_id: { $in: offers.map(({ _id }) => _id) } } },
      { $sort: { created_at: -1 } },
      { $group: { _id: "$job_id", findings: { $first: "$findings" } } },
    ])
    .toArray()
  const findingsByJob = new Map(latest.map(({ _id, findings }) => [_id.toString(), findings]))
  return offers.map((offer) => ({ ...offer, findings: findingsByJob.get(offer._id.toString()) ?? [] }))
}

type IModerationOfferWithRecruiter = IJobsPartnersOfferPrivate & { recruiter: IModerationRecruiter }

const getOfferWithRecruiter = async (id: ObjectId): Promise<IModerationOfferWithRecruiter | null> => {
  const [offer] = await getDbCollection("jobs_partners")
    .aggregate<IModerationOfferWithRecruiter>([{ $match: { _id: id, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA } }, ...RECRUITER_LOOKUP_STAGES])
    .toArray()
  return offer ?? null
}

const getScopedOffer = async (scope: IModerationScope, id: ObjectId): Promise<IModerationOfferWithRecruiter> => {
  const offer = await getOfferWithRecruiter(id)
  if (!offer) throw notFound("Offre introuvable")
  if (!scope.admin && !(offer.workplace_opco && scope.opcos.includes(offer.workplace_opco))) {
    throw forbidden("Cette offre ne relève pas de votre OPCO")
  }
  return offer
}

/** Pourquoi Valider et Refuser sont indisponibles : la décision est unique et ne se prend que sur le compte validé. */
const getDecisionBlockedReason = (offer: IModerationOfferWithRecruiter, moderation: IJobsPartnersModeration | null) => {
  if (!moderation) return MODERATION_DECISION_BLOCKED_REASONS.NON_CLASSIFIEE
  if (offer.offer_moderation_review || moderation.review) return MODERATION_DECISION_BLOCKED_REASONS.DECISION_PRISE
  if (!MODERATED_STATUSES.includes(offer.offer_status)) return MODERATION_DECISION_BLOCKED_REASONS.STATUT
  if (offer.recruiter.account_status !== AccessStatus.GRANTED) return MODERATION_DECISION_BLOCKED_REASONS.COMPTE_NON_VALIDE
  return null
}

/** Relance : une analyse en échec, ou une offre jamais analysée, tant qu'aucune décision n'est prise. */
const canReclassify = (offer: IJobsPartnersOfferPrivate, moderation: IJobsPartnersModeration | null) => {
  if (!MODERATED_STATUSES.includes(offer.offer_status) || offer.offer_moderation_review) return false
  const texts = getStoredModerationTexts(offer)
  if (!texts.job_description && !texts.job_employer_description) return false
  return !moderation || offer.offer_moderation_status !== OFFER_MODERATION_STATUS.OK
}

export const getModerationJobDetail = async ({ scope, id }: { scope: IModerationScope; id: ObjectId }): Promise<IModerationJobDetail> => {
  const offer = await getScopedOffer(scope, id)
  const [moderation, reportsCount, partnerCompany] = await Promise.all([
    getLatestModeration(id),
    getDbCollection("reported_companies").countDocuments({ itemId: id.toString() }),
    offer.is_delegated ? getPartnerCompany(offer) : null,
  ])
  return {
    // Champs listés par le schéma : le document complet porte des coordonnées sans objet ici.
    offer: pick(offer, Object.keys(ZModerationJobDetail.shape.offer.shape)) as IModerationJobDetail["offer"],
    recruiter: offer.recruiter,
    partner_company: partnerCompany,
    // Sans le texte saisi par le recruteur : cf. ZModerationLatestClassification.
    moderation: moderation ? (pick(moderation, Object.keys(ZModerationLatestClassification.shape)) as IModerationJobDetail["moderation"]) : null,
    reports_count: reportsCount,
    decision_blocked_reason: getDecisionBlockedReason(offer, moderation),
    can_reclassify: canReclassify(offer, moderation),
  }
}

/** Entreprise pour laquelle un CFA a déposé l'offre, avec le contact que le CFA a renseigné. */
const getPartnerCompany = async (offer: IJobsPartnersOfferPrivate) => {
  const [entreprise, cfa] = await Promise.all([
    offer.workplace_siret ? getDbCollection("entreprises").findOne({ siret: offer.workplace_siret }, { projection: { _id: 1, raison_sociale: 1, siret: 1 } }) : null,
    offer.cfa_siret ? getDbCollection("cfas").findOne({ siret: offer.cfa_siret }, { projection: { _id: 1 } }) : null,
  ])
  const contact = entreprise && cfa ? await getDbCollection("entreprise_managed_by_cfa").findOne({ entreprise_id: entreprise._id, cfa_id: cfa._id }) : null
  return {
    raison_sociale: entreprise?.raison_sociale || offer.workplace_legal_name || offer.workplace_name || null,
    siret: offer.workplace_siret ?? null,
    first_name: contact?.first_name ?? null,
    last_name: contact?.last_name ?? null,
    email: contact?.email ?? null,
    phone: contact?.phone ?? null,
  }
}

export const getModerationHistory = async ({ scope, id }: { scope: IModerationScope; id: ObjectId }) => {
  await getScopedOffer(scope, id)
  return getDbCollection("jobs_partners_moderations")
    .find({ job_id: id }, { sort: { created_at: -1 } })
    .toArray()
}

/** La décision porte sur la classification que le modérateur a vue : une édition entre-temps en a produit une autre. */
const getDecisionContext = async ({ scope, id, moderationId }: { scope: IModerationScope; id: ObjectId; moderationId: ObjectId }) => {
  const offer = await getScopedOffer(scope, id)
  const moderation = await getLatestModeration(id)
  const blockedReason = getDecisionBlockedReason(offer, moderation)
  if (blockedReason === MODERATION_DECISION_BLOCKED_REASONS.DECISION_PRISE) throw conflict("Une décision a déjà été prise sur cette offre")
  if (blockedReason || !moderation) throw badRequest(`Décision impossible sur cette offre (${blockedReason})`)
  if (!moderation._id.equals(moderationId)) throw conflict("L'offre a été analysée de nouveau depuis l'affichage de la page")
  return { offer, moderation }
}

const recordReview = async (moderation: IJobsPartnersModeration, review: IJobsPartnersModerationReview) => {
  await getDbCollection("jobs_partners_moderations").updateOne({ _id: moderation._id, review: null }, { $set: { review } })
}

/**
 * Valider : une offre publiée reste publiée, sans e-mail ; une offre en modération est publiée comme à son dépôt, avec
 * l'e-mail « offre publiée » et le partage aux CFA s'ils avaient été différés (cf. releaseOfferInReview).
 */
export const validateModeration = async ({ scope, id, moderationId, user }: { scope: IModerationScope; id: ObjectId; moderationId: ObjectId; user: IUserWithAccount }) => {
  const { offer, moderation } = await getDecisionContext({ scope, id, moderationId })
  const review: IJobsPartnersModerationReview = {
    status: MODERATION_REVIEW_STATUS.VALIDEE,
    by: user.email,
    at: new Date(),
    ...(offer.offer_moderation_status !== OFFER_MODERATION_STATUS.OK ? { without_verdict: true } : {}),
  }
  const undecided = { offer_moderation_review: null }
  let offerStatus: JOB_STATUS_ENGLISH
  if (offer.offer_status === JOB_STATUS_ENGLISH.EN_MODERATION) {
    const published = await releaseOfferInReview({
      offer,
      reason: MODERATION_VALIDATED_REASON,
      grantedBy: user.email,
      extraSet: { offer_moderation_review: review.status },
      extraFilter: undecided,
    })
    if (!published) throw conflict("Une décision a déjà été prise sur cette offre")
    offerStatus = published.offer_status
  } else {
    const { modifiedCount } = await getDbCollection("jobs_partners").updateOne(
      { _id: id, offer_status: JOB_STATUS_ENGLISH.ACTIVE, ...undecided },
      { $set: { offer_moderation_review: review.status } }
    )
    if (!modifiedCount) throw conflict("Une décision a déjà été prise sur cette offre")
    offerStatus = JOB_STATUS_ENGLISH.ACTIVE
  }
  await recordReview(moderation, review)
  logger.info({ jobId: id.toString(), review: review.status, offerStatus }, "décision de modération")
  return { offer_status: offerStatus }
}

/** Refuser : l'offre est annulée et le recruteur reçoit l'e-mail de refus, avec la note de l'agent et le commentaire choisis. */
export const refuseModeration = async ({
  scope,
  id,
  moderationId,
  user,
  agentNote,
  comment,
}: {
  scope: IModerationScope
  id: ObjectId
  moderationId: ObjectId
  user: IUserWithAccount
  agentNote: boolean
  comment: string | null | undefined
}) => {
  const { offer, moderation } = await getDecisionContext({ scope, id, moderationId })
  const now = new Date()
  const refused = await getDbCollection("jobs_partners").findOneAndUpdate(
    { _id: id, offer_status: { $in: MODERATED_STATUSES }, offer_moderation_review: null },
    buildJobStatusChangeUpdate({
      status: JOB_STATUS_ENGLISH.ANNULEE,
      reason: MODERATION_REFUSED_REASON,
      grantedBy: user.email,
      date: now,
      extraSet: { offer_moderation_review: MODERATION_REVIEW_STATUS.REFUSEE },
    }),
    { returnDocument: "after" }
  )
  if (!refused) throw conflict("Une décision a déjà été prise sur cette offre")
  syncJobPartnersToSearchItemsInBackground([id])

  const paragraphs = agentNote ? buildAgentNoteParagraphs(moderation.findings) : []
  const message = comment?.trim() || null
  await recordReview(moderation, { status: MODERATION_REVIEW_STATUS.REFUSEE, by: user.email, at: now, message, agent_note_sent: paragraphs.length > 0 })
  logger.info({ jobId: id.toString(), review: MODERATION_REVIEW_STATUS.REFUSEE }, "décision de modération")

  // L'offre est déjà refusée : un échec d'envoi est signalé au modérateur, il ne rend pas la décision rejouable.
  const recruiter = offer.managed_by ? await getDbCollection("userswithaccounts").findOne({ _id: offer.managed_by }) : null
  if (!recruiter) return { offer_status: refused.offer_status, email_sent: false }
  try {
    await sendMailOffreRefusee({ user: recruiter, job: refused, agentNote: paragraphs, comment: message })
    return { offer_status: refused.offer_status, email_sent: true }
  } catch (error) {
    sentryCaptureException(error, { extra: { jobId: id.toString() } })
    return { offer_status: refused.offer_status, email_sent: false }
  }
}

/** Relance de l'analyse, appliquée comme une reprise (cf. applyStoredOfferClassification). */
export const reclassifyModeration = async ({ scope, id, user }: { scope: IModerationScope; id: ObjectId; user: IUserWithAccount }) => {
  const offer = await getScopedOffer(scope, id)
  if (!canReclassify(offer, await getLatestModeration(id))) throw badRequest("L'analyse de cette offre ne peut pas être relancée")
  const classification = await classifyOffreTexts(getStoredModerationTexts(offer))
  await applyStoredOfferClassification({ offer, trigger: MODERATION_TRIGGER.RELANCE_ADMIN, classification, grantedBy: user.email })
  const updated = await getDbCollection("jobs_partners").findOne({ _id: id }, { projection: { offer_status: 1, offer_moderation_status: 1 } })
  return {
    verdict: classification.result.verdict,
    status: updated?.offer_moderation_status ?? MODERATION_CLASSIFICATION_STATUS.INDISPONIBLE,
    offer_status: updated?.offer_status ?? offer.offer_status,
  }
}

/** Relance en masse des analyses en échec : la reprise quotidienne, lancée sans attendre. */
export const reclassifyFailedModerations = async () => {
  const pending = await getDbCollection("jobs_partners").countDocuments(REPRISE_CLASSIFICATION_FILTER)
  if (pending) {
    await addJob({ name: "repriseExhaustedClassifications", queued: true })
  }
  return { pending }
}
