import type { IFeedbackFormInput } from "shared/models/feedback-form.model"
import { withFeedbackTriggerType, ZFeedbackFormFields } from "shared/models/feedback-form.model"
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
  const parsed = ZFeedbackFormFields.parse({ slug: toSnakeCaseSlug(title), title, trigger: source.trigger, questions: source.questions })
  return { ...parsed, trigger: withFeedbackTriggerType(parsed.trigger) }
}

const SLUG_MAX_LENGTH = 80

/** `recherche` → `recherche_2`, `recherche_2` → `recherche_3`, dans la limite de longueur d'un slug. */
export function nextFeedbackFormSlug(slug: string): string {
  const match = slug.match(/^(.*)_(\d+)$/)
  const [base, next] = match ? [match[1], Number(match[2]) + 1] : [slug, 2]
  const suffix = `_${next}`
  return `${base.slice(0, SLUG_MAX_LENGTH - suffix.length)}${suffix}`
}

/**
 * Valeurs de départ quand on modifie un formulaire qui a déjà des réponses : tout est repris, seul
 * le slug change. Les modifications partent dans un nouveau formulaire, l'original garde ses
 * réponses et son statut.
 */
export const toNewFormFromAnswered = (source: { slug?: string; title?: string; trigger?: unknown; questions?: unknown }): IFeedbackFormInput => {
  const parsed = ZFeedbackFormFields.parse({ slug: nextFeedbackFormSlug(source.slug ?? ""), title: source.title, trigger: source.trigger, questions: source.questions })
  return { ...parsed, trigger: withFeedbackTriggerType(parsed.trigger) }
}
