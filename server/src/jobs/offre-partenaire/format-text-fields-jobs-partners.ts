import { JOBPARTNERS_LABEL, OFFER_DESCRIPTION_MIN_LENGTH } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { removeContactDetailsFromText } from "shared/utils/contact-details"
import { normalizeNafCode, normalizeNafLabel } from "shared/utils/naf-utils"
import { sanitizeTextField, sanitizeToPlainText } from "@/common/utils/string-utils"
import type { FillComputedJobsPartnersContext } from "./fill-computed-jobs-partners"
import { fillFieldsForComputedPartnersFactory } from "./fill-fields-for-partners-factory"

const fields = [
  "workplace_description",
  "workplace_name",
  "offer_description",
  "offer_title",
  "workplace_naf_code",
  "workplace_naf_label",
] as const satisfies (keyof IComputedJobsPartners)[]

/**
 * sanitizeTextField normalise null/undefined en "" : appliqué tel quel, il écrirait une chaîne vide
 * dans les champs absents (le filtre ci-dessous sélectionne un document dès qu'un seul des champs
 * listés est non nul, tous sont réécrits). Or "" neutralise les fallbacks `??` en aval, par exemple
 * dans fillSiretInfosForPartners (`"" ?? x` vaut ""). Un champ absent reste donc null.
 *
 * Un champ renseigné dont il ne reste rien après sanitization (espaces ou balises seules) garde en
 * revanche sa chaîne vide : offer_title est NON-nullable dans jobs_partners, y écrire null ferait
 * rejeter l'offre à la validation. Côté lecture, les chaînes de repli utilisent `||` pour traiter ""
 * comme absent. Une offer_description vidée bloque l'offre (cf. isOfferDescriptionTooShort).
 */
const sanitizeNullableTextField = (text: string | null | undefined): string | null => {
  if (text == null) {
    return null
  }
  return sanitizeTextField(text, true)
}

/**
 * Descriptions : sanitization puis retrait des coordonnées transmises en clair par les partenaires
 * (issue #5227), dans cet ordre. sanitizeTextField décode d'abord les entités HTML, donc un email
 * masqué en `&#64;` redevient détectable ; il retire aussi les balises `<a href="mailto:...">` en
 * conservant leur texte visible, que les regex prennent ensuite en charge.
 *
 * Le "" d'un champ vidé est préservé (cf. sanitizeNullableTextField) : removeContactDetailsFromText
 * renvoie "" pour une entrée vide.
 */
const sanitizeNullableDescription = (text: string | null | undefined): string | null => {
  const sanitized = sanitizeNullableTextField(text)
  return sanitized === null ? null : removeContactDetailsFromText(sanitized)
}

/**
 * Mesure le texte visible : balises de mise en forme (gardées par keepFormat) et blancs ne comptent pas.
 * Seuil commun aux routes d'écriture et au pipeline computed (#5855).
 */
export const isOfferDescriptionTooShort = (text: string | null | undefined): boolean => sanitizeToPlainText(sanitizeNullableDescription(text)).length < OFFER_DESCRIPTION_MIN_LENGTH

export const formatTextFieldsJobsPartners = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const job = COMPUTED_ERROR_SOURCE.SANITIZE_TEXT_FIELDS
  return fillFieldsForComputedPartnersFactory({
    job,
    sourceFields: [...fields, "partner_label"],
    filledFields: [...fields, "business_error"],
    groupSize: 500,
    replaceMatchFilter: {
      $and: [{ $or: fields.map((f) => ({ [f]: { $ne: null } })) }, { business_error: null }, { jobs_in_success: { $nin: [job] } }, ...(addedMatchFilter ? [addedMatchFilter] : [])],
    },
    getData: async (documents) => {
      return documents.map((document) => {
        const { _id, partner_label, workplace_description, offer_description, offer_title, workplace_name, workplace_naf_code, workplace_naf_label } = document
        // Les recruteurs LBA n'ont pas de description : le champ vaut la constante RECRUTEURS_LBA.
        const isDescriptionTooShort = partner_label !== JOBPARTNERS_LABEL.RECRUTEURS_LBA && isOfferDescriptionTooShort(offer_description)
        const result: Pick<IComputedJobsPartners, (typeof fields)[number] | "_id" | "business_error"> = {
          _id,
          business_error: isDescriptionTooShort ? JOB_PARTNER_BUSINESS_ERROR.DESCRIPTION_TOO_SHORT : null,
          workplace_description: sanitizeNullableDescription(workplace_description),
          workplace_name: sanitizeNullableTextField(workplace_name),
          offer_description: sanitizeNullableDescription(offer_description),
          offer_title: sanitizeNullableTextField(offer_title),
          // Issue #5344 : les partenaires et les API amont ne s'accordent ni sur le séparateur du
          // code, ni sur la casse du libellé. Normalisé ici pour que les jobs suivants (dont
          // blockJobsPartnersWithNaf85) et jobs_partners voient une forme unique.
          workplace_naf_code: normalizeNafCode(workplace_naf_code),
          workplace_naf_label: normalizeNafLabel(workplace_naf_label),
        }
        return result
      })
    },
  })
}
