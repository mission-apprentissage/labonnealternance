import { useQueryClient } from "@tanstack/react-query"
import type { IFeedbackFormForAdminJSON } from "shared/models/feedback-form.model"

import { useToast } from "@/app/hooks/useToast"
import { ApiError, apiPost } from "@/utils/api.utils"

import type { IFeedbackFormStatusChange } from "./feedbackFormActions"

const SUCCESS: Record<IFeedbackFormStatusChange, (title: string) => string> = {
  activate: (title) => `Formulaire « ${title} » activé`,
  deactivate: (title) => `Formulaire « ${title} » désactivé`,
}

/**
 * Active ou désactive un formulaire, puis recharge la liste et le détail. Une activation refusée
 * (aucune question, chemin déjà pris par un formulaire actif…) est expliquée par le message de
 * l'API. Renvoie `true` si le changement a eu lieu.
 */
export function useFeedbackFormStatusChange() {
  const toast = useToast()
  const queryClient = useQueryClient()

  return async (form: Pick<IFeedbackFormForAdminJSON, "slug" | "title">, action: IFeedbackFormStatusChange): Promise<boolean> => {
    const slug = form.slug ?? ""
    try {
      await apiPost(action === "activate" ? "/admin/feedback-forms/:slug/activate" : "/admin/feedback-forms/:slug/deactivate", { params: { slug } })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/admin/feedback-forms"] }),
        queryClient.invalidateQueries({ queryKey: ["/admin/feedback-forms/:slug", slug] }),
      ])
      toast({ title: SUCCESS[action](form.title ?? slug) })
      return true
    } catch (error) {
      const message = error instanceof ApiError && error.context?.statusCode >= 400 ? error.context.message : "Une erreur est survenue, merci de réessayer plus tard"
      toast({ title: message, variant: "error" })
      return false
    }
  }
}
