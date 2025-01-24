import { Box, Flex } from "@chakra-ui/react"
import { useContext, useState } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { ErrorMessage } from "../.."
import { DisplayContext } from "../../../context/DisplayContextProvider"
import { ScopeContext } from "../../../context/ScopeContext"
import { SearchResultContext } from "../../../context/SearchResultContextProvider"
import { isCfaEntreprise } from "../../../services/cfaEntreprise"
import { mergeJobs, mergeOpportunities } from "../../../utils/itemListUtils"
import { renderJob, renderLbb, renderTraining } from "../services/renderOneResult"
import { allJobSearchErrorText, getJobCount } from "../services/utils"

import ExtendedSearchButton from "./ExtendedSearchButton"
import NoJobResult from "./NoJobResult"
import RechercheCDICDD from "./rechercheCDDCDI"
import ResultFilterAndCounter from "./ResultFilterAndCounter"
import ResultListsLoading from "./ResultListsLoading"

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
  const { formValues } = useContext(DisplayContext)

  let [extendedSearch, hasSearch, isFormVisible] = [false, false, false]

  ;({ isFormVisible } = useContext(DisplayContext))
  ;({ extendedSearch, hasSearch } = useContext(SearchResultContext))

  const { jobs, trainings } = useContext(SearchResultContext)
  const { activeFilters } = useContext(DisplayContext)

  const getTrainingResult = () => {
    console.log("ici")
    if (hasSearch && scopeContext.isTraining && activeFilters.includes("trainings")) {
      return (
        <Box bg="beige" id="trainingResult">
          {getTrainingList()}
        </Box>
      )
    } else {
      return <></>
    }
  }

  const getListEndText = () => {
    return (
      <Box mt={4} textAlign="center" color="grey.425" fontWeight={14} fontStyle="italic">
        Vous êtes arrivé.e au bout de la liste.
        <br />
        Pour voir d'autres possibilités, revenez plus tard ou changez vos critères de recherche
      </Box>
    )
  }

  const getTrainingList = () => {
    if (trainings.length) {
      return (
        <>
          {searchRadius < trainings[0].place.distance && (
            <Box fontWeight={700} textAlign="center" ml={4} px={4} py={4}>
              Aucune formation ne correspondait à votre zone de recherche, nous avons trouvé les plus proches
            </Box>
          )}
          {trainings.map((training, idx) => {
            const isCfa = isCfaEntreprise(training?.company?.siret, training?.company?.headquarter?.siret)

            return renderTraining(idx, training, handleSelectItem, searchForJobsOnNewCenter, isCfa)
          })}
        </>
      )
    } else if (!isTrainingSearchLoading) {
      if (trainings.length === 0) {
        return (
          <Box mx={6} textAlign="center" my={4} fontWeight={700}>
            Aucune formation en alternance disponible pour ce métier
          </Box>
        )
      } else return <ErrorMessage message="Problème momentané d'accès aux offres de formation" />
    }
  }

  const getJobResult = () => {
    if (hasSearch && !isJobSearchLoading && (activeFilters.includes("jobs") || activeFilters.includes("duo"))) {
      const jobCount = getJobCount(jobs)

      if (jobCount) {
        let consolidatedJobList = <></>

        if (!activeFilters.includes("jobs")) {
          consolidatedJobList = getMandataireJobList()
        } else if (extendedSearch) {
          consolidatedJobList = getMergedJobList()
        } else {
          const lbaJobList = getJobList()
          const lbbCompanyList = getLbbCompanyList()

          if (lbaJobList || lbbCompanyList) {
            consolidatedJobList = (
              <>
                {lbaJobList}
                {lbbCompanyList}
              </>
            )
          }
        }

        return (
          <Box bg="beige" id="jobList">
            {consolidatedJobList}
          </Box>
        )
      }
    }

    return <></>
  }

  const getListFooter = () => {
    if (hasSearch) {
      const trainingCount = scopeContext.isTraining && activeFilters.includes("trainings") ? trainings.length : 0

      let jobCount = 0

      if (!isJobSearchLoading && (activeFilters.includes("jobs") || activeFilters.includes("duo"))) {
        jobCount = getJobCount(jobs)
      }

      const isJobElement = scopeContext.isJob && !isJobSearchLoading && (activeFilters.includes("jobs") || activeFilters.includes("duo"))
      const shouldShowFTJobs = isJobElement && jobCount < 100 // scope offre, moins de 100 offres
      const shouldShowExtendSearchButton = isJobElement && jobCount < 100 && !extendedSearch && formValues?.location?.value // scope offre, moins de 100 offres pas déjà étendu, pas recherche france entière
      const shouldShowNoJob = isJobElement && jobCount === 0 // scope offre, pas d'offre
      const shouldShowListEndText = !shouldShowFTJobs && !shouldShowExtendSearchButton && !shouldShowNoJob && jobCount + trainingCount > 0 // des offres ou des formations et pas les autres messages

      return (
        <Box m={6}>
          {shouldShowListEndText && getListEndText()}
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

  const getMandataireJobList = () => {
    const mandataireLbaJobs = jobs.matchas.filter((job) => job.company?.mandataire)
    if (mandataireLbaJobs.length) {
      return (
        <>
          {mandataireLbaJobs.map((job, idx) => {
            return renderJob(idx, job, handleSelectItem, searchForTrainingsOnNewCenter)
          })}
        </>
      )
    } else {
      return <></>
    }
  }

  const getJobList = () => {
    const mergedJobs = mergeJobs({ jobs, activeFilters })
    if (mergedJobs.length) {
      return (
        <>
          {mergedJobs.map((job, idx) => {
            return renderJob(idx, job, handleSelectItem, searchForTrainingsOnNewCenter)
          })}
        </>
      )
    } else return ""
  }

  const getLbbCompanyList = () => {
    const mergedLbaLbbCompanies = mergeOpportunities({ jobs, activeFilters, onlyLbbLbaCompanies: "onlyLbbLba" })
    if (mergedLbaLbbCompanies.length) {
      return (
        <>
          {mergedLbaLbbCompanies.map((company, idx) => {
            return renderLbb(idx, company, handleSelectItem, searchForTrainingsOnNewCenter)
          })}
        </>
      )
    } else return ""
  }

  // retourne le bloc construit des items lbb, lba, matcha et pe triés par ordre de distance
  const getMergedJobList = () => {
    const mergedOpportunities = mergeOpportunities({ jobs, activeFilters })

    if (mergedOpportunities.length) {
      return (
        <>
          {mergedOpportunities.map((opportunity, idx) => {
            if ([LBA_ITEM_TYPE_OLD.MATCHA, LBA_ITEM_TYPE_OLD.PEJOB, LBA_ITEM_TYPE_OLD.PARTNER_JOB].includes(opportunity.ideaType)) {
              return renderJob(idx, opportunity, handleSelectItem, searchForTrainingsOnNewCenter)
            } else {
              return renderLbb(idx, opportunity, handleSelectItem, searchForTrainingsOnNewCenter)
            }
          })}
        </>
      )
    } else {
      return <></>
    }
  }

  // construit le bloc formaté avec les erreurs remontées
  const getErrorMessages = () => {
    return trainingSearchError && jobSearchError ? (
      <ErrorMessage message="Erreur technique momentanée" type="column" />
    ) : (
      <>
        {trainingSearchError && <ErrorMessage message={trainingSearchError} />}
        {jobSearchError && <ErrorMessage message={allJobSearchErrorText} />}
      </>
    )
  }

  const [, setDisplayCount] = useState(true)
  const handleScroll = () => {
    setDisplayCount(document.querySelector("#resultList").scrollTop < 30)
  }

  return (
    <Flex direction="column" height={"100%"} display={isFormVisible ? "none" : "flex"}>
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
          {getErrorMessages()}
        </Box>
      </Box>
      <Box
        flex="1"
        pb={["100px", "100px", 0]}
        pr={{ xl: "25px", "2xl": "50px" }}
        width="100%"
        overflow="auto"
        onScroll={handleScroll}
        id="resultList"
        display={shouldShowWelcomeMessage ? "none" : ""}
        bg="beige"
      >
        <Box margin="auto" maxWidth="1310px" pb={10}>
          {getTrainingResult()}
          {getJobResult()}
          {getListFooter()}
        </Box>
      </Box>
    </Flex>
  )
}

export default ResultLists
