import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export const ZAnonymizedApplication = z
  .object({
    _id: zObjectId,
    company_recruitment_intention: z.string().nullable().describe("L'intention de la société vis à vis du candidat"),
    company_feedback_date: z.date().nullable().describe("Date d'intention/avis donnée"),
    company_siret: extensions.siret.describe('Le siret de l\'entreprise. Fourni par La bonne alternance. Example: "00004993900000"'),
    company_naf: z.string().describe('La valeur associée au code NAF de l\'entreprise. Fournie par La bonne alternance. Example: "Boulangerie et boulangerie-pâtisserie"'),
    job_origin: z.string().nullable().describe('Le type de société selon la nomenclature La bonne alternance. Fourni par La bonne alternance. Example: "lba|lbb|matcha"'),
    job_id: z
      .string()
      .nullable()
      .describe(
        'L\'identifiant de l\'offre La bonne alternance Recruteur pour laquelle la candidature est envoyée. Seulement si le type de la société (company_type) est "matcha" . La valeur est fournie par La bonne alternance. Example: "...59c24c059b..."'
      ),
    caller: z.string().nullable().describe("L'identification de la source d'émission de la candidature (pour widget et api)"),
    created_at: z.date().nullable().describe("La date création de la demande"),
  })
  .strict()
  .describe("Anonymized Application")

export type IAnonymizedApplication = z.output<typeof ZAnonymizedApplication>
