import { z } from "zod"

import { LBA_ITEM_TYPE } from "../constants/lbaitem.js"
import { TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "../constants/recruteur.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { IDiplomaParam } from "../routes/_params.js"

import { ZPointGeometry } from "./address.model.js"
import { IModelDescriptor, zObjectId } from "./common.js"
import { JOB_STATUS_ENGLISH, ZDelegation } from "./job.model.js"
import { ZComputedJobPartnersDuplicateRef } from "./jobPartnersDuplicateRef.js"
import { zOpcoLabel } from "./opco.model.js"

const collectionName = "jobs_partners" as const

// Les partenaires dans JOBPARTNERS_LABEL sont traités par flux
// sauf ceux dans jobPartnersExcludedFromFlux
// Les partenaires inconnus sont traités par Api

export enum JOBPARTNERS_LABEL {
  OFFRES_EMPLOI_LBA = LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
  RECRUTEURS_LBA = LBA_ITEM_TYPE.RECRUTEURS_LBA,
  HELLOWORK = "Hellowork",
  FRANCE_TRAVAIL = "France Travail",
  RH_ALTERNANCE = "RH Alternance",
  PASS = "PASS",
  MONSTER = "Monster",
  METEOJOB = "Meteojob",
  KELIO = "Kelio",
  LAPOSTE = "La Poste",
  ATLAS = "annonces Atlas",
  NOS_TALENTS_NOS_EMPLOIS = "Nos Talents Nos Emplois",
  VITE_UN_EMPLOI = "Vite un emploi",
  TOULOUSE_METROPOLE = "Toulouse metropole",
  JOOBLE = "Jooble",
  DECATHLON = "Décathlon",
  JOBTEASER = "Jobteaser",
  // Attention : les partner labels par API ne doivent PAS être ajoutés : par définition, nous ne connaissons pas leurs valeurs.
  // De nouvelles valeurs peuvent être ajoutées par les clients Api
}

export const jobPartnersExcludedFromFlux = [JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, JOBPARTNERS_LABEL.RECRUTEURS_LBA]

export const ZJobsPartnersRecruiterApi = z.object({
  _id: zObjectId,
  workplace_siret: extensions.siret.nullable().describe("Siret de l'entreprise"),
  workplace_brand: z.string().nullable().describe("Nom d'enseigne de l'établissement"),
  workplace_legal_name: z.string().nullable().describe("Nom légal de l'entreprise"),
  workplace_website: z.string().nullable().describe("Site web de l'entreprise").openapi({ format: "uri" }),
  workplace_name: z.string().nullable().describe("Nom customisé de l'entreprise"),
  workplace_description: z.string().nullable().describe("description de l'entreprise"),
  workplace_size: z.string().nullable().describe("Taille de l'entreprise"),
  workplace_address_label: z.string().describe("Adresse de l'offre, provenant du SIRET ou du partenaire"),
  workplace_geopoint: ZPointGeometry.describe("Geolocalisation de l'offre"),
  workplace_idcc: z.number().nullable().describe("Identifiant convention collective"),
  workplace_opco: zOpcoLabel.nullable().describe("Nom de l'OPCO"),
  workplace_naf_code: z.string().nullable().describe("code NAF"),
  workplace_naf_label: z.string().nullable().describe("Libelle NAF"),

  apply_url: z.string().url().describe("URL pour candidater"),
  apply_phone: z.string().nullable().describe("Téléphone de contact"),
  apply_recipient_id: z
    .string()
    .nullish()
    .describe(
      "Identifiant permettant de candidater via l'API ou le widget /postuler, généré à la volée pour les opportunités dont on dispose de l'adresse email. Si null il n'est pas possible d'utiliser le widget /postuler ou d'utiliser la route api pour postuler"
    ),
  is_delegated: z.boolean().default(false).describe("Indique si l'offre est déléguée à un mandataire"),

  cfa_legal_name: z.string().nullish().describe("Raison sociale du CFA si offre déléguée"),
  cfa_siret: extensions.siret.nullish().describe("Siret du CFA si offre déléguée"),
  cfa_address_label: z.string().nullish().describe("Adresse du CFA si offre déléguée"),
  cfa_apply_phone: z.string().nullish().describe("Téléphone de contact du CFA"),
})

export const NIVEAUX_DIPLOMES_EUROPEENS = [
  {
    value: "3",
    label: "Cap, autres formations (Infrabac)",
  },
  {
    value: "4",
    label: "BP, Bac, autres formations (Bac)",
  },
  {
    value: "5",
    label: "BTS, DEUST, autres formations (Bac+2)",
  },
  {
    value: "6",
    label: "Licence, Maîtrise, autres formations (Bac+3 à Bac+4)",
  },
  {
    value: "7",
    label: "Master, titre ingénieur, autres formations (Bac+5)",
  },
] as const

export const NIVEAUX_DIPLOMES_EUROPEENS_ENUM = Object.fromEntries(NIVEAUX_DIPLOMES_EUROPEENS.map((x) => [x.value, x.value]))

export const zDiplomaEuropeanLevel = extensions.buildEnum(NIVEAUX_DIPLOMES_EUROPEENS_ENUM)

export type INiveauDiplomeEuropeen = z.output<typeof zDiplomaEuropeanLevel>

export const INiveauDiplomeEuropeen = {
  fromParam(niveauParam: IDiplomaParam): INiveauDiplomeEuropeen | undefined {
    return NIVEAUX_DIPLOMES_EUROPEENS.find((x) => x.value === niveauParam?.substring(0, 1))?.value
  },
}

export const ZJobsPartnersOfferHistoryEvent = z.object({
  status: extensions.buildEnum(JOB_STATUS_ENGLISH).describe("Statut de l'accès"),
  reason: z.string().describe("Raison du changement de statut"),
  date: z.date().describe("Date de l'évènement"),
  granted_by: z.string().describe("Utilisateur à l'origine du changement"),
})
export type IJobsPartnersOfferHistoryEvent = z.output<typeof ZJobsPartnersOfferHistoryEvent>

export const ZJobsPartnersOfferApi = ZJobsPartnersRecruiterApi.omit({
  _id: true,
}).extend({
  _id: z.union([zObjectId, z.string()]).nullable().describe("Identifiant de l'offre"),

  partner_label: z.string().describe("Référence du partenaire"),
  partner_job_id: z.string().describe("Identifiant d'origine de l'offre provenant du partenaire"),

  contract_start: z.date().nullable().describe("Date de début de contrat").openapi({ format: "date-time" }),
  contract_duration: z.number().int().min(0).nullable().describe("Durée du contrat en mois"),
  contract_type: z.array(extensions.buildEnum(TRAINING_CONTRACT_TYPE)).describe("type de contrat, formaté à l'insertion"),
  contract_remote: extensions.buildEnum(TRAINING_REMOTE_TYPE).nullable().describe("Format de travail de l'offre"),
  contract_rythm: z.string().nullish().describe("Rythme de l'alternance, formaté à l'insertion, exemple : 2 semaines entreprise / 1 semaine école"),
  contract_is_disabled_elligible: z.boolean().default(false).describe("Indique si l'offre est éligible aux personnes en situation de handicap"),

  offer_title: z.string().min(3).describe("Titre de l'offre"),
  offer_rome_codes: z.array(extensions.romeCode()).describe("Code rome de l'offre"),
  offer_description: z.string().describe("description de l'offre, soit définit par le partenaire, soit celle du ROME si pas suffisament grande"),
  offer_target_diploma: z
    .object({
      european: zDiplomaEuropeanLevel.describe("Niveau de diplome visé en fin d'étude, transformé pour chaque partenaire"),
      label: z.string().describe("Libellé du niveau de diplome"),
    })
    .nullable(),
  offer_desired_skills: z.array(z.string()).describe("Compétence attendues par le candidat pour l'offre"),
  offer_to_be_acquired_skills: z.array(z.string()).describe("Compétence acquises durant l'alternance"),
  offer_to_be_acquired_knowledge: z.array(z.string()).nullish().describe("Connaissances acquises durant l'alternance"),
  offer_access_conditions: z.array(z.string()).describe("Conditions d'accès à l'offre"),
  offer_creation: z.date().nullable().describe("Date de creation de l'offre").openapi({ format: "date-time" }),
  offer_expiration: z.date().nullable().describe("Date d'expiration de l'offre. Si pas présente, mettre à creation_date + 60j").openapi({ format: "date-time" }),
  offer_opening_count: z.number().describe("Nombre de poste disponible"),
  offer_status: extensions.buildEnum(JOB_STATUS_ENGLISH).describe("Status de l'offre (surtout utilisé pour les offres ajouté par API)"),
  offer_status_history: z.array(ZJobsPartnersOfferHistoryEvent).describe("Historique de l'offre"),

  stats_detail_view: z.number().default(0).describe("Nombre de vues de la page de détail"),
  stats_search_view: z.number().default(0).describe("Nombre de vues sur une page de recherche"),
  stats_postuler: z.number().default(0).describe("Nombre de clicks sur le bouton postuler"),
})

const ZJobsPartnersRecruiterPrivateFields = z.object({
  apply_email: z.string().email().nullable().describe("Email de contact").default(null),
  offer_multicast: z.boolean().default(true).describe("Si l'offre peut être diffusé sur l'ensemble des plateformes partenaires"),
  offer_origin: z.string().nullable().describe("Origine de l'offre provenant d'un aggregateur").default(null),

  workplace_address_street_label: z.string().nullable().describe("Numéro et voie, provenant du SIRET ou du partenaire"),
  workplace_address_city: z.string().nullable().describe("Nom de ville, provenant du SIRET ou du partenaire"),
  workplace_address_zipcode: extensions.zipCode().nullable().describe("Code postal, provenant du SIRET ou du partenaire"),

  cfa_siret: extensions.siret.nullish().describe("Siret du CFA si offre déléguée"),
  cfa_legal_name: z.string().nullish().describe("Raison sociale du CFA si offre déléguée"),
  cfa_apply_phone: z.string().nullish().describe("Numéro de téléphone du CFA si offre déléguée"),
  cfa_apply_email: z.string().email().nullish().describe("Email de contact du CFA si offre déléguée"),
  cfa_address_label: z.string().nullish().describe("Adresse du CFA si offre déléguée"),
  job_status_comment: z.string().nullish().describe("Raison de la suppression de l'offre"),
  job_delegation_count: z.number().nullish().describe("Nombre de délégations"),
  delegations: z.array(ZDelegation).nullish().describe("Liste des délégations"),

  created_at: z.date().describe("Date de creation de l'offre"),
  updated_at: z.date().describe("Date de mise à jour de l'offre"),
})

export const ZJobsPartnersRecruiterPrivate = ZJobsPartnersRecruiterApi.merge(ZJobsPartnersRecruiterPrivateFields)

export const ZJobsPartnersOfferPrivate = ZJobsPartnersOfferApi.omit({
  _id: true,
  apply_url: true,
})
  .merge(ZJobsPartnersRecruiterPrivateFields)
  .extend({
    _id: zObjectId,
    apply_url: ZJobsPartnersOfferApi.shape.apply_url.nullable().default(null),
    rank: z.number().nullish().describe("Valeur indiquant la qualité de l'offre. Plus la valeur est élevée, plus la qualité de l'offre est importante"),
    duplicates: z.array(ZComputedJobPartnersDuplicateRef).nullish().describe("Référence les autres offres en duplicata avec celle-ci"),
    applicationCount: z.number().nullish().describe("Nombre de candidatures pour cette offre"),
    lba_url: z.string().nullable().default(null),
  })

export const ZJobsPartnersOfferPrivateWithDistance = ZJobsPartnersOfferPrivate.extend({
  distance: z.number().nullish(),
})

export const ZJobsPartnersRecruteurAlgoPrivate = ZJobsPartnersOfferPrivate.omit({ workplace_siret: true, workplace_legal_name: true }).extend({
  workplace_siret: z.string().describe("Siret toujours présent pour les entreprises issue de l'algo"),
  workplace_legal_name: z.string().describe("Raison sociale toujours présente pour les entreprises issue de l'algo"),
})
export type IJobsPartnersRecruteurAlgoPrivate = z.output<typeof ZJobsPartnersRecruteurAlgoPrivate>

export type IJobsPartnersRecruiterApi = z.output<typeof ZJobsPartnersRecruiterApi>
export type IJobsPartnersOfferApi = z.output<typeof ZJobsPartnersOfferApi>

export type IJobsPartnersRecruiterPrivate = z.output<typeof ZJobsPartnersRecruiterPrivate>
export type IJobsPartnersOfferPrivate = z.output<typeof ZJobsPartnersOfferPrivate>
export type IJobsPartnersOfferPrivateWithDistance = z.output<typeof ZJobsPartnersOfferPrivateWithDistance>
export type IJobsPartnersOfferPrivateInput = z.input<typeof ZJobsPartnersOfferPrivate>

const TIME_CLOCK_TOLERANCE = 300_000

export const ZJobsPartnersPostApiBodyBase = z.object({
  contract_start: z
    .string({ message: "Expected ISO 8601 date string" })
    .datetime({ offset: true, message: "Expected ISO 8601 date string" })
    .pipe(z.coerce.date())
    .nullable()
    .default(null),
  contract_duration: ZJobsPartnersOfferPrivate.shape.contract_duration.default(null),
  contract_type: ZJobsPartnersOfferPrivate.shape.contract_type.default([TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]),
  contract_remote: ZJobsPartnersOfferPrivate.shape.contract_remote.default(null),

  offer_title: ZJobsPartnersOfferPrivate.shape.offer_title,
  offer_rome_codes: ZJobsPartnersOfferPrivate.shape.offer_rome_codes.nullable().default(null),
  offer_description: ZJobsPartnersOfferPrivate.shape.offer_description.min(30, "Job description should be at least 30 characters"),
  offer_target_diploma_european: zDiplomaEuropeanLevel.nullable().default(null),
  offer_desired_skills: ZJobsPartnersOfferPrivate.shape.offer_desired_skills.default([]),
  offer_to_be_acquired_skills: ZJobsPartnersOfferPrivate.shape.offer_to_be_acquired_skills.default([]),
  offer_access_conditions: ZJobsPartnersOfferPrivate.shape.offer_access_conditions.default([]),
  offer_creation: z
    .string({ message: "Expected ISO 8601 date string" })
    .datetime({ offset: true, message: "Expected ISO 8601 date string" })
    .pipe(
      z.coerce.date().refine((value) => value.getTime() < Date.now() + TIME_CLOCK_TOLERANCE, {
        message: "Creation date cannot be in the future",
      })
    )
    .nullable()
    .default(null),
  offer_expiration: z
    .string({ message: "Expected ISO 8601 date string" })
    .datetime({ offset: true, message: "Expected ISO 8601 date string" })
    .pipe(
      z.coerce.date().refine((value) => value === null || value.getTime() > Date.now() - TIME_CLOCK_TOLERANCE, {
        message: "Expiration date cannot be in the past",
      })
    )
    .nullable()
    .default(null),
  offer_opening_count: ZJobsPartnersOfferPrivate.shape.offer_opening_count.default(1),
  offer_origin: ZJobsPartnersOfferPrivate.shape.offer_origin,
  offer_status: ZJobsPartnersOfferPrivate.shape.offer_status.default(JOB_STATUS_ENGLISH.ACTIVE),
  offer_multicast: ZJobsPartnersOfferPrivate.shape.offer_multicast,

  workplace_siret: extensions.siret,
  workplace_description: ZJobsPartnersOfferPrivate.shape.workplace_description.default(null),
  workplace_website: ZJobsPartnersOfferPrivate.shape.workplace_website.default(null),
  workplace_name: ZJobsPartnersOfferPrivate.shape.workplace_name.default(null),
  workplace_address_label: z.string().nullable().default(null),
  apply_email: ZJobsPartnersOfferPrivate.shape.apply_email,
  apply_url: ZJobsPartnersOfferApi.shape.apply_url.nullable().default(null),
  apply_phone: extensions.telephone.nullable().describe("Téléphone de contact").default(null),
})

export const ZJobsPartnersWritableApi = ZJobsPartnersPostApiBodyBase.superRefine((data, ctx) => {
  const keys = ["apply_url", "apply_email", "apply_phone"] as const
  if (keys.every((key) => data[key] == null)) {
    keys.forEach((key) => {
      ctx.addIssue({
        code: "custom",
        message: "At least one of apply_url, apply_email, or apply_phone is required",
        path: [key],
      })
    })
  }

  return data
})

export type IJobsPartnersWritableApi = z.output<typeof ZJobsPartnersWritableApi>
export type IJobsPartnersWritableApiInput = z.input<typeof ZJobsPartnersWritableApi>

export default {
  zod: ZJobsPartnersOfferPrivate,
  indexes: [
    [{ workplace_geopoint: "2dsphere", offer_multicast: 1, offer_rome_codes: 1, offer_status: 1, offer_expiration: 1, partner_label: 1, "offer_target_diploma.european": 1 }, {}],
    [{ offer_multicast: 1, offer_rome_codes: 1, offer_creation: -1 }, {}],
    [{ offer_multicast: 1, "offer_target_diploma.european": 1, offer_creation: -1 }, {}],
    [{ partner_label: 1, partner_job_id: 1 }, { unique: true }],
    [{ partner_label: 1 }, {}],
    [{ workplace_siret: 1 }, {}],
    [{ workplace_brand: 1 }, {}],
    [{ workplace_legal_name: 1 }, {}],
    [{ workplace_name: 1 }, {}],
    [{ offer_status: 1 }, {}],
    [{ offer_expiration: 1 }, {}],
    [{ contract_is_disabled_elligible: 1 }, {}],
    [{ "duplicates.partner_job_id": 1 }, {}],
    [{ "duplicates.partner_job_label": 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
