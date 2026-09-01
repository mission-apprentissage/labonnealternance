import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobs-partners-computed.model"
import { removeContactDetailsFromText } from "shared/utils/contact-details"
import { normalizeNafCode, normalizeNafLabel } from "shared/utils/naf-utils"
import { sanitizeTextField } from "@/common/utils/string-utils"
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
 * sanitizeTextField normalise null/undefined en "" : appliqué tel quel, il écrasait par une chaîne
 * vide les champs absents du document (le filtre ci-dessous ne sélectionne qu'un champ non nul
 * parmi ceux listés, les autres sont réécrits quand même). Une chaîne vide neutralise tous les fallbacks
 * `??` en aval — en particulier fillSiretInfosForPartners, qui ne remplissait plus workplace_name
 * depuis l'enseigne / la raison sociale du SIRET, puisque `"" ?? x` vaut "".
 *
 * Un champ absent reste donc null. En revanche un champ renseigné dont il ne reste rien après
 * sanitization (espaces ou balises seules) garde sa chaîne vide, volontairement : offer_title et
 * offer_description sont NON-nullables dans jobs_partners, et y écrire null fait échouer la
 * validation d'une offre qui passait avec "" — l'offre ne serait plus importée du tout. Le "" est
 * traité comme une valeur absente côté lecture, où les chaînes de repli utilisent `||`.
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
 * Le "" d'un champ vidé est préservé (cf. garde-fou ci-dessus) : removeContactDetailsFromText
 * renvoie "" pour une entrée vide.
 */
const sanitizeNullableDescription = (text: string | null | undefined): string | null => {
  const sanitized = sanitizeNullableTextField(text)
  return sanitized === null ? null : removeContactDetailsFromText(sanitized)
}

export const formatTextFieldsJobsPartners = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const job = COMPUTED_ERROR_SOURCE.SANITIZE_TEXT_FIELDS
  return fillFieldsForComputedPartnersFactory({
    job,
    sourceFields: fields,
    filledFields: fields,
    groupSize: 500,
    replaceMatchFilter: {
      $and: [{ $or: fields.map((f) => ({ [f]: { $ne: null } })) }, { business_error: null }, { jobs_in_success: { $nin: [job] } }, ...(addedMatchFilter ? [addedMatchFilter] : [])],
    },
    getData: async (documents) => {
      return documents.map((document) => {
        const { _id, workplace_description, offer_description, offer_title, workplace_name, workplace_naf_code, workplace_naf_label } = document
        const result: Pick<IComputedJobsPartners, (typeof fields)[number] | "_id"> = {
          _id,
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
