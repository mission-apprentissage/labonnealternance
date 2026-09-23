import type { IFeedbackFormInput } from "shared/models/feedback-form.model"
import { ZFeedbackFormFields } from "shared/models/feedback-form.model"
import { toSnakeCaseSlug } from "shared/utils/string-utils"

const COPY_SUFFIX = " (copie)"
const TITLE_MAX_LENGTH = 150

/**
 * Valeurs de départ d'une copie : même déclencheur, mêmes questions, titre suffixé et slug dérivé
 * du nouveau titre. Le slug est ce qui rattache les réponses des usagers à un formulaire : la
 * copie, avec le sien, part sans réponse.
 *
 * Schéma de lecture : un chemin qui n'existe plus (formulaire archivé depuis longtemps) reste
 * visible et signalé dans le formulaire, à retirer avant d'enregistrer.
 */
// entrée volontairement lâche : la réponse de l'API (valeurs par défaut optionnelles une fois sérialisée) est revalidée ici
export const toDuplicateFormInput = (source: { title?: string; trigger?: unknown; questions?: unknown }): IFeedbackFormInput => {
  const title = `${(source.title ?? "").slice(0, TITLE_MAX_LENGTH - COPY_SUFFIX.length)}${COPY_SUFFIX}`
  return ZFeedbackFormFields.parse({ slug: toSnakeCaseSlug(title), title, trigger: source.trigger, questions: source.questions })
}
