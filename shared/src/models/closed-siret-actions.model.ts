import { z } from "zod"
import { buildEnum } from "../helpers/zod-helpers/zod-primitives-light.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "closed_siret_actions" as const

/** Motif posé sur les rôles et les entreprises désactivés par le job, pour les distinguer des autres désactivations (#5437). */
export const CLOSED_SIRET_REASON = "SIRET fermé (API Entreprise)"

export const CLOSED_SIRET_ORGANIZATION_TYPE = {
  ENTREPRISE: "ENTREPRISE",
  CFA: "CFA",
} as const

export const CLOSED_SIRET_ACTION = {
  ENTREPRISE_DESACTIVEE: "ENTREPRISE_DESACTIVEE",
  ROLE_DESACTIVE: "ROLE_DESACTIVE",
  OFFRES_ANNULEES: "OFFRES_ANNULEES",
  RETRAIT_DU_CFA: "RETRAIT_DU_CFA",
} as const

export type IClosedSiretAction = (typeof CLOSED_SIRET_ACTION)[keyof typeof CLOSED_SIRET_ACTION]

/** Une action du job de désactivation des comptes à SIRET fermé (#5437). Une ligne par modification réellement appliquée. */
export const ZClosedSiretAction = z.object({
  _id: zObjectId,
  run_id: zObjectId.describe("Exécution du job à l'origine de l'action"),
  createdAt: z.date().describe("Date de l'action"),
  siret: z.string().describe("SIRET fermé à l'INSEE"),
  date_fermeture: z.date().nullable().describe("Date de fermeture de l'établissement selon l'INSEE"),
  organization_type: buildEnum(CLOSED_SIRET_ORGANIZATION_TYPE).describe("Collection de l'organisation au SIRET fermé : entreprises ou cfas"),
  organization_id: zObjectId.describe("_id de l'organisation au SIRET fermé"),
  action: buildEnum(CLOSED_SIRET_ACTION),
  role_id: zObjectId.nullable().describe("Rôle passé à DENIED (ROLE_DESACTIVE)"),
  user_id: zObjectId.nullable().describe("Titulaire du rôle (ROLE_DESACTIVE)"),
  cfa_id: zObjectId.nullable().describe("CFA dont l'entreprise est retirée (RETRAIT_DU_CFA)"),
  offers_count: z.number().int().nonnegative().nullable().describe("Offres annulées (OFFRES_ANNULEES)"),
})

export type IClosedSiretActionLog = z.output<typeof ZClosedSiretAction>

export default {
  zod: ZClosedSiretAction,
  indexes: [
    [{ siret: 1 }, {}],
    [{ run_id: 1 }, {}],
    [{ createdAt: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
