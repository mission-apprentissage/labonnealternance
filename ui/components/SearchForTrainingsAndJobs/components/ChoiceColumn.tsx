import { Box, Flex, Image, Text } from "@chakra-ui/react"
import distance from "@turf/distance"
import { round } from "lodash"
import { useRouter } from "next/router"
import React, { useContext, useEffect } from "react"

import { DisplayContext } from "../../../context/DisplayContextProvider"
import { ParameterContext } from "../../../context/ParameterContextProvider"
import { ScopeContext } from "../../../context/ScopeContext"
import { SearchResultContext } from "../../../context/SearchResultContextProvider"
import { currentSearch, setCurrentPage, setCurrentSearch } from "../../../utils/currentPage"
import { closeMapPopups, filterLayers, flyToLocation, flyToMarker, setSelectedMarker } from "../../../utils/mapTools"
import pushHistory from "../../../utils/pushHistory"
import { getItemElement, scrollToElementInContainer, scrollToTop } from "../../../utils/tools"
import ItemDetail from "../../ItemDetail/ItemDetail"
import LoadingScreen from "../../LoadingScreen"
import { defaultFilters } from "../services/utils"
import { insertWhisper } from "../services/whispers"

import ResultLists from "./ResultLists"
import SearchFormResponsive from "./SearchFormResponsive"

const ChoiceColumn = ({
  showResultList,
  unSelectItem,
  showSearchForm,
  handleSearchSubmit,
  shouldShowWelcomeMessage,
  searchRadius,
  isTrainingSearchLoading,
  searchForTrainings,
  trainingSearchError,
  searchForJobs,
  isJobSearchLoading,
  isPartnerJobSearchLoading,
  isFormVisible,
  jobSearchError,
  partnerJobSearchError,
  isLoading,
}) => {
  const router = useRouter()
  const scopeContext = useContext(ScopeContext)
  const { trainings, setTrainings, setJobs, setSelectedItem, selectedItem, itemToScrollTo, setItemToScrollTo, setExtendedSearch } = useContext(SearchResultContext)
  const { formValues, setFormValues, setActiveFilters } = useContext(DisplayContext)
  const { displayMap } = useContext(ParameterContext)

  useEffect(() => {
    if (itemToScrollTo) {
      const itemElement = getItemElement(itemToScrollTo)

      if (itemElement) {
        scrollToElementInContainer({ containerId: "resultList", el: itemElement })
        setItemToScrollTo(null)
      }
    }
  })

  useEffect(() => {
    insertWhisper(document, isTrainingSearchLoading || isJobSearchLoading || isPartnerJobSearchLoading)
  })

  const handleSearchSubmitFunction = (values) => {
    return handleSearchSubmit({ values })
  }

  const handleSelectItem = (item) => {
    flyToMarker(item, 12)
    closeMapPopups()
    setSelectedItem(item)
    setSelectedMarker(item)

    setCurrentPage("fiche")

    pushHistory({
      router,
      scopeContext,
      item,
      page: "fiche",
      display: "list",
      searchParameters: formValues,
      searchTimestamp: currentSearch,
      displayMap,
    })
  }

  const handleClose = () => {
    setCurrentPage("")
    pushHistory({
      router,
      scopeContext,
      display: "list",
      searchParameters: formValues,
      searchTimestamp: currentSearch,
      displayMap,
    })
    unSelectItem("doNotSaveToHistory")
  }

  const showAllResults = () => {
    setActiveFilters(defaultFilters)
    filterLayers(defaultFilters)
  }

  const searchForJobsOnNewCenter = async (newCenter) => {
    searchOnNewCenter(newCenter, null, "jobs")
    showAllResults()
    setTimeout(() => {
      scrollToElementInContainer({ containerId: "resultList", el: document.getElementById("jobList") })
    }, 800)
  }

  const searchForTrainingsOnNewCenter = async (newCenter) => {
    searchOnNewCenter(newCenter, "trainings", null)
    showAllResults()
  }

  const searchForJobsWithLooseRadius = async () => {
    setExtendedSearch(true)
    scrollToTop("choiceColumn")

    setJobs({ peJobs: [], lbaCompanies: [], matchas: [] })
    const searchTimestamp = new Date().getTime()
    pushHistory({
      router,
      scopeContext,
      display: "list",
      searchParameters: formValues,
      searchTimestamp,
      displayMap,
    })
    setCurrentSearch(searchTimestamp)
    searchForJobs({ values: { ...formValues, radius: 20000 }, searchTimestamp })
  }

  const searchOnNewCenter = async (newCenter, isTrainingSearch, isJobSearch) => {
    setExtendedSearch(false)

    scrollToTop("choiceColumn")

    formValues.location = newCenter

    setFormValues(formValues)

    // mise à jour des infos de distance des formations par rapport au nouveau centre de recherche
    if (isJobSearch) {
      updateTrainingDistanceWithNewCenter(formValues.location.value.coordinates)
    }

    flyToLocation({ center: formValues.location.value.coordinates, zoom: 10 })

    const searchTimestamp = new Date().getTime()

    pushHistory({
      router,
      scopeContext,
      display: "list",
      searchParameters: formValues,
      searchTimestamp,
      displayMap,
    })
    setCurrentSearch(searchTimestamp)

    searchForJobs({ values: formValues, searchTimestamp })

    if (isTrainingSearch) {
      searchForTrainings({ values: formValues, searchTimestamp })
    }
  }

  const updateTrainingDistanceWithNewCenter = (coordinates) => {
    for (let i = 0; i < trainings.length; ++i) {
      //const trainingCoords = [trainings[i].place.longitude, trainings[i].place.latitude];
      trainings[i].place.distance = round(distance(coordinates, [trainings[i].place.longitude, trainings[i].place.latitude]), 2)
    }
    setTrainings(trainings)
  }

  const getResultLists = () => {
    return (
      <ResultLists
        selectedItem={selectedItem}
        handleSelectItem={handleSelectItem}
        showSearchForm={showSearchForm}
        isTrainingSearchLoading={isTrainingSearchLoading}
        isJobSearchLoading={isJobSearchLoading}
        isPartnerJobSearchLoading={isPartnerJobSearchLoading}
        searchRadius={searchRadius}
        handleExtendedSearch={searchForJobsWithLooseRadius}
        searchForJobsOnNewCenter={searchForJobsOnNewCenter}
        searchForTrainingsOnNewCenter={searchForTrainingsOnNewCenter}
        jobSearchError={jobSearchError}
        partnerJobSearchError={partnerJobSearchError}
        trainingSearchError={trainingSearchError}
        shouldShowWelcomeMessage={shouldShowWelcomeMessage}
      />
    )
  }

  const getSearchForm = () => {
    return (
      <Box background="white" padding="0.5rem 1rem 2rem" display={isFormVisible ? ["block", "block", "none"] : "none"}>
        <SearchFormResponsive showResultList={showResultList} handleSearchSubmit={handleSearchSubmitFunction} />
      </Box>
    )
  }

  const getInitialDesktopText = () => {
    const displayProperty = shouldShowWelcomeMessage ? ["none", "none", "block"] : "none"

    return (
      <Box display={displayProperty} width={{ base: "75%", lg: "60%", xl: "50%" }} margin="auto" pt={12}>
        <Flex>
          <Image src="/images/dosearch.svg" alt="" aria-hidden="true" />
          <Box pl={12} pt={12}>
            <Box textAlign="left">
              <Text as="h1" fontSize={32} mb={2} fontWeight={700}>
                Trouvez votre{" "}
                <Text as="span" color="#6A6AF4">
                  alternance
                </Text>
              </Text>
              <Text fontWeight={20} lineHeight="32px">
                Démarrez une recherche pour trouver votre
                <br />
                {scopeContext.isJob && scopeContext.isTraining ? "formation ou votre emploi" : scopeContext.isJob ? "emploi" : "formation"} en alternance
              </Text>
            </Box>
          </Box>
        </Flex>
      </Box>
    )
  }

  const getSelectedItemDetail = () => {
    return <ItemDetail selectedItem={selectedItem} handleClose={handleClose} handleSelectItem={handleSelectItem} />
  }

  const columnBackgroundProperty = shouldShowWelcomeMessage ? ["white", "white", "beige"] : "grey.100"

  return (
    <Box id="choiceColumn" flex="1" overflow="auto" background={columnBackgroundProperty} className="choiceCol">
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {getInitialDesktopText()}
          {getSearchForm()}
          {getResultLists()}
          {getSelectedItemDetail()}
        </>
      )}
    </Box>
  )
}

export default ChoiceColumn
