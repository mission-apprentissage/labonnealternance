import { Box, Flex } from "@chakra-ui/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useContext, useRef } from "react"
import { ILbaItemFormation, ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"
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

const ResultLists = ({
  handleExtendedSearch,
  handleSelectItem,
  isJobSearchLoading,
  isPartnerJobSearchLoading,
  isTrainingSearchLoading,
  jobSearchError,
  searchForJobsOnNewCenter,
  searchRadius,
  selectedItem,
  searchForTrainingsOnNewCenter,
  shouldShowWelcomeMessage,
  showSearchForm,
  partnerJobSearchError,
  trainingSearchError,
}) => {
  const scopeContext = useContext(ScopeContext)

  let [extendedSearch, hasSearch, isFormVisible] = [false, false, false]

  ;({ isFormVisible } = useContext(DisplayContext))
  ;({ extendedSearch, hasSearch } = useContext(SearchResultContext))

  const { jobs, trainings } = useContext(SearchResultContext)
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
    horizontal: true,
    count: consolidatedItemList.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220,
    overscan: 5,
  })

  return (
    <Flex direction="column" height={selectedItem ? "0%" : "100%"} display={isFormVisible ? "none" : "flex"}>
      <Box bg="beige" display={shouldShowWelcomeMessage || selectedItem ? "none" : ""}>
        <Box display={["flex", "flex", "none"]}>
          <ResultFilterAndCounter
            jobSearchError={jobSearchError}
            partnerJobSearchError={partnerJobSearchError}
            trainingSearchError={trainingSearchError}
            isJobSearchLoading={isJobSearchLoading}
            isPartnerJobSearchLoading={isPartnerJobSearchLoading}
            isTrainingSearchLoading={isTrainingSearchLoading}
            showSearchForm={showSearchForm}
          />
        </Box>
        <Box margin="auto" maxWidth="1310px">
          <ResultListsLoading
            jobSearchError={jobSearchError}
            partnerJobSearchError={partnerJobSearchError}
            trainingSearchError={trainingSearchError}
            isJobSearchLoading={isJobSearchLoading}
            isPartnerJobSearchLoading={isPartnerJobSearchLoading}
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
        overflow="auto"
        id="resultList"
        display={shouldShowWelcomeMessage || selectedItem ? "none" : ""}
        bg="beige"
        ref={parentRef}
      >
        <Box
          style={{
            height: `${columnVirtualizer.getTotalSize()}px`,
          }}
          margin="auto"
          maxWidth="1310px"
          pb={10}
        >
          {!isTrainingSearchLoading && shouldDisplayTrainings && trainings?.length === 0 && (
            <Box mx={6} textAlign="center" my={4} fontWeight={700}>
              Aucune formation en alternance disponible pour ce métier
            </Box>
          )}
          {shouldDisplayTrainings && trainings?.length && searchRadius < trainings[0].place.distance && (
            <Box fontWeight={700} textAlign="center" ml={4} px={4} py={4}>
              Aucune formation ne correspondait à votre zone de recherche, nous avons trouvé les plus proches
            </Box>
          )}

          {hasSearch && consolidatedItemList.length && (
            <Box bg="beige" id="trainingResult">
              {consolidatedItemList.map((item, idx) => {
                switch (item.ideaType) {
                  case LBA_ITEM_TYPE_OLD.LBA:
                    return <RecruteurLba key={idx} company={item} handleSelectItem={handleSelectItem} searchForTrainingsOnNewCenter={searchForTrainingsOnNewCenter} />
                  case LBA_ITEM_TYPE_OLD.MATCHA:
                  case LBA_ITEM_TYPE_OLD.PEJOB:
                  case LBA_ITEM_TYPE_OLD.PARTNER_JOB:
                    return <Job key={idx} job={item} handleSelectItem={handleSelectItem} searchForTrainingsOnNewCenter={searchForTrainingsOnNewCenter} />
                  case LBA_ITEM_TYPE_OLD.FORMATION: {
                    const isCfa = isCfaEntreprise(item?.company?.siret, item?.company?.headquarter?.siret)
                    return <Training key={idx} training={item} handleSelectItem={handleSelectItem} isCfa={isCfa} searchForJobsOnNewCenter={searchForJobsOnNewCenter} />
                  }
                  default:
                    return <></>
                }
              })}
            </Box>
          )}

          {/*getJobResult()*/}
          <ListFooter handleExtendedSearch={handleExtendedSearch} isJobSearchLoading={isJobSearchLoading} isPartnerJobSearchLoading={isPartnerJobSearchLoading} />
        </Box>
      </Box>
    </Flex>
  )
}

export default ResultLists
