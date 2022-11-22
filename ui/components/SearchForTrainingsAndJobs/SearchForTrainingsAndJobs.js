import React, { useState, useEffect, useContext } from "react"

import { useRouter } from "next/router"

import { loadItem } from "components/SearchForTrainingsAndJobs/services/loadItem"
import { searchForTrainingsFunction } from "components/SearchForTrainingsAndJobs/services/searchForTrainings"
import { searchForJobsFunction } from "components/SearchForTrainingsAndJobs/services/searchForJobs"
import pushHistory from "utils/pushHistory"

import {
  flyToMarker,
  flyToLocation,
  closeMapPopups,
  factorTrainingsForMap,
  factorJobsForMap,
  computeMissingPositionAndDistance,
  setJobMarkers,
  setTrainingMarkers,
  setSelectedMarker,
  resizeMap,
  isMapInitialized,
  coordinatesOfFrance,
} from "utils/mapTools"

import { ScopeContext } from "context/ScopeContext"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import { ParameterContext } from "../../context/ParameterContextProvider"
import { DisplayContext } from "../../context/DisplayContextProvider"

import Map from "components/Map"
import { MapListSwitchButton, ChoiceColumn } from "./components"
import { WidgetHeader, InitWidgetSearchParameters } from "components/WidgetHeader"
import { currentPage, setCurrentPage, currentSearch, setCurrentSearch } from "utils/currentPage"
import updateUiFromHistory from "services/updateUiFromHistory"
import { Box, Flex } from "@chakra-ui/react"

const SearchForTrainingsAndJobs = () => {
  const scopeContext = useContext(ScopeContext)

  const { hasSearch, trainings, jobs, setTrainings, setJobs, selectedItem, setSelectedItem, setItemToScrollTo, setExtendedSearch, setHasSearch } = useContext(SearchResultContext)

  const { opcoFilter, widgetParameters, useMock } = useContext(ParameterContext)

  const { formValues, setFormValues, visiblePane, setVisiblePane, isFormVisible, setIsFormVisible, setShouldMapBeVisible } = useContext(DisplayContext)

  const [searchRadius, setSearchRadius] = useState(30)
  const [isTrainingSearchLoading, setIsTrainingSearchLoading] = useState(hasSearch ? false : true)
  const [shouldShowWelcomeMessage, setShouldShowWelcomeMessage] = useState(hasSearch ? false : true)
  const [activeFilter, setActiveFilter] = useState("all")

  const [isJobSearchLoading, setIsJobSearchLoading] = useState(hasSearch ? false : true)
  const [jobSearchError, setJobSearchError] = useState("")
  const [allJobSearchError, setAllJobSearchError] = useState(false)
  const [trainingSearchError, setTrainingSearchError] = useState("")
  const [isLoading, setIsLoading] = useState(hasSearch ? false : true)

  const router = useRouter()

  useEffect(() => {
    const handleRouteChange = (url) => {
      updateUiFromHistory({
        url,
        currentPage,
        trainings,
        jobs,
        selectedItem,
        unSelectItem,
        selectItemFromHistory,
        setCurrentPage,
        visiblePane,
        isFormVisible,
        showResultMap,
        showResultList,
        showSearchForm,
        setTrainings,
        setJobs,
        setActiveFilter,
        activeFilter,
      })
    }

    router.events.on("routeChangeStart", handleRouteChange)

    // If the component is unmounted, unsubscribe
    // from the event with the `off` method:
    return () => {
      router.events.off("routeChangeStart", handleRouteChange)
    }
  }, [trainings, jobs])

  const selectItemFromHistory = (itemId, type) => {
    const item = findItem({ itemId, type, jobs, trainings })
    selectItem(item)
  }

  const selectItem = (item) => {
    closeMapPopups()
    if (item) {
      flyToMarker(item, 12)
      setSelectedItem(item)
      setSelectedMarker(item)
    }
  }

  const selectFollowUpItem = ({ itemId, type, jobs, trainings, searchTimestamp, formValues }) => {
    const item = findItem({ itemId, type, jobs, trainings })

    if (item) {
      selectItem(item)
      try {
        pushHistory({
          router,
          scopeContext,
          item: { id: itemId, ideaType: type === "training" ? "formation" : type, directId: true },
          page: "fiche",
          display: "list",
          searchParameters: formValues,
          searchTimestamp,
          isReplace: true,
        })
      } catch (err) {}
    }
  }

  const findItem = ({ itemId, type, jobs, trainings }) => {
    let item

    if (type === "training") {
      item = trainings.find((el) => el.id === itemId)
    } else if (type === "peJob") {
      item = jobs.peJobs.find((el) => el.job.id === itemId)
    } else if (type === "lba") {
      item = jobs.lbaCompanies.find((el) => el.company.siret === itemId)
    } else if (type === "lbb") {
      item = jobs.lbbCompanies.find((el) => el.company.siret === itemId)
    } else if (type === "matcha") {
      item = jobs.matchas.find((el) => el.job.id === itemId)
    }

    return item
  }

  const flyToCenter = (values) => {
    const searchCenter = values?.location?.value ? [values.location.value.coordinates[0], values.location.value.coordinates[1]] : null

    if (searchCenter) {
      flyToLocation({ center: searchCenter, zoom: 10 })
    } else {
      flyToLocation({ center: coordinatesOfFrance, zoom: 4 })
    }
  }

  const handleSearchSubmit = async ({ values, followUpItem = null }) => {
    // centrage de la carte sur le lieu de recherche
    const searchTimestamp = new Date().getTime()
    setShouldShowWelcomeMessage(false)

    setHasSearch(false)
    setSearchRadius(values.radius || 30)
    setExtendedSearch(false)

    flyToCenter(values)

    setFormValues({ ...values })

    if (scopeContext.isTraining) {
      searchForTrainings({ values, searchTimestamp, followUpItem, selectFollowUpItem })
    }

    if (scopeContext.isJob) {
      searchForJobs({ values, searchTimestamp, followUpItem, selectFollowUpItem })
    }
    setIsFormVisible(false)

    pushHistory({ router, scopeContext, display: "list", searchParameters: values, searchTimestamp })
    setCurrentSearch(searchTimestamp)
  }

  const handleItemLoad = async (item) => {
    setShouldShowWelcomeMessage(false)

    setHasSearch(false)
    setExtendedSearch(true)

    loadItem({
      item,
      setTrainings,
      setHasSearch,
      setIsFormVisible,
      setTrainingMarkers,
      setSelectedItem,
      setCurrentPage,
      setTrainingSearchError,
      factorTrainingsForMap,
      setIsTrainingSearchLoading,
      setIsJobSearchLoading,
      computeMissingPositionAndDistance,
      setJobSearchError,
      setJobs,
      setJobMarkers,
      factorJobsForMap,
      useMock,
    })

    setIsFormVisible(false)
  }

  const searchForTrainings = async ({ values, searchTimestamp, followUpItem, selectFollowUpItem }) => {
    searchForTrainingsFunction({
      values,
      searchTimestamp,
      setIsTrainingSearchLoading,
      setTrainingSearchError,
      clearTrainings,
      setTrainings,
      setHasSearch,
      setIsFormVisible,
      setTrainingMarkers,
      factorTrainingsForMap,
      widgetParameters,
      followUpItem,
      selectFollowUpItem,
      useMock,
    })
  }

  const searchForJobs = async ({ values, searchTimestamp, followUpItem, selectFollowUpItem }) => {
    searchForJobsFunction({
      values,
      searchTimestamp,
      setIsJobSearchLoading,
      setHasSearch,
      setJobSearchError,
      setAllJobSearchError,
      computeMissingPositionAndDistance,
      setJobs,
      setJobMarkers,
      factorJobsForMap,
      scopeContext,
      widgetParameters,
      followUpItem,
      selectFollowUpItem,
      opcoFilter,
      useMock,
    })
  }

  const clearTrainings = () => {
    setTrainings([])
    setTrainingMarkers(null)
    closeMapPopups()
  }

  const showSearchForm = (e, doNotSaveToHistory) => {
    if (e) {
      e.stopPropagation()
    }
    setVisiblePane("resultList") // affichage de la colonne resultList / searchForm
    setIsFormVisible(true)

    if (!doNotSaveToHistory) {
      unSelectItem("doNotSaveToHistory")
      pushHistory({
        router,
        scopeContext,
        display: "form",
        searchParameters: formValues,
        searchTimestamp: currentSearch,
      })
    }
  }

  const showResultMap = (e, doNotSaveToHistory) => {
    if (e) {
      e.stopPropagation()
    }

    if (!isMapInitialized) {
      setShouldMapBeVisible(true)
    }
    setVisiblePane("resultMap")

    if (!doNotSaveToHistory) {
      pushHistory({
        router,
        scopeContext,
        display: "map",
        searchParameters: formValues,
        searchTimestamp: currentSearch,
      })
    }

    // hack : force le redimensionnement de la carte qui peut n'occuper qu'une fraction de l'écran en mode mobile
    setTimeout(() => {
      resizeMap()
      if (selectedItem) {
        flyToMarker(selectedItem)
      } else {
        flyToCenter(formValues)
      }
    }, 50)
  }

  const showResultList = (e, doNotSaveToHistory) => {
    if (e) {
      e.stopPropagation()
    }
    setVisiblePane("resultList")
    setIsFormVisible(false)

    if (!doNotSaveToHistory) {
      pushHistory({
        router,
        scopeContext,
        display: "list",
        searchParameters: formValues,
        searchTimestamp: currentSearch,
      })
    }
  }

  const selectItemOnMap = (item) => {
    showResultList(null, "doNotSaveToHistory")
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

  const unSelectItem = (doNotSaveToHistory) => {
    setSelectedItem(null)
    setSelectedMarker(null)
    if (selectedItem) {
      setItemToScrollTo(selectedItem)
    }

    if (!doNotSaveToHistory) {
      pushHistory({ router, scopeContext, searchParameters: formValues, searchTimestamp: currentSearch })
    }
  }

  let listDisplayParameters = visiblePane === "resultList" ? "flex" : ["none", "none", "flex"]
  let mapDisplayParameters = visiblePane === "resultMap" ? "block" : ["none", "none", "block"]

  return (
    <Flex direction="column" sx={{ height: "100vh" }} className="page demoPage">
      <InitWidgetSearchParameters handleSearchSubmit={handleSearchSubmit} handleItemLoad={handleItemLoad} setIsLoading={setIsLoading} />
      <WidgetHeader handleSearchSubmit={handleSearchSubmit} />
      <Flex direction="row" overflow="hidden" height="100%">
        <Box flex="5" display={listDisplayParameters} height="100%" overflow="hidden" direction="column">
          <ChoiceColumn
            shouldShowWelcomeMessage={shouldShowWelcomeMessage}
            handleSearchSubmit={handleSearchSubmit}
            showResultList={showResultList}
            showSearchForm={showSearchForm}
            unSelectItem={unSelectItem}
            searchRadius={searchRadius}
            isTrainingSearchLoading={isTrainingSearchLoading}
            searchForTrainings={searchForTrainings}
            trainingSearchError={trainingSearchError}
            searchForJobs={searchForJobs}
            isJobSearchLoading={isJobSearchLoading}
            jobSearchError={jobSearchError}
            allJobSearchError={allJobSearchError}
            isLoading={isLoading}
            setActiveFilter={setActiveFilter}
            activeFilter={activeFilter}
          />
        </Box>
        <Box p="0" flex="7" display={mapDisplayParameters}>
          <Map handleSearchSubmit={handleSearchSubmit} showSearchForm={showSearchForm} selectItemOnMap={selectItemOnMap} />
        </Box>
      </Flex>
      <MapListSwitchButton showSearchForm={showSearchForm} showResultMap={showResultMap} showResultList={showResultList} isFormVisible={isFormVisible} />
    </Flex>
  )
}

export default SearchForTrainingsAndJobs
