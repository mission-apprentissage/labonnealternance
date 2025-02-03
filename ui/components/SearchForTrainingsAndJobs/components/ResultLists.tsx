import { Box, Flex } from "@chakra-ui/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useContext, useEffect, useRef } from "react"
import { assertUnreachable, ILbaItemFormation, ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { ErrorMessage, Job, RecruteurLba, Training } from "../.."
import { DisplayContext } from "../../../context/DisplayContextProvider"
import { ScopeContext } from "../../../context/ScopeContext"
import { SearchResultContext } from "../../../context/SearchResultContextProvider"
import { isCfaEntreprise } from "../../../services/cfaEntreprise"
import { mergeJobs, mergeOpportunities } from "../../../utils/itemListUtils"
import { allJobSearchErrorText, getJobCount } from "../services/utils"

import ExtendedSearchButton from "./ExtendedSearchButton"
import NoJobResult from "./NoJobResult"
import RechercheCDICDD from "./rechercheCDDCDI"
import ResultFilterAndCounter from "./ResultFilterAndCounter"
import ResultListsLoading from "./ResultListsLoading"

const ListFooter = ({ handleExtendedSearch, isJobSearchLoading, isPartnerJobSearchLoading }) => {
  const scopeContext = useContext(ScopeContext)
  const { activeFilters, formValues } = useContext(DisplayContext)
  const { extendedSearch, hasSearch, jobs, trainings } = useContext(SearchResultContext)

  if (hasSearch) {
    const trainingCount = scopeContext.isTraining && activeFilters.includes("trainings") ? trainings.length : 0

    let jobCount = 0

    if (!isJobSearchLoading && !isPartnerJobSearchLoading && (activeFilters.includes("jobs") || activeFilters.includes("duo"))) {
      jobCount = getJobCount(jobs)
    }

    const isJobElement = scopeContext.isJob && !isJobSearchLoading && !isPartnerJobSearchLoading && (activeFilters.includes("jobs") || activeFilters.includes("duo"))
    const shouldShowFTJobs = isJobElement && jobCount < 100 // scope offre, moins de 100 offres
    const shouldShowExtendSearchButton = isJobElement && jobCount < 100 && !extendedSearch && formValues?.location?.value // scope offre, moins de 100 offres pas déjà étendu, pas recherche france entière
    const shouldShowNoJob = isJobElement && jobCount === 0 // scope offre, pas d'offre
    const shouldShowListEndText = !shouldShowFTJobs && !shouldShowExtendSearchButton && !shouldShowNoJob && jobCount + trainingCount > 0 // des offres ou des formations et pas les autres messages

    return (
      <Box m={6}>
        {shouldShowListEndText && (
          <Box py={4} textAlign="center" color="grey.425" fontWeight={14} fontStyle="italic">
            Vous êtes arrivé.e au bout de la liste.
            <br />
            Pour voir d'autres possibilités, revenez plus tard ou changez vos critères de recherche
          </Box>
        )}
        {shouldShowNoJob && <NoJobResult />}
        {shouldShowExtendSearchButton && (
          <ExtendedSearchButton title={jobCount ? "Peu de résultats dans votre zone de recherche" : ""} handleExtendedSearch={handleExtendedSearch} />
        )}
        {shouldShowFTJobs && <RechercheCDICDD />}
      </Box>
    )
  }
  return <></>
}

const ItemElement = ({ virtualRow, consolidatedItemList, handleSelectItem, searchForTrainingsOnNewCenter, searchForJobsOnNewCenter, columnVirtualizer }) => {
  const item = consolidatedItemList[virtualRow.index]
  let itemElement = null
  switch (item.ideaType) {
    case LBA_ITEM_TYPE_OLD.LBA:
      itemElement = <RecruteurLba key={virtualRow.key} company={item} handleSelectItem={handleSelectItem} searchForTrainingsOnNewCenter={searchForTrainingsOnNewCenter} />
      break
    case LBA_ITEM_TYPE_OLD.MATCHA:
    case LBA_ITEM_TYPE_OLD.PEJOB:
    case LBA_ITEM_TYPE_OLD.PARTNER_JOB:
      itemElement = <Job key={virtualRow.key} job={item} handleSelectItem={handleSelectItem} searchForTrainingsOnNewCenter={searchForTrainingsOnNewCenter} />
      break
    case LBA_ITEM_TYPE_OLD.FORMATION: {
      const isCfa = isCfaEntreprise(item?.company?.siret, item?.company?.headquarter?.siret)
      itemElement = <Training key={virtualRow.key} training={item} handleSelectItem={handleSelectItem} isCfa={isCfa} searchForJobsOnNewCenter={searchForJobsOnNewCenter} />
      break
    }
    default:
      assertUnreachable("should not happen" as never)
  }

  return (
    <Box key={virtualRow.key} data-index={virtualRow.index} ref={columnVirtualizer.measureElement}>
      {itemElement}
    </Box>
  )
}

const ResultLists = ({
  handleExtendedSearch,
  handleSelectItem,
  isJobSearchLoading,
  isTrainingSearchLoading,
  jobSearchError,
  searchForJobsOnNewCenter,
  searchRadius,
  searchForTrainingsOnNewCenter,
  shouldShowWelcomeMessage,
  showSearchForm,
  trainingSearchError,
}) => {
  const scopeContext = useContext(ScopeContext)

  let [extendedSearch, hasSearch, isFormVisible] = [false, false, false]

  ;({ isFormVisible } = useContext(DisplayContext))
  ;({ extendedSearch, hasSearch } = useContext(SearchResultContext))

  const { jobs, trainings, itemToScrollTo, setItemToScrollTo } = useContext(SearchResultContext)
  const { activeFilters } = useContext(DisplayContext)

  const parentRef = useRef(null)

  const shouldDisplayTrainings = hasSearch && scopeContext.isTraining && activeFilters.includes("trainings")
  const hasTrainings = shouldDisplayTrainings && trainings.length > 0

  const consolidatedItemList: (ILbaItemPartnerJob | ILbaItemLbaJob | ILbaItemLbaCompany | ILbaItemFtJob | ILbaItemFormation)[] = []

  if (hasTrainings) {
    consolidatedItemList.push(...trainings)
  }

  if (hasSearch && (!isJobSearchLoading || !isPartnerJobSearchLoading) && (activeFilters.includes("jobs") || activeFilters.includes("duo"))) {
    if (!activeFilters.includes("jobs")) {
      consolidatedItemList.push(...jobs.matchas.filter((job) => job.company?.mandataire))
    } else if (extendedSearch) {
      consolidatedItemList.push(...mergeOpportunities({ jobs, activeFilters }))
    } else {
      consolidatedItemList.push(...mergeJobs({ jobs, activeFilters }))
      consolidatedItemList.push(...mergeOpportunities({ jobs, activeFilters, onlyLbbLbaCompanies: "onlyLbbLba" }))
    }
  }

  const columnVirtualizer = useVirtualizer({
    count: consolidatedItemList.length + 1,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220,
    overscan: 5,
  })

  // @ts-ignore
  window.currentConsolidatedItemList = consolidatedItemList

  useEffect(() => {
    if (itemToScrollTo) {
      // sollicité après fermeture de la fiche
      const itemIndex = consolidatedItemList.findIndex((item) => item.id === itemToScrollTo.id)
      if (itemIndex >= 0) {
        columnVirtualizer.scrollToIndex(itemIndex)
        setItemToScrollTo(null)
      }
    }
  })

  useEffect(() => {
    // events déclenchés manuellement lors des sélections sur la carte
    const scrollToItem = (e) => {
      let itemIndex = 0
      if (e.detail.type === "job") {
        // recherche premier élément de type job
        // @ts-ignore
        itemIndex = window.currentConsolidatedItemList.findIndex((item) => [LBA_ITEM_TYPE_OLD.LBA, LBA_ITEM_TYPE_OLD.PARTNER_JOB].includes(item.ideaType))
      } else {
        // @ts-ignore
        itemIndex = window.currentConsolidatedItemList.findIndex((item) => item.id === e.detail.itemId)
      }

      if (itemIndex >= 0) {
        columnVirtualizer.scrollToIndex(itemIndex)
      }
    }

    const resultList = document.getElementById("resultList")
    resultList.addEventListener("scrollToItem", scrollToItem)

    return () => {
      resultList.removeEventListener("scrollToItem", scrollToItem)
    }
  }, [])

  const virtualItems = columnVirtualizer.getVirtualItems()

  return (
    <Flex direction="column" height={"100%"} display={isFormVisible ? ["none", "none", "flex"] : "flex"}>
      <Box bg="beige" display={shouldShowWelcomeMessage ? "none" : ""}>
        <Box display={["flex", "flex", "none"]}>
          <ResultFilterAndCounter
            jobSearchError={jobSearchError}
            trainingSearchError={trainingSearchError}
            isJobSearchLoading={isJobSearchLoading}
            isTrainingSearchLoading={isTrainingSearchLoading}
            showSearchForm={showSearchForm}
          />
        </Box>
        <Box margin="auto" maxWidth="1310px">
          <ResultListsLoading
            jobSearchError={jobSearchError}
            trainingSearchError={trainingSearchError}
            isJobSearchLoading={isJobSearchLoading}
            isTrainingSearchLoading={isTrainingSearchLoading}
          />
          {trainingSearchError && jobSearchError && partnerJobSearchError ? (
            <ErrorMessage message="Erreur technique momentanée" type="column" />
          ) : (
            <>
              {trainingSearchError && <ErrorMessage message={trainingSearchError} />}
              {jobSearchError && partnerJobSearchError && <ErrorMessage message={allJobSearchErrorText} />}
              {((jobSearchError && !partnerJobSearchError) || (!jobSearchError && partnerJobSearchError)) && <ErrorMessage message={jobSearchError || partnerJobSearchError} />}
            </>
          )}

          {!isTrainingSearchLoading && shouldDisplayTrainings && trainings?.length === 0 && (
            <Box mx={6} textAlign="center" my={2} fontWeight={700}>
              Aucune formation en alternance disponible pour ce métier
            </Box>
          )}
          {shouldDisplayTrainings && trainings?.length && searchRadius < trainings[0].place.distance && (
            <Box fontWeight={700} textAlign="center" mx={4} my={2}>
              Aucune formation ne correspondait à votre zone de recherche, nous avons trouvé les plus proches
            </Box>
          )}

          {
            // blocs de textes d'infos / erreur
            !isTrainingSearchLoading && shouldDisplayTrainings && !(trainings instanceof Array) && <ErrorMessage message="Problème momentané d'accès aux offres de formation" />
          }
        </Box>
      </Box>
      <Box
        flex="1"
        pb={["100px", "100px", 0]}
        pr={{ xl: "25px", "2xl": "50px" }}
        width="100%"
        height="100vh"
        overflow="hidden"
        id="resultList"
        display={shouldShowWelcomeMessage ? "none" : ""}
        bg="beige"
      >
        <Box
          style={{
            height: "100%",
            overflow: "auto",
          }}
          width="100%"
          margin="auto"
          maxWidth="1310px"
          pb={10}
          ref={parentRef}
        >
          {virtualItems.length && (
            <Box
              sx={{
                height: `${columnVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              <Box bg="beige">
                {virtualItems.map((virtualRow) => {
                  const lastRow = virtualRow.index === consolidatedItemList.length
                  return (
                    <>
                      {!lastRow ? (
                        <Box
                          key={virtualRow.key}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start + (virtualRow.index - columnVirtualizer.range.startIndex) * 8}px)`,
                          }}
                        >
                          <ItemElement
                            virtualRow={virtualRow}
                            consolidatedItemList={consolidatedItemList}
                            handleSelectItem={handleSelectItem}
                            searchForTrainingsOnNewCenter={searchForTrainingsOnNewCenter}
                            searchForJobsOnNewCenter={searchForJobsOnNewCenter}
                            columnVirtualizer={columnVirtualizer}
                          />
                        </Box>
                      ) : (
                        <Box
                          key={virtualRow.key}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: `130px`,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <ListFooter handleExtendedSearch={handleExtendedSearch} isJobSearchLoading={isJobSearchLoading} isPartnerJobSearchLoading={isPartnerJobSearchLoading} />
                        </Box>
                      )}
                    </>
                  )
                })}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Flex>
  )
}

export default ResultLists
