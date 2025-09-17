"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useMemo } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

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
import { getObjectId } from "@/utils/api"

export function RechercheResultatsList(props: WithRecherchePageParams) {
  const { displayMap } = props.rechercheParams
  const result = useRechercheResults(props.rechercheParams)
  const whispers = useWhispers(props.rechercheParams)

  const items = useMemo((): Array<ILbaItem | IWhisper> => {
    const itemsCount = result.displayedItems.length
    if (!itemsCount) {
      return []
    }
    const data = []
    for (let i = 0; i < itemsCount; i++) {
      if (whispers.has(i)) {
        data.push(whispers.get(i))
      }
      data.push(result.displayedItems[i])
    }

    return data
  }, [result, whispers])

  const { addSearchView } = useSearchViewNotifier()

  const { formationQuery, jobQuery } = result

  if (result.status === "disabled") {
    // eslint-disable-next-line react/jsx-key
    return [<RechercheResultatsPlaceholder {...props} />]
  }

  if (result.status === "error") {
    // eslint-disable-next-line react/jsx-key
    return [<ErrorMessage message="Erreur technique momentanée" type="column" />]
  }

  if (formationQuery.status === "loading") {
    // eslint-disable-next-line react/jsx-key
    return [<ResultListsLoading isJobSearchLoading={jobQuery.status === "loading"} isTrainingSearchLoading />]
  }

  const [firstFormation] = formationQuery.formations
  const jobsCount = result.displayedJobs.length

  return [
    <Box key={0} sx={{ maxWidth: "xl", margin: "auto" }}>
      {formationQuery.errorMessage && <ErrorMessage message={formationQuery.errorMessage} />}
      {jobQuery.errorMessage && <ErrorMessage message={jobQuery.errorMessage} />}

      {formationQuery.status === "success" && formationQuery.formations.length === 0 && (
        <Box mx={6} textAlign="center" my={2} fontWeight={700}>
          Aucune formation en alternance disponible pour ce métier
        </Box>
      )}
      {formationQuery.status === "success" && firstFormation && props.rechercheParams.geo !== null && props.rechercheParams.radius < firstFormation.place?.distance && (
        <Box fontWeight={700} textAlign="center" mx={4} my={2}>
          Aucune formation ne correspondait à votre zone de recherche, nous avons trouvé les plus proches
        </Box>
      )}
    </Box>,
    ...items.map((item, index) => ({
      height: item?.ideaType === "whisper" ? 112 : 270,
      render: () => <WhisperOrCard key={index} rechercheParams={props.rechercheParams} item={item} displayMap={displayMap} />,
      onRender:
        item?.ideaType !== "whisper" && item?.ideaType !== LBA_ITEM_TYPE_OLD.FORMATION
          ? () => {
              const jobId = getObjectId(item)
              if (jobId) {
                addSearchView(jobId)
              }
            }
          : undefined,
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
        paddingX: fr.spacing("4w"),
      }}
    >
      <RechercheResultatsFooter jobStatus={jobQuery.status} searchParams={props.rechercheParams} jobCount={jobQuery.status === "loading" ? 0 : jobsCount} />
    </Box>,
  ]
}

function WhisperOrCard({ item, rechercheParams, displayMap }: { item: IWhisper | ILbaItem; rechercheParams: IRecherchePageParams; displayMap: boolean }) {
  return (
    <Box
      sx={{
        my: fr.spacing("1w"),
        px: { md: displayMap ? fr.spacing("1w") : 0, lg: fr.spacing("2w") },
      }}
    >
      {item.ideaType === "whisper" ? (
        <Whisper whisper={item} />
      ) : (
        <ResultCard active={isItemReferenceInList(item, rechercheParams.activeItems ?? [])} item={item} rechercheParams={rechercheParams} />
      )}
    </Box>
  )
}
