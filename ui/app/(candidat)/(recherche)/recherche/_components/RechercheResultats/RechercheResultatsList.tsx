"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useMemo } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"
import { assertUnreachable } from "shared/utils/assertUnreachable"

import { LbaItemCard } from "./LbaItemCard"
import { RechercheResultatsFooter } from "./RechercheResultatsFooter"
import { Whisper } from "./Whisper"
import { RechercheResultatsPlaceholder } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheResultatsPlaceholder"
import type { ILbaItem } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { useRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { useSearchViewNotifier } from "@/app/(candidat)/(recherche)/recherche/_hooks/useSearchViewNotifier"
import type { IWhisper } from "@/app/(candidat)/(recherche)/recherche/_hooks/useWhispers"
import { useWhispers } from "@/app/(candidat)/(recherche)/recherche/_hooks/useWhispers"
import type { IRecherchePageParams, WithRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { isItemReferenceInList } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { Footer } from "@/app/_components/Footer"
import { ErrorMessage } from "@/components"
import { ValorisationCandidatureSpontanee } from "@/components/ItemDetail/ValorisationCandidatureSpontanee"
import ResultListsLoading from "@/components/SearchForTrainingsAndJobs/components/ResultListsLoading"
import { getObjectId } from "@/utils/api"

type ResultCardILba = {
  type: "lba_item"
  value: ILbaItem
}

type ResultCardData =
  | ResultCardILba
  | {
      type: "whisper"
      value: IWhisper
    }
  | {
      type: "ValorisationCandidatureSpontanee"
    }

export function RechercheResultatsList(props: WithRecherchePageParams) {
  const { displayMap } = props.rechercheParams
  const result = useRechercheResults(props.rechercheParams)
  const whispers = useWhispers(props.rechercheParams)

  const shouldDisplayCandidatureSpontaneBoost = result.jobQuery.lbaJobs.length + result.jobQuery.partnerJobs.length >= 10

  const items = useMemo(() => {
    const itemsCount = result.displayedItems.length
    if (!itemsCount) {
      return []
    }
    const data: ResultCardData[] = []
    let jobCounter = 0
    for (let i = 0; i < itemsCount; i++) {
      const lbaItem = result.displayedItems[i]
      if (shouldDisplayCandidatureSpontaneBoost) {
        if (jobCounter === 5) {
          data.push({ type: "ValorisationCandidatureSpontanee" })
        }
        if (lbaItem.ideaType !== LBA_ITEM_TYPE_OLD.FORMATION) {
          jobCounter++
        }
      }
      const whisperOpt = whispers.get(i)
      if (whisperOpt) {
        data.push({
          type: "whisper",
          value: whisperOpt,
        })
      }
      data.push({
        type: "lba_item",
        value: lbaItem,
      })
    }

    return data
  }, [result, whispers, shouldDisplayCandidatureSpontaneBoost])

  const { addSearchView } = useSearchViewNotifier()

  const { formationQuery, jobQuery } = result

  if (result.status === "disabled") {
    return [<RechercheResultatsPlaceholder {...props} />]
  }

  if (result.status === "error") {
    return [<ErrorMessage message="Erreur technique momentanée" type="column" />]
  }

  if (formationQuery.status === "loading") {
    return [<ResultListsLoading isJobSearchLoading={jobQuery.status === "loading"} isTrainingSearchLoading />]
  }

  const [firstFormation] = formationQuery.formations
  const jobsCount = result.displayedJobs.length

  const onRenderLbaItem = (item: ILbaItem) => {
    if (item?.ideaType === LBA_ITEM_TYPE_OLD.FORMATION) return
    const jobId = getObjectId(item)
    if (jobId) {
      addSearchView(jobId)
    }
  }

  return [
    <Box id="search-content-container" key={0} sx={{ maxWidth: "xl", margin: "auto" }}>
      {formationQuery.errorMessage && <ErrorMessage message={formationQuery.errorMessage} />}
      {jobQuery.errorMessage && <ErrorMessage message={jobQuery.errorMessage} />}

      {formationQuery.status === "success" && formationQuery.formations.length === 0 && (
        <Box
          sx={{
            mx: 6,
            textAlign: "center",
            my: 2,
            fontWeight: 700,
          }}
        >
          Aucune formation en alternance disponible pour ce métier
        </Box>
      )}
      {formationQuery.status === "success" && firstFormation && props.rechercheParams.geo !== null && props.rechercheParams.radius < firstFormation.place?.distance && (
        <Box
          sx={{
            fontWeight: 700,
            textAlign: "center",
            mx: 4,
            my: 2,
          }}
        >
          Aucune formation ne correspondait à votre zone de recherche, nous avons trouvé les plus proches
        </Box>
      )}
    </Box>,
    ...items.map((data, index) => ({
      height: heightEstimation(data.type),
      render: () => <ResultCardWithContainer key={index} rechercheParams={props.rechercheParams} data={data} displayMap={displayMap} />,
      onRender: data.type === "lba_item" ? () => onRenderLbaItem(data.value) : undefined,
      item: data,
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
    <Footer key="global-footer" />,
  ]
}

function ResultCardWithContainer({ data, rechercheParams, displayMap }: { data: ResultCardData; rechercheParams: IRecherchePageParams; displayMap: boolean }) {
  return (
    <Box
      sx={{
        my: fr.spacing("1w"),
        px: { md: displayMap ? fr.spacing("1w") : 0, lg: fr.spacing("2w") },
      }}
    >
      <ResultCard data={data} rechercheParams={rechercheParams} />
    </Box>
  )
}

function ResultCard({ data, rechercheParams }: { data: ResultCardData; rechercheParams: IRecherchePageParams }) {
  const { type } = data
  switch (type) {
    case "whisper": {
      return <Whisper whisper={data.value} />
    }
    case "lba_item": {
      const item = data.value
      return <LbaItemCard active={isItemReferenceInList(item, rechercheParams.activeItems ?? [])} item={item} rechercheParams={rechercheParams} />
    }
    case "ValorisationCandidatureSpontanee": {
      return <ValorisationCandidatureSpontanee />
    }
    default: {
      assertUnreachable(type)
    }
  }
}

function heightEstimation(type: ResultCardData["type"]): number {
  switch (type) {
    case "whisper": {
      return 112
    }
    case "lba_item": {
      return 270
    }
    case "ValorisationCandidatureSpontanee": {
      return 270
    }
    default: {
      assertUnreachable(type)
    }
  }
}
