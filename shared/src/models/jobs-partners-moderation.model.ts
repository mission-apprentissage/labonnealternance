import { z } from "zod"

import { buildEnum } from "../helpers/zod-helpers/zod-primitives-light.js"
import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "jobs_partners_moderations" as const

/** Catégories légales : seules à pouvoir bloquer une offre (#5352). */
export const MODERATION_LEGAL_CATEGORIES = ["discrimination", "remuneration", "subordination", "taches_illegales", "mineurs", "contact_bypass"] as const

/**
 * Règles de la charte de rédaction, hors légalité : relevées pour la revue humaine, jamais
 * bloquantes (arbitrage de la modération, #5352). parseClassification ramène leur sévérité à "doute".
 */
export const MODERATION_CHARTER_CATEGORIES = [
  "candidature_hors_plateforme",
  "experience_exigee",
  "teletravail_integral",
  "melange_contrats",
  "poste_salarie",
  "intermediaire",
] as const

export const MODERATION_CATEGORIES = [...MODERATION_LEGAL_CATEGORIES, ...MODERATION_CHARTER_CATEGORIES] as const

export const MODERATION_SEVERITIES = ["bloquant", "doute"] as const

export const MODERATION_VERDICTS = ["conforme", "a_verifier", "non_conforme"] as const

/** Champs libres classifiés, sous leur nom du formulaire : `job_employer_description` est stocké dans `workplace_description`. */
export const MODERATION_FIELDS = ["job_description", "job_employer_description"] as const

/** `indisponible` : le classifieur n'a pas rendu de réponse exploitable. Ce n'est pas un refus (vocabulaire fixé sur #5405). */
export const MODERATION_CLASSIFICATION_STATUS = {
  OK: "ok",
  INDISPONIBLE: "indisponible",
} as const

/** État porté par l'offre : `epuise` quand les nouvelles tentatives ont toutes échoué, l'offre attend alors la reprise quotidienne. */
export const OFFER_MODERATION_STATUS = {
  ...MODERATION_CLASSIFICATION_STATUS,
  EPUISE: "epuise",
} as const

export const MODERATION_REVIEW_STATUS = {
  VALIDEE: "validee",
  REFUSEE: "refusee",
} as const

export const MODERATION_TRIGGER = {
  CREATION: "creation",
  EDITION: "edition",
  RETRY: "retry",
  REPRISE: "reprise",
  RELANCE_ADMIN: "relance_admin",
  REJEU: "rejeu",
  REVUE: "revue",
} as const

export type IModerationCategory = (typeof MODERATION_CATEGORIES)[number]
export type IModerationSeverity = (typeof MODERATION_SEVERITIES)[number]
export type IModerationVerdict = (typeof MODERATION_VERDICTS)[number]
export type IModerationField = (typeof MODERATION_FIELDS)[number]
export type IModerationClassificationStatus = (typeof MODERATION_CLASSIFICATION_STATUS)[keyof typeof MODERATION_CLASSIFICATION_STATUS]
export type IOfferModerationStatus = (typeof OFFER_MODERATION_STATUS)[keyof typeof OFFER_MODERATION_STATUS]
export type IModerationReviewStatus = (typeof MODERATION_REVIEW_STATUS)[keyof typeof MODERATION_REVIEW_STATUS]
export type IModerationTrigger = (typeof MODERATION_TRIGGER)[keyof typeof MODERATION_TRIGGER]

export const ZModerationTexts = z.object({
  job_description: z.string().nullable(),
  job_employer_description: z.string().nullable(),
})

export const ZJobsPartnersModerationFinding = z.object({
  champ: z.enum(MODERATION_FIELDS),
  category: z.enum(MODERATION_CATEGORIES),
  severity: z.enum(MODERATION_SEVERITIES),
  verbatim: z.string().nullable().describe("Extrait du texte masqué, null une fois les textes purgés"),
})

export const ZJobsPartnersModerationReview = z.object({
  status: buildEnum(MODERATION_REVIEW_STATUS),
  by: z.string().describe("Email de l'administrateur qui a tranché"),
  at: z.date(),
  message: z.string().nullish().describe("Commentaire personnalisé envoyé au recruteur en cas de refus"),
  agent_note_sent: z.boolean().nullish().describe("Refus : la note de l'agent figurait dans l'e-mail au recruteur"),
  without_verdict: z.boolean().nullish().describe("Validation d'une offre dont les nouvelles tentatives ont échoué : décision prise sans verdict IA"),
})

/**
 * Une classification d'une offre LBA (#5497). Collection à part : jobs_partners est exposée par l'API
 * publique et les exports, où le texte original et les extraits n'ont rien à faire.
 */
export const ZJobsPartnersModeration = z.object({
  _id: zObjectId,
  job_id: zObjectId.describe("Offre classifiée (jobs_partners)"),
  trigger: buildEnum(MODERATION_TRIGGER),
  verdict: z.enum(MODERATION_VERDICTS),
  status: buildEnum(MODERATION_CLASSIFICATION_STATUS),
  findings: z.array(ZJobsPartnersModerationFinding),
  original_text: ZModerationTexts.nullable().describe("Texte saisi par le recruteur, avant masquage ; null s'il est inconnu (rejeu du stock) ou purgé"),
  masked_text: ZModerationTexts.nullable().describe("Texte transmis au classifieur ; null une fois purgé"),
  prompt_version: z.string(),
  model: z.string(),
  duration_ms: z.number().int().nonnegative().describe("Durée de la classification, attente sur 429 comprise"),
  review: ZJobsPartnersModerationReview.nullable().describe("Décision humaine sur cette classification, null tant qu'elle est à traiter"),
  created_at: z.date(),
})

export type IJobsPartnersModerationFinding = z.output<typeof ZJobsPartnersModerationFinding>
export type IJobsPartnersModerationReview = z.output<typeof ZJobsPartnersModerationReview>
export type IJobsPartnersModeration = z.output<typeof ZJobsPartnersModeration>

export default {
  zod: ZJobsPartnersModeration,
  indexes: [
    [{ job_id: 1, created_at: -1 }, {}],
    [{ verdict: 1, created_at: -1 }, {}],
    [{ "review.status": 1 }, {}],
    [{ status: 1, created_at: -1 }, {}],
    // Purge des textes au-delà de la durée de conservation (purgeModerationTexts).
    [{ created_at: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
