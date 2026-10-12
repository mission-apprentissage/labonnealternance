import type { IFeedbackFormForAdminJSON } from "shared/models/feedback-form.model"

import { PAGES } from "@/utils/routes.utils"

import type { IFeedbackFormAction } from "../_components/ConfirmationActionFormulaire"

export type IFeedbackFormStatusChange = "activate" | "deactivate"

export type IFeedbackFormActionItem = {
  id: "results" | "preview" | "edit" | "duplicate" | "activate" | "deactivate" | "archive" | "delete"
  label: string
} & (
  | { kind: "link"; href: string }
  // action destructive : passe par une modale de confirmation
  | { kind: "confirm"; action: IFeedbackFormAction }
  // changement de statut réversible : exécuté directement
  | { kind: "run"; action: IFeedbackFormStatusChange }
)

/**
 * Actions possibles sur un formulaire selon son statut, dans l'ordre d'affichage. Partagées par le
 * menu de la liste et la page de résultats, pour que les deux ne divergent pas.
 *
 * Cycle de vie : brouillon -> actif <-> inactif, tout statut -> archivé. On ne supprime qu'un
 * brouillon ou un archivé : un formulaire en service (actif ou inactif) s'archive d'abord.
 */
// forme de la réponse de l'API, où la sérialisation rend les champs optionnels
export function getFeedbackFormActions(form: Pick<IFeedbackFormForAdminJSON, "slug" | "status">): IFeedbackFormActionItem[] {
  const { status } = form
  const slug = form.slug ?? ""
  const isArchived = status === "archived"
  const actions: (IFeedbackFormActionItem | null)[] = [
    { id: "results", label: "Voir les résultats", kind: "link", href: PAGES.dynamic.backAdminFeedbackFormDetail({ slug }).getPath() },
    { id: "preview", label: "Prévisualiser", kind: "link", href: PAGES.dynamic.backAdminFeedbackFormPreview({ slug }).getPath() },
    isArchived ? null : { id: "edit", label: "Modifier", kind: "link", href: PAGES.dynamic.backAdminFeedbackFormEdit({ slug }).getPath() },
    { id: "duplicate", label: "Dupliquer", kind: "link", href: PAGES.dynamic.backAdminFeedbackFormDuplication({ slug }).getPath() },
    status === "draft" || status === "inactive" ? { id: "activate", label: "Activer", kind: "run", action: "activate" } : null,
    status === "active" ? { id: "deactivate", label: "Désactiver", kind: "run", action: "deactivate" } : null,
    isArchived ? null : { id: "archive", label: "Archiver", kind: "confirm", action: "archive" },
    status === "draft" || isArchived ? { id: "delete", label: "Supprimer", kind: "confirm", action: "delete" } : null,
  ]
  return actions.filter((action) => action !== null)
}
