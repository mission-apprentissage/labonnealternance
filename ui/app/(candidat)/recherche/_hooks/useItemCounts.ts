import { useRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { UserItemTypes } from "@/app/_components/RechercheForm/RechercheForm"

export function useItemCounts(params: IRecherchePageParams) {
  const rechercheResults = useRechercheResults(params)
  return {
    [UserItemTypes.EMPLOI]: rechercheResults.status === "success" ? rechercheResults.jobsCount + rechercheResults.entrepriseCount + rechercheResults.partenariatCount : undefined,
    [UserItemTypes.FORMATIONS]: rechercheResults.formationStatus === "success" ? rechercheResults.formationsCount : undefined,
  }
}
