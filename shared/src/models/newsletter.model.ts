import type { Jsonify } from "type-fest"

import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

/** Nombre d'éditions affichées sur la page publique « La lettre de l'alternance » (#5776). */
export const NEWSLETTER_PUBLIC_LIMIT = 6

/**
 * Lien vers l'édition publiée sur LinkedIn. Les éditions sont lisibles sans compte LinkedIn, mais
 * aucune API ne permet de les synchroniser : chaque édition est saisie à la main dans le back-office (#5776).
 */
const zLinkedinUrl = z
  .url({ protocol: /^https$/, hostname: /^([a-z0-9-]+\.)*linkedin\.com$/, error: "Indiquez l'adresse https de l'édition sur linkedin.com" })
  .max(500, "L'adresse ne peut pas dépasser 500 caractères")

const ZNewsletterFields = z.strictObject({
  title: z.string({ error: "Le titre est obligatoire" }).trim().min(1, "Le titre est obligatoire").max(150, "Le titre ne peut pas dépasser 150 caractères"),
  edition_date: z.coerce.date<Date>(),
  linkedin_url: zLinkedinUrl,
  is_visible: z.boolean(),
})

/** Champs saisis dans le back-office, à la création comme à la modification. */
export const ZNewsletterInput = ZNewsletterFields.extend({
  // `z.coerce.date` seul ferait de `null` le 1er janvier 1970
  edition_date: z.union([z.string(), z.date()], { error: "Indiquez la date de l'édition" }).pipe(z.coerce.date<Date>({ error: "Indiquez la date de l'édition" })),
})
export type INewsletterInput = z.output<typeof ZNewsletterInput>

export const ZNewsletter = ZNewsletterFields.extend({
  _id: zObjectId,
  created_at: z.coerce.date<Date>(),
  updated_at: z.coerce.date<Date>(),
  // email de l'admin ayant créé l'édition (membre de l'équipe, jamais un usager)
  created_by: z.string(),
})
export type INewsletter = z.output<typeof ZNewsletter>
export type INewsletterJSON = Jsonify<INewsletter>

/** Ce que la page publique reçoit d'une édition : rien de ce qui est interne au back-office. */
export const ZNewsletterPublic = ZNewsletter.pick({ _id: true, title: true, edition_date: true, linkedin_url: true })
export type INewsletterPublic = z.output<typeof ZNewsletterPublic>
export type INewsletterPublicJSON = Jsonify<INewsletterPublic>

export default {
  zod: ZNewsletter,
  indexes: [[{ is_visible: 1, edition_date: -1 }, {}]],
  collectionName: "newsletters" as const,
} as const satisfies IModelDescriptor
