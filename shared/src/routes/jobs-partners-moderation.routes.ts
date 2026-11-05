import { CFA, ENTREPRISE, OPCOS_LABEL } from "../constants/recruteur.js"
import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"
import { zObjectId } from "../models/common.js"
import { JOB_STATUS_ENGLISH } from "../models/job.model.js"
import { ZJobsPartnersOfferPrivate } from "../models/jobs-partners.model.js"
import { MODERATION_VERDICTS, OFFER_MODERATION_STATUS, ZJobsPartnersModeration } from "../models/jobs-partners-moderation.model.js"
import { AccessStatus } from "../models/role-management.model.js"

import type { IRoutesDef } from "./common.routes.js"

/** Filtre de conformité de la file : `indisponible` regroupe les classifications en échec (`indisponible` et `epuise`). */
export const MODERATION_QUEUE_CONFORMITY = ["non_conforme", "a_verifier", OFFER_MODERATION_STATUS.INDISPONIBLE] as const
export type IModerationQueueConformity = (typeof MODERATION_QUEUE_CONFORMITY)[number]

/** Filtre de conformité de la recherche : celui de la file, plus les offres conformes et celles jamais analysées. */
export const MODERATION_SEARCH_CONFORMITY = [...MODERATION_QUEUE_CONFORMITY, "conforme", "non_applicable"] as const
export type IModerationSearchConformity = (typeof MODERATION_SEARCH_CONFORMITY)[number]

export const MODERATION_SEARCH_ACCOUNT_STATUSES = [AccessStatus.AWAITING_VALIDATION, AccessStatus.GRANTED, AccessStatus.DENIED] as const
export type IModerationSearchAccountStatus = (typeof MODERATION_SEARCH_ACCOUNT_STATUSES)[number]

export const MODERATION_QUEUE_SORTS = ["created_at", "offer_title", "offer_status", "conformity", "recruiter"] as const
export type IModerationQueueSort = (typeof MODERATION_QUEUE_SORTS)[number]

export const MODERATION_ACCOUNT_TYPES = [ENTREPRISE, CFA] as const
export type IModerationAccountType = (typeof MODERATION_ACCOUNT_TYPES)[number]

const zQueryArray = <T extends z.ZodType>(item: T) =>
  z
    .union([item, z.array(item)])
    .transform((value) => (Array.isArray(value) ? value : [value]) as z.output<T>[])
    .optional()

const offerShape = ZJobsPartnersOfferPrivate.shape

export const ZModerationRecruiter = z.object({
  user_id: zObjectId.nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  account_type: z.enum(MODERATION_ACCOUNT_TYPES),
  account_status: extensions.buildEnum(AccessStatus).nullable().describe("Dernier statut du rôle du recruteur sur l'entreprise, ou sur le CFA pour une offre déléguée"),
  organization_id: z.string().nullable().describe("Entreprise, ou CFA pour une offre déléguée"),
  raison_sociale: z.string().nullable(),
  siret: z.string().nullable(),
})
export type IModerationRecruiter = z.output<typeof ZModerationRecruiter>

// SIRET affichés tels qu'enregistrés : la clé de Luhn d'une offre ancienne ne doit pas faire échouer toute la réponse.
const ZModerationOfferSummary = z.object({
  _id: offerShape._id,
  offer_title: offerShape.offer_title,
  offer_rome_appellation: offerShape.offer_rome_appellation,
  offer_status: offerShape.offer_status,
  created_at: offerShape.created_at,
  workplace_siret: z.string().nullable(),
  workplace_legal_name: offerShape.workplace_legal_name,
  workplace_name: offerShape.workplace_name,
  workplace_opco: offerShape.workplace_opco,
  is_delegated: offerShape.is_delegated,
  cfa_siret: z.string().nullish(),
  cfa_legal_name: offerShape.cfa_legal_name,
  offer_moderation_verdict: offerShape.offer_moderation_verdict,
  offer_moderation_status: offerShape.offer_moderation_status,
  offer_moderation_review: offerShape.offer_moderation_review,
})

export const ZModerationQueueItem = ZModerationOfferSummary.extend({ recruiter: ZModerationRecruiter })
export type IModerationQueueItem = z.output<typeof ZModerationQueueItem>

/** Dernière classification, sans le texte saisi par le recruteur : seule la route d'historique le renvoie. */
export const ZModerationLatestClassification = ZJobsPartnersModeration.pick({
  _id: true,
  trigger: true,
  verdict: true,
  status: true,
  findings: true,
  prompt_version: true,
  model: true,
  review: true,
  created_at: true,
})

export const MODERATION_DECISION_BLOCKED_REASONS = {
  COMPTE_NON_VALIDE: "compte_non_valide",
  DECISION_PRISE: "decision_prise",
  NON_CLASSIFIEE: "non_classifiee",
  STATUT: "statut",
} as const

export const ZModerationJobDetail = z.object({
  offer: ZModerationOfferSummary.extend({
    offer_creation: offerShape.offer_creation,
    offer_expiration: offerShape.offer_expiration,
    offer_description: offerShape.offer_description,
    offer_description_mode: offerShape.offer_description_mode,
    workplace_description: offerShape.workplace_description,
    workplace_brand: offerShape.workplace_brand,
    offer_desired_skills: offerShape.offer_desired_skills,
    offer_to_be_acquired_skills: offerShape.offer_to_be_acquired_skills,
    offer_target_diploma: offerShape.offer_target_diploma,
    offer_opening_count: offerShape.offer_opening_count,
    contract_type: offerShape.contract_type,
    contract_duration: offerShape.contract_duration,
    contract_start: offerShape.contract_start,
    contract_rythm: offerShape.contract_rythm,
  }),
  recruiter: ZModerationRecruiter,
  partner_company: z
    .object({
      raison_sociale: z.string().nullable(),
      siret: z.string().nullable(),
      first_name: z.string().nullable(),
      last_name: z.string().nullable(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
    })
    .nullable()
    .describe("Entreprise pour laquelle un CFA a déposé l'offre"),
  moderation: ZModerationLatestClassification.nullable(),
  reports_count: z.number().int(),
  decision_blocked_reason: extensions.buildEnum(MODERATION_DECISION_BLOCKED_REASONS).nullable().describe("Pourquoi Valider et Refuser sont indisponibles, null s'ils le sont"),
  can_reclassify: z.boolean(),
})
export type IModerationJobDetail = z.output<typeof ZModerationJobDetail>

// Sans ressource `job` : le service restreint au périmètre de l'utilisateur et répond 404 hors de celui-ci (cf. getScopedOffer).
const moderationAccess = {
  auth: "cookie-session",
  access: "job:manage",
  resources: {},
} as const

// Décider, relancer l'analyse, rechercher dans toutes les offres et compter les offres non conformes d'un CFA sont réservés
// aux administrateurs : un OPCO consulte la modération de son périmètre. Un 403 fermant la session (cf. errorMiddleware),
// l'interface n'appelle ces routes que pour un administrateur.
const moderationAdminAccess = { auth: "cookie-session", access: "admin", resources: {} } as const

const zPageQuery = {
  sort: z.enum(MODERATION_QUEUE_SORTS).optional().describe("Par défaut : date de dépôt, la plus récente d'abord"),
  order: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number<number>().int().min(1).max(100).optional(),
  offset: z.coerce.number<number>().int().min(0).optional(),
}

const ZModerationJobsPage = z.strictObject({
  jobs: z.array(ZModerationQueueItem),
  pagination: z.strictObject({ total: z.number(), limit: z.number(), offset: z.number() }),
})

// `search` et non `q` : la valeur peut être un e-mail, masqué dans Sentry sous ce nom (cf. PERSONAL_QUERY_PARAMS).
const SEARCH_DESCRIPTION = "Raison sociale, SIRET, e-mail du recruteur ou identifiant de l'offre"

export const zJobsPartnersModerationRoutes = {
  get: {
    "/moderation/jobs": {
      method: "get",
      path: "/moderation/jobs",
      querystring: z.object({
        conformity: zQueryArray(z.enum(MODERATION_QUEUE_CONFORMITY)),
        account_status: zQueryArray(z.enum([AccessStatus.GRANTED, AccessStatus.AWAITING_VALIDATION])),
        account_type: zQueryArray(z.enum(MODERATION_ACCOUNT_TYPES)),
        opco: zQueryArray(extensions.buildEnum(OPCOS_LABEL)).describe("Ignoré pour un OPCO, limité à son OPCO"),
        search: z.string().trim().max(200).optional().describe(SEARCH_DESCRIPTION),
        ...zPageQuery,
      }),
      response: { "200": ZModerationJobsPage },
      securityScheme: moderationAccess,
    },
    "/moderation/jobs/search": {
      method: "get",
      path: "/moderation/jobs/search",
      querystring: z.object({
        search: z.string().trim().min(2).max(200).describe(`${SEARCH_DESCRIPTION}, au moins 2 caractères`),
        conformity: zQueryArray(z.enum(MODERATION_SEARCH_CONFORMITY)),
        account_status: zQueryArray(z.enum(MODERATION_SEARCH_ACCOUNT_STATUSES)),
        account_type: zQueryArray(z.enum(MODERATION_ACCOUNT_TYPES)),
        offer_status: zQueryArray(extensions.buildEnum(JOB_STATUS_ENGLISH)),
        ...zPageQuery,
      }),
      response: { "200": ZModerationJobsPage },
      securityScheme: moderationAdminAccess,
    },
    "/moderation/jobs/summary": {
      method: "get",
      path: "/moderation/jobs/summary",
      querystring: z.object({
        ids: z.union([zObjectId, z.array(zObjectId).max(200)]).transform((value) => (Array.isArray(value) ? value : [value])),
      }),
      response: {
        "200": z.strictObject({
          jobs: z.array(
            z.object({
              _id: offerShape._id,
              offer_moderation_verdict: offerShape.offer_moderation_verdict,
              offer_moderation_status: offerShape.offer_moderation_status,
              offer_moderation_review: offerShape.offer_moderation_review,
              findings: ZJobsPartnersModeration.shape.findings,
            })
          ),
        }),
      },
      securityScheme: moderationAccess,
    },
    "/moderation/jobs/:id": {
      method: "get",
      path: "/moderation/jobs/:id",
      params: z.strictObject({ id: zObjectId }),
      response: { "200": ZModerationJobDetail },
      securityScheme: moderationAccess,
    },
    "/moderation/jobs/:id/history": {
      method: "get",
      path: "/moderation/jobs/:id/history",
      params: z.strictObject({ id: zObjectId }),
      response: { "200": z.strictObject({ moderations: z.array(ZJobsPartnersModeration) }) },
      securityScheme: moderationAccess,
    },
    "/moderation/cfa/:cfaId/entreprises": {
      method: "get",
      path: "/moderation/cfa/:cfaId/entreprises",
      params: z.strictObject({ cfaId: zObjectId }),
      response: {
        "200": z.strictObject({
          entreprises: z
            .array(z.strictObject({ siret: z.string(), non_conformes: z.number().int() }))
            .describe("Entreprises partenaires du CFA qui ont au moins une offre non conforme en attente de décision"),
        }),
      },
      securityScheme: moderationAdminAccess,
    },
  },
  post: {
    "/moderation/jobs/:id/validate": {
      method: "post",
      path: "/moderation/jobs/:id/validate",
      params: z.strictObject({ id: zObjectId }),
      body: z.strictObject({ moderation_id: zObjectId.describe("Classification sur laquelle porte la décision") }),
      response: { "200": z.strictObject({ offer_status: offerShape.offer_status }) },
      securityScheme: moderationAdminAccess,
    },
    "/moderation/jobs/:id/refuse": {
      method: "post",
      path: "/moderation/jobs/:id/refuse",
      params: z.strictObject({ id: zObjectId }),
      body: z.strictObject({
        moderation_id: zObjectId.describe("Classification sur laquelle porte la décision"),
        agent_note: z.boolean().describe("Insérer la note de l'agent dans l'e-mail au recruteur"),
        comment: z.string().trim().max(2000).nullish().describe("Commentaire personnalisé inséré dans l'e-mail au recruteur"),
      }),
      response: { "200": z.strictObject({ offer_status: offerShape.offer_status, email_sent: z.boolean() }) },
      securityScheme: moderationAdminAccess,
    },
    "/moderation/jobs/:id/reclassify": {
      method: "post",
      path: "/moderation/jobs/:id/reclassify",
      params: z.strictObject({ id: zObjectId }),
      response: {
        "200": z.strictObject({
          verdict: z.enum(MODERATION_VERDICTS),
          status: offerShape.offer_moderation_status,
          offer_status: offerShape.offer_status,
        }),
      },
      securityScheme: moderationAdminAccess,
    },
    "/moderation/jobs/reclassify": {
      method: "post",
      path: "/moderation/jobs/reclassify",
      response: { "200": z.strictObject({ pending: z.number().int() }) },
      securityScheme: moderationAdminAccess,
    },
  },
} as const satisfies IRoutesDef
