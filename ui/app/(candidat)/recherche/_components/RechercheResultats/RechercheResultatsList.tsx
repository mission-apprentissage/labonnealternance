"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useMemo } from "react"

import { RechercheResultatsFooter } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheResultatsFooter"
import { ResultCard } from "@/app/(candidat)/recherche/_components/RechercheResultats/ResultatListCard"
import { Whisper } from "@/app/(candidat)/recherche/_components/RechercheResultats/Whisper"
import { RechercheResultatsPlaceholder } from "@/app/(candidat)/recherche/_components/RechercheResultatsPlaceholder"
import { ILbaItem, useRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { useSearchViewNotifier } from "@/app/(candidat)/recherche/_hooks/useSearchViewNotifier"
import { IWhisper, useWhispers } from "@/app/(candidat)/recherche/_hooks/useWhispers"
import { IRecherchePageParams, isItemReferenceInList, type WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { ErrorMessage } from "@/components"
import ResultListsLoading from "@/components/SearchForTrainingsAndJobs/components/ResultListsLoading"

export function RechercheResultatsList(props: WithRecherchePageParams) {
  const { displayMap } = props.params
  const result = useRechercheResults(props.params)
  const whispers = useWhispers(props.params)

  const items = useMemo((): Array<ILbaItem | IWhisper> => {
    if (result.status !== "success" && result.formationStatus !== "success") {
      return []
    }

    const data = []
    for (let i = 0; i < result.itemsCount; i++) {
      if (whispers.has(i)) {
        data.push(whispers.get(i))
      }
      data.push(result.items[i])
    }

    return data
  }, [result, whispers])

  const { addSearchView } = useSearchViewNotifier()

  if (result.status === "idle") {
    // eslint-disable-next-line react/jsx-key
    return [<RechercheResultatsPlaceholder {...props} />]
  }

  if (result.status === "error") {
    // eslint-disable-next-line react/jsx-key
    return [<ErrorMessage message="Erreur technique momentanée" type="column" />]
  }

  if (result.formationStatus === "loading") {
    // eslint-disable-next-line react/jsx-key
    return [<ResultListsLoading isJobSearchLoading={result.jobStatus === "loading"} isTrainingSearchLoading />]
  }

  return [
    <Box key={0} sx={{ maxWidth: "xl", margin: "auto" }}>
      {result.nonBlockingErrors.formations && <ErrorMessage message={result.nonBlockingErrors.formations} />}
      {result.nonBlockingErrors.jobs && <ErrorMessage message={result.nonBlockingErrors.jobs} />}

      {result.formationStatus === "success" && result.formationsCount === 0 && (
        <Box mx={6} textAlign="center" my={2} fontWeight={700}>
          Aucune formation en alternance disponible pour ce métier
        </Box>
      )}
      {result.formationStatus === "success" && result.formationsCount > 0 && props.params.geo !== null && props.params.geo.radius < result.formations[0].place?.distance && (
        <Box fontWeight={700} textAlign="center" mx={4} my={2}>
          Aucune formation ne correspondait à votre zone de recherche, nous avons trouvé les plus proches
        </Box>
      )}
    </Box>,
    ...items.map((item, index) => ({
      height: item?.ideaType === "whisper" ? 112 : 270,
      render: () => <WhisperOrCard key={index} params={props.params} item={item} displayMap={displayMap} />,
      onRender: item?.ideaType !== "whisper" ? () => addSearchView(item.id) : undefined,
      item,
    })),
    <Box
      key="footer"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("3w"),
        my: fr.spacing("3w"),
        alignItems: "center",
      }}
    >
      <RechercheResultatsFooter jobStatus={result.jobStatus} searchParams={props.params} jobCount={result.jobStatus === "loading" ? 0 : result.jobsCount} />
    </Box>,
  ]
}

function WhisperOrCard({ item, params, displayMap }: { item: IWhisper | ILbaItem; params: IRecherchePageParams; displayMap: boolean }) {
  return (
    <Box
      sx={{
        my: fr.spacing("1w"),
        px: { md: displayMap ? fr.spacing("1w") : 0, lg: fr.spacing("2w") },
      }}
    >
      {item.ideaType === "whisper" ? <Whisper whisper={item} /> : <ResultCard active={isItemReferenceInList(item, params.activeItems ?? [])} item={item} params={params} />}
    </Box>
  )
}
