import React, { useContext, useState } from "react"

import { ErrorMessage } from "../../../components"
import DisplayMapButton from "../../../components/DisplayMapButton/displayMapButton"
import { DisplayContext } from "../../../context/DisplayContextProvider"
import { ScopeContext } from "../../../context/ScopeContext"
import { SearchResultContext } from "../../../context/SearchResultContextProvider"
import purpleFilterIcon from "../../../public/images/icons/purpleFilter.svg"
import { isCfaEntreprise } from "../../../services/cfaEntreprise"
import { mergeJobs, mergeOpportunities } from "../../../utils/itemListUtils"
import { filterLayers } from "../../../utils/mapTools"
import ExtendedSearchButton from "./ExtendedSearchButton"
import NoJobResult from "./NoJobResult"
import ResultListsCounter from "./ResultListsCounter"

import { Box, Button, Flex, Image } from "@chakra-ui/react"
import { SendPlausibleEvent } from "../../../utils/plausible"
import { renderJob, renderLbb, renderTraining } from "../services/renderOneResult"
import { getJobCount } from "../services/utils"

const ResultLists = ({
  activeFilter,
  handleExtendedSearch,
  handleSelectItem,
  isJobSearchLoading,
  isTrainingSearchLoading,
  jobs,
  jobSearchError,
  searchForJobsOnNewCenter,
  searchRadius,
  selectedItem,
  searchForTrainingsOnNewCenter,
  setActiveFilter,
  shouldShowWelcomeMessage,
  showSearchForm,
  trainings,
  allJobSearchError,
  trainingSearchError,
  isTestMode,
  stubbedExtendedSearch,
  stubbedHasSearch,
  stubbedIsFormVisible,
}) => {
  const scopeContext = useContext(ScopeContext)

  let [extendedSearch, hasSearch, isFormVisible] = [false, false, false]

  ;({ isFormVisible } = useContext(DisplayContext))
  ;({ extendedSearch, hasSearch } = useContext(SearchResultContext))

  if (isTestMode) {
    ;[extendedSearch, hasSearch, isFormVisible] = [stubbedExtendedSearch, stubbedHasSearch, stubbedIsFormVisible]
  }

  const filterButtonClicked = (filterButton) => {
    setActiveFilter(filterButton)
    filterLayers(filterButton)
    if (filterButton === "duo") {
      SendPlausibleEvent("Clic onglet formations+emplois - Liste de résultats")
    }
  }

  const getTrainingResult = () => {
    if (hasSearch && scopeContext.isTraining && (activeFilter === "all" || activeFilter === "trainings")) {
      return (
        <Box bg="beige" id="trainingResult">
          {getTrainingList()}
        </Box>
      )
    } else {
      return ""
    }
  }

  const getTrainingList = () => {
    if (trainings.length) {
      return (
        <>
          {searchRadius < trainings[0].place.distance && (
            <Box fontWeight={700} ml={4} px={4} py={4}>
              Aucune formation ne correspondait à votre zone de recherche, nous avons trouvé les plus proches
            </Box>
          )}
          {trainings.map((training, idx) => {
            const isCfa = isCfaEntreprise(training?.company?.siret, training?.company?.headquarter?.siret)

            return renderTraining(isTestMode, idx, training, handleSelectItem, searchForJobsOnNewCenter, isCfa)
          })}
        </>
      )
    } else if (!isTrainingSearchLoading) {
      if (trainings.length === 0) {
        return (
          <Box mx={6} my={4} fontWeight={700}>
            Aucune formation en alternance disponible pour ce métier
          </Box>
        )
      } else return <ErrorMessage message="Problème momentané d'accès aux offres de formation" />
    }
  }

  const getJobResult = () => {
    if (hasSearch && !isJobSearchLoading && ["all", "duo", "jobs"].includes(activeFilter)) {
      if (allJobSearchError) return ""

      const jobCount = getJobCount(jobs)

      if (jobCount) {
        if (activeFilter === "duo") {
          return (
            <Box bg="beige" id="jobList">
              {getPartnerJobList()}
            </Box>
          )
        } else if (extendedSearch) {
          const mergedJobList = getMergedJobList()
          return (
            <Box bg="beige" id="jobList">
              {mergedJobList ? <>{mergedJobList}</> : ""}
            </Box>
          )
        } else {
          const jobList = getJobList()
          const lbbCompanyList = getLbbCompanyList()
          return (
            <Box bg="beige" id="jobList" textAlign="center">
              {jobList || lbbCompanyList ? (
                <>
                  {jobList}
                  {lbbCompanyList}
                  {jobCount < 100 ? <ExtendedSearchButton title="Voir plus de résultats" handleExtendedSearch={handleExtendedSearch} /> : ""}
                </>
              ) : (
                <Box m={6}>
                  <NoJobResult />
                  <ExtendedSearchButton title="Étendre la sélection" handleExtendedSearch={handleExtendedSearch} />
                </Box>
              )}
            </Box>
          )
        }
      } else {
        if (extendedSearch) {
          return <NoJobResult />
        } else
          return (
            <Box m={6}>
              <NoJobResult />
              <ExtendedSearchButton title="Étendre la sélection" handleExtendedSearch={handleExtendedSearch} />
            </Box>
          )
      }
    } else {
      return ""
    }
  }

  const getPartnerJobList = () => {
    const partnerJobs = jobs.matchas.filter((job) => job.company?.mandataire)
    if (partnerJobs.length) {
      return (
        <>
          {partnerJobs.map((job, idx) => {
            return renderJob(isTestMode, idx, job, handleSelectItem, searchForTrainingsOnNewCenter)
          })}
        </>
      )
    } else {
      return ""
    }
  }

  const getJobList = () => {
    const mergedJobs = mergeJobs({ jobs, activeFilter })
    if (mergedJobs.length) {
      return (
        <>
          {mergedJobs.map((job, idx) => {
            return renderJob(isTestMode, idx, job, handleSelectItem, searchForTrainingsOnNewCenter)
          })}
        </>
      )
    } else return ""
  }

  const getLbbCompanyList = () => {
    const mergedLbaLbbCompanies = mergeOpportunities({ jobs, activeFilter, onlyLbbLbaCompanies: "onlyLbbLba" })
    if (mergedLbaLbbCompanies.length) {
      return (
        <>
          {mergedLbaLbbCompanies.map((company, idx) => {
            return renderLbb(isTestMode, idx, company, handleSelectItem, searchForTrainingsOnNewCenter)
          })}
        </>
      )
    } else return ""
  }

  // retourne le bloc construit des items lbb, lba, matcha et pe triés par ordre de distance
  const getMergedJobList = () => {
    const mergedOpportunities = mergeOpportunities({ jobs, activeFilter })

    if (mergedOpportunities.length) {
      return (
        <>
          {mergedOpportunities.map((opportunity, idx) => {
            if (opportunity.ideaType === "peJob" || opportunity.ideaType === "matcha") {
              return renderJob(isTestMode, idx, opportunity, handleSelectItem, searchForTrainingsOnNewCenter)
            } else {
              return renderLbb(isTestMode, idx, opportunity, handleSelectItem, searchForTrainingsOnNewCenter)
            }
          })}
        </>
      )
    } else {
      return ""
    }
  }

  // construit le bloc formaté avec les erreurs remontées
  const getErrorMessages = () => {
    return trainingSearchError && allJobSearchError ? (
      <ErrorMessage message="Erreur technique momentanée" type="column" />
    ) : (
      <>
        {trainingSearchError && <ErrorMessage message={trainingSearchError} />}
        {jobSearchError && <ErrorMessage message={jobSearchError} />}
      </>
    )
  }

  const [displayCount, setDisplayCount] = useState(true)
  const handleScroll = () => {
    setDisplayCount(document.querySelector("#resultList").scrollTop < 30)
  }

  return (
    <Flex direction="column" height={selectedItem ? "0%" : "100%"} display={isFormVisible ? "none" : "flex"}>
      <Box bg="beige" display={shouldShowWelcomeMessage || selectedItem ? "none" : ""}>
        <Flex flex="1 auto" my={[2, 2, 0]} alignItems="center">
          <Button
            background="none"
            border="none"
            title="Accéder aux filtrage des résultats"
            display={["flex", "flex", "none"]}
            mt="-10px"
            ml="auto"
            mr="30px"
            pt="15px"
            onClick={showSearchForm}
          >
            <Image width="24px" height="24px" src={purpleFilterIcon} alt="" />
          </Button>
        </Flex>
        <DisplayMapButton jobs={jobs} trainings={trainings} />
        <ResultListsCounter
          scopeContext={scopeContext}
          filterButtonClicked={filterButtonClicked}
          allJobSearchError={allJobSearchError}
          trainingSearchError={trainingSearchError}
          isJobSearchLoading={isJobSearchLoading}
          isTrainingSearchLoading={isTrainingSearchLoading}
          displayCount={displayCount}
          jobs={jobs}
          trainings={trainings}
          activeFilter={activeFilter}
        />
        {getErrorMessages()}
      </Box>
      <Box flex="1" pb={["100px", "100px", 0]} overflow="auto" onScroll={handleScroll} id="resultList" display={shouldShowWelcomeMessage || selectedItem ? "none" : ""} bg="beige">
        {getTrainingResult()}
        {getJobResult()}
      </Box>
    </Flex>
  )
}

export default ResultLists
