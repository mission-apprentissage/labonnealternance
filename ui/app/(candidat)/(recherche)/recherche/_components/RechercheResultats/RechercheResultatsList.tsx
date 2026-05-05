"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useMemo } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"
import { TYPE_EMPLOI_OPTIONS } from "shared/constants/recruteur"
import { assertUnreachable } from "shared/utils/assertUnreachable"
import { Footer } from "@/app/_components/Footer"
import { RechercheResultatsPlaceholder } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheResultatsPlaceholder"
import type { ILbaItem } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { useRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { useSearchViewNotifier } from "@/app/(candidat)/(recherche)/recherche/_hooks/useSearchViewNotifier"
import { useWhispers } from "@/app/(candidat)/(recherche)/recherche/_hooks/useWhispers"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { isItemReferenceInList } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { ErrorMessage } from "@/components"
import { ValorisationCandidatureSpontanee } from "@/components/ItemDetail/ValorisationCandidatureSpontanee"
import ResultListsLoading from "@/components/SearchForTrainingsAndJobs/components/ResultListsLoading"
import { getObjectId } from "@/utils/api"
import { LbaItemCard } from "./LbaItemCard"
import { RechercheResultatsFooter } from "./RechercheResultatsFooter"
import type { ResultCardData } from "./ResultCardData"
import { Whisper } from "./Whisper"

export function RechercheResultatsList(props: { rechercheParams: IRecherchePageParams; scrollToItem: (item: ResultCardData) => void }) {
  const result = useRechercheResults(props.rechercheParams)
  const whispers = useWhispers(props.rechercheParams)

  const shouldDisplayCandidatureSpontaneBoost = result.jobQuery.lbaJobs.length + result.jobQuery.partnerJobs.length >= 10

  const hasFormationError = result.formationQuery.status === "success" && result.formationQuery.formations.length === 0
  const hasExpandedRadius =
    result.formationQuery.status === "success" &&
    result.formationQuery.formations[0] &&
    props.rechercheParams.geo !== null &&
    props.rechercheParams.radius < result.formationQuery.formations[0].place?.distance
  const hasHeaderContent = !!result.formationQuery.errorMessage || !!result.jobQuery.errorMessage || hasFormationError || hasExpandedRadius

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

  const jobsCount = result.displayedJobs.length

  const onRenderLbaItem = (item: ILbaItem) => {
    if (item?.ideaType === LBA_ITEM_TYPE_OLD.FORMATION) return
    const jobId = getObjectId(item)
    if (jobId) {
      addSearchView(jobId)
    }
  }

  const onValorisationCandidatureSpontaneeClick = () => {
    const firstCandidatureSpontanee = items.find((item) => item.type === "lba_item" && item.value.ideaType === LBA_ITEM_TYPE_OLD.LBA)
    if (firstCandidatureSpontanee) {
      props.scrollToItem(firstCandidatureSpontanee)
    }
  }

  return [
    <Box id="search-content-container" tabIndex={-1} key={0} sx={{ maxWidth: "xl", margin: "auto", ...(hasHeaderContent && { mt: fr.spacing("5v") }) }}>
      {formationQuery.errorMessage && <ErrorMessage message={formationQuery.errorMessage} />}
      {jobQuery.errorMessage && <ErrorMessage message={jobQuery.errorMessage} />}

      {hasFormationError && (
        <Box
          sx={{
            mx: fr.spacing("12v"),
            textAlign: "center",
            my: fr.spacing("4v"),
            fontWeight: 700,
          }}
        >
          Aucune formation en alternance disponible pour ce métier
        </Box>
      )}
      {hasExpandedRadius && (
        <Box
          sx={{
            fontWeight: 700,
            textAlign: "center",
            mx: fr.spacing("8v"),
            my: fr.spacing("4v"),
          }}
        >
          Aucune formation ne correspondait à votre zone de recherche, nous avons trouvé les plus proches
        </Box>
      )}
    </Box>,
    ...(() => {
      let jobPosition = 0
      return items.map((data, index) => {
        const currentJobPosition = data.type === "lba_item" ? ++jobPosition : undefined
        return {
          height: heightEstimation(data.type),
          render: () => (
            <ResultCardWithContainer
              key={index}
              rechercheParams={props.rechercheParams}
              data={data}
              jobPosition={currentJobPosition}
              onValorisationCandidatureSpontaneeClick={onValorisationCandidatureSpontaneeClick}
            />
          ),
          onRender: data.type === "lba_item" ? () => onRenderLbaItem(data.value) : undefined,
          item: data,
        }
      })
    })(),
    <Box
      key="footer"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("6v"),
        my: fr.spacing("6v"),
        alignItems: "center",
        paddingX: fr.spacing("8v"),
      }}
    >
      <RechercheResultatsFooter jobStatus={jobQuery.status} searchParams={props.rechercheParams} jobCount={jobQuery.status === "loading" ? 0 : jobsCount} />
    </Box>,
    <Footer key="global-footer" />,
  ]
}

function ResultCardWithContainer({
  data,
  rechercheParams,
  jobPosition,
  onValorisationCandidatureSpontaneeClick,
}: {
  data: ResultCardData
  rechercheParams: IRecherchePageParams
  jobPosition?: number
  onValorisationCandidatureSpontaneeClick: () => void
}) {
  return (
    <Box
      sx={{
        maxWidth: "xl",
        margin: "auto",
        my: fr.spacing("2v"),
        px: { md: 0, lg: fr.spacing("4v") },
      }}
    >
      <ResultCard data={data} rechercheParams={rechercheParams} jobPosition={jobPosition} onValorisationCandidatureSpontaneeClick={onValorisationCandidatureSpontaneeClick} />
    </Box>
  )
}

function ResultCard({
  data,
  rechercheParams,
  jobPosition,
  onValorisationCandidatureSpontaneeClick,
}: {
  data: ResultCardData
  rechercheParams: IRecherchePageParams
  jobPosition?: number
  onValorisationCandidatureSpontaneeClick: () => void
}) {
  const { type } = data
  switch (type) {
    case "whisper": {
      return <Whisper whisper={data.value} />
    }
    case "lba_item": {
      const item = data.value
      return <LbaItemCard active={isItemReferenceInList(item, rechercheParams.activeItems ?? [])} item={item} rechercheParams={rechercheParams} position={jobPosition ?? 0} />
    }
    case "ValorisationCandidatureSpontanee": {
      return (
        <ValorisationCandidatureSpontanee
          onClick={onValorisationCandidatureSpontaneeClick}
          overridenQueryParams={{
            utm_source: "lba",
            utm_medium: "website",
            utm_campaign: "lba_recherche_promo-candidature-spontanee",
          }}
          disabled={rechercheParams.typesEmploi && rechercheParams.typesEmploi.length !== 0 && !rechercheParams.typesEmploi.includes(TYPE_EMPLOI_OPTIONS.candidatures_spontanees)}
        />
      )
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
