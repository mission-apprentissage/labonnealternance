import React, { useEffect, useContext } from "react"
import { useRouter } from "next/router"
import { ScopeContext } from "../../../context/ScopeContext"
import { SearchResultContext } from "../../../context/SearchResultContextProvider"
import { DisplayContext } from "../../../context/DisplayContextProvider"
import { filterLayers } from "../../../utils/mapTools"
import distance from "@turf/distance"
import { scrollToTop, scrollToElementInContainer, getItemElement } from "../../../utils/tools"
import ItemDetail from "../../../components/ItemDetail/ItemDetail"
import LoadingScreen from "../../../components/LoadingScreen"
import SearchForm from "./SearchForm"
import ResultLists from "./ResultLists"
import { setCurrentPage, setCurrentSearch, currentSearch } from "../../../utils/currentPage.js"
import pushHistory from "../../../utils/pushHistory"
import dosearchImage from "../../../public/images/dosearch.svg"
import whispers from "../services/whispers.js"

import { flyToMarker, flyToLocation, closeMapPopups, setSelectedMarker } from "../../../utils/mapTools"
import { Box, Image, Text } from "@chakra-ui/react"

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
  isFormVisible,
  jobSearchError,
  allJobSearchError,
  isLoading,
  activeFilter,
  setActiveFilter,
}) => {
  const router = useRouter()
  const scopeContext = useContext(ScopeContext)
  const { trainings, jobs, setTrainings, setJobs, setSelectedItem, selectedItem, itemToScrollTo, setItemToScrollTo, setExtendedSearch } = useContext(SearchResultContext)
  const { formValues, setFormValues } = useContext(DisplayContext)

  useEffect(() => {
    if (itemToScrollTo) {
      const itemElement = getItemElement(itemToScrollTo)

      if (itemElement) {
        scrollToElementInContainer("resultList", itemElement, 150, "auto")
        setItemToScrollTo(null)
      }
    }
  })

  useEffect(() => {
    whispers.insertWhisper(document, isTrainingSearchLoading || isJobSearchLoading)
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
    })
    unSelectItem("doNotSaveToHistory")
  }

  const showAllResults = () => {
    setActiveFilter("all")
    filterLayers("all")
  }

  const searchForJobsOnNewCenter = async (newCenter) => {
    searchOnNewCenter(newCenter, null, "jobs")
    showAllResults()
  }

  const searchForTrainingsOnNewCenter = async (newCenter) => {
    searchOnNewCenter(newCenter, "trainings", null)
    showAllResults()
  }

  const searchForJobsWithLooseRadius = async () => {
    setExtendedSearch(true)
    scrollToTop("choiceColumn")

    setJobs([])
    const searchTimestamp = new Date().getTime()
    pushHistory({
      router,
      scopeContext,
      display: "list",
      searchParameters: formValues,
      searchTimestamp,
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
      trainings[i].place.distance = Math.round(10 * distance(coordinates, [trainings[i].place.longitude, trainings[i].place.latitude])) / 10
    }
    setTrainings(trainings)
  }

  const getResultLists = () => {
    return (
      <ResultLists
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        selectedItem={selectedItem}
        handleSelectItem={handleSelectItem}
        showSearchForm={showSearchForm}
        isTrainingSearchLoading={isTrainingSearchLoading}
        isJobSearchLoading={isJobSearchLoading}
        searchRadius={searchRadius}
        trainings={trainings}
        handleExtendedSearch={searchForJobsWithLooseRadius}
        searchForJobsOnNewCenter={searchForJobsOnNewCenter}
        searchForTrainingsOnNewCenter={searchForTrainingsOnNewCenter}
        jobs={jobs}
        jobSearchError={jobSearchError}
        allJobSearchError={allJobSearchError}
        trainingSearchError={trainingSearchError}
        shouldShowWelcomeMessage={shouldShowWelcomeMessage}
      />
    )
  }

  const getSearchForm = () => {
    return (
      <Box background="white" padding="0.5rem 1rem 2rem" display={isFormVisible ? ["block", "block", "none"] : "none"}>
        <SearchForm showResultList={showResultList} handleSearchSubmit={handleSearchSubmitFunction} />
      </Box>
    )
  }

  const getInitialDesktopText = () => {
    const displayProperty = shouldShowWelcomeMessage ? ["none", "none", "block"] : "none"

    const noSearchTextProperties = {
      margin: "auto",
      width: "80%",
      minWidth: "250px",
      maxWidth: "600px",
      background: "white",
      boxShadow: "0px 0px 12px 2px rgba(0, 0, 0, 0.21)",
      borderRadius: "8px",
      textAlign: "center",
    }

    return (
      <Box display={displayProperty} width="75%" margin="auto" pt={12}>
        <Image margin="auto" width="75%" src={dosearchImage} alt="" />
        <Box pl={12} pr={8} py={4} {...noSearchTextProperties}>
          <Box textAlign="left">
            <Text fontSize="1.7rem" mb={2} fontWeight={700}>
              Faites une recherche
            </Text>
            <Text>Renseignez les champs de recherche ci-dessus pour trouver la formation et l&apos;entreprise pour réaliser votre projet d&apos;alternance</Text>
          </Box>
        </Box>
      </Box>
    )
  }

  const getSelectedItemDetail = () => {
    return <ItemDetail selectedItem={selectedItem} handleClose={handleClose} handleSelectItem={handleSelectItem} activeFilter={activeFilter} />
  }

  const columnBackgroundProperty = shouldShowWelcomeMessage ? ["white", "white", "beige"] : "grey.100"

  return (
    <Box id="choiceColumn" width="75%" background={columnBackgroundProperty} className="choiceCol">
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
