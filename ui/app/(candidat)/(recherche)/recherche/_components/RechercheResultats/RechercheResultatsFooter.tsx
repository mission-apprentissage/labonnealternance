import { Typography } from "@mui/material"

import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import ResultListsLoading from "@/components/SearchForTrainingsAndJobs/components/ResultListsLoading"

type RechercheResultatsFooterProps = {
  jobStatus: "success" | "error" | "disabled" | "loading"
  jobCount: number
  searchParams: IRecherchePageParams
}

export function RechercheResultatsFooter(props: RechercheResultatsFooterProps) {
  if (props.jobStatus === "loading") {
    return <ResultListsLoading isJobSearchLoading isTrainingSearchLoading={false} />
  }

  if (props.jobStatus === "success" && props.jobCount === 0) {
    return (
      <Typography
        sx={{
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        Aucune entreprise trouvée pour votre recherche.
        <br />
        Nous vous conseillons de modifier vos critères : mots-clés, zone géographique, engagement handicap, etc.
      </Typography>
    )
  }

  return (
    <>
      <Typography
        sx={{
          fontWeight: "bold",
        }}
      >
        Vous êtes arrivé.e au bout de la liste.
      </Typography>
      <Typography
        sx={{
          fontWeight: "bold",
        }}
      >
        Pour voir d'autres possibilités, revenez plus tard ou changez vos critères de recherche
      </Typography>
    </>
  )
}
