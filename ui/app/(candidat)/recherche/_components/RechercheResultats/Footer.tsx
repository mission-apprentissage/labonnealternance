import Button from "@codegouvfr/react-dsfr/Button"
import { Typography } from "@mui/material"
import { useCallback } from "react"

import RechercheCDICDD from "@/components/SearchForTrainingsAndJobs/components/rechercheCDDCDI"
import ResultListsLoading from "@/components/SearchForTrainingsAndJobs/components/ResultListsLoading"
import { IRecherchePageParams, PAGES } from "@/utils/routes.utils"

type RechercheResultatsFooterProps = {
  isLoadingJob: boolean
  isSearchingJobs: boolean
  jobCount: number
  searchParams: IRecherchePageParams
}

export function RechercheResultatsFooter(props: RechercheResultatsFooterProps) {
  const onExtendSearch = useCallback(() => {
    window.history.pushState(
      null,
      "",
      PAGES.dynamic
        .recherche({
          ...props.searchParams,
          geo: null,
        })
        .getPath()
    )
  }, [props.searchParams])

  if (props.isLoadingJob) {
    return <ResultListsLoading isJobSearchLoading={props.isLoadingJob} isTrainingSearchLoading={false} />
  }

  if (props.isSearchingJobs) {
    if (props.jobCount === 0) {
      return (
        <Typography textAlign="center" fontWeight="bold">
          Aucune entreprise trouvée pour votre recherche
        </Typography>
      )
    }

    if (props.jobCount < 100) {
      return (
        <>
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
          <RechercheCDICDD romes={props.searchParams.romes} geo={props.searchParams.geo} />
        </>
      )
    }
  }

  return (
    <>
      <Typography fontWeight="bold">Vous êtes arrivé.e au bout de la liste.</Typography>
      <Typography fontWeight="bold">Pour voir d'autres possibilités, revenez plus tard ou changez vos critères de recherche</Typography>
    </>
  )
}
