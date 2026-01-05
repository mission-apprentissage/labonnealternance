import Button from "@codegouvfr/react-dsfr/Button"
import { Typography } from "@mui/material"
import { useCallback } from "react"

import { useNavigateToRecherchePage } from "@/app/(candidat)/(recherche)/recherche/_hooks/useNavigateToRecherchePage"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import RechercheCDICDD from "@/components/SearchForTrainingsAndJobs/components/rechercheCDDCDI"
import ResultListsLoading from "@/components/SearchForTrainingsAndJobs/components/ResultListsLoading"

type RechercheResultatsFooterProps = {
  jobStatus: "success" | "error" | "disabled" | "loading"
  jobCount: number
  searchParams: IRecherchePageParams
}

export function RechercheResultatsFooter(props: RechercheResultatsFooterProps) {
  const navigateToRecherchePage = useNavigateToRecherchePage(props.searchParams)
  const onExtendSearch = useCallback(() => {
    navigateToRecherchePage({ geo: null }, true)
  }, [navigateToRecherchePage])

  if (props.jobStatus === "loading") {
    return <ResultListsLoading isJobSearchLoading isTrainingSearchLoading={false} />
  }

  if (props.jobStatus === "success") {
    if (props.jobCount === 0) {
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

    if (props.jobCount < 50) {
      return (
        <>
          {props.jobCount === 0 && (
            <>
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
              {props.searchParams.geo !== null && (
                <>
                  <Typography textAlign="center" fontWeight="bold">
                    Peu de résultats dans votre zone de recherche
                  </Typography>
                  <Button title="Rechercher sur la France entière" priority="primary" onClick={onExtendSearch}>
                    Rechercher sur la France entière
                  </Button>
                </>
              )}
            </>
          )}
          <RechercheCDICDD romes={props.searchParams.romes} geo={props.searchParams.geo} />
        </>
      )
    }
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
