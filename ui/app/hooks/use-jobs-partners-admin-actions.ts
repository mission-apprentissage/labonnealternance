import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { useToast } from "@/app/hooks/useToast"
import { activateJobPartner, deactivateJobPartner, setJobPartnerClassification } from "@/utils/api"

export const useJobsPartnersAdminActions = () => {
  const client = useQueryClient()
  const toast = useToast()

  const withToast = useCallback(
    async (apiCall: () => Promise<unknown>, successMessage: string) => {
      try {
        await apiCall()
        await client.invalidateQueries({ queryKey: ["/admin/jobs-partners"] })
        toast({ description: successMessage, autoHideDuration: 4000 })
      } catch (error) {
        toast({ variant: "error", description: error instanceof Error ? error.message : "Une erreur est survenue", autoHideDuration: 5000 })
      }
    },
    [client, toast]
  )

  return {
    activate: (id: string) => withToast(() => activateJobPartner(id), "Offre réactivée"),
    deactivate: (id: string, reason: string) => withToast(() => deactivateJobPartner(id, reason), "Offre désactivée"),
    setClassification: async (id: string, classification: "publish" | "unpublish") => {
      const label = classification === "unpublish" ? "Offre signalée comme CFA" : "Signalement CFA retiré"
      try {
        const result = await setJobPartnerClassification(id, classification)
        await client.invalidateQueries({ queryKey: ["/admin/jobs-partners"] })
        if (!result.updated) {
          toast({ variant: "warning", description: "Aucune entrée de classification trouvée pour cette offre, aucune action effectuée.", autoHideDuration: 5000 })
        } else {
          toast({ description: label, autoHideDuration: 4000 })
        }
      } catch (error) {
        toast({ variant: "error", description: error instanceof Error ? error.message : "Une erreur est survenue", autoHideDuration: 5000 })
      }
    },
  }
}
