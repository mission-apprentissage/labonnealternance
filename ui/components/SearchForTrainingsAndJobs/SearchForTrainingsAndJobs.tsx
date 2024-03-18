import { Box, Flex } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useContext, useEffect, useState } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { ParameterContext } from "../../context/ParameterContextProvider"
import { ScopeContext } from "../../context/ScopeContext"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import { updateUiFromHistory } from "../../services/updateUiFromHistory"
import { currentPage, currentSearch, setCurrentPage, setCurrentSearch } from "../../utils/currentPage"
import {
  closeMapPopups,
  computeMissingPositionAndDistance,
  coordinatesOfFrance,
  factorJobsForMap,
  factorTrainingsForMap,
  flyToLocation,
  flyToMarker,
  isMapInitialized,
  refreshLocationMarkers,
  resizeMap,
  setJobMarkers,
  setSelectedMarker,
  setTrainingMarkers,
} from "../../utils/mapTools"
import pushHistory from "../../utils/pushHistory"
import { logError } from "../../utils/tools"
import Map from "../Map"
import { InitWidgetSearchParameters, WidgetHeader } from "../WidgetHeader"

import { ChoiceColumn, MapListSwitchButton } from "./components"
import { loadItem } from "./services/loadItem"
import { searchForJobsFunction } from "./services/searchForJobs"
import { searchForTrainingsFunction } from "./services/searchForTrainings"

const SearchForTrainingsAndJobs = () => {
  const scopeContext = useContext(ScopeContext)

  const { hasSearch, trainings, jobs, setTrainings, setJobs, selectedItem, setSelectedItem, setItemToScrollTo, setExtendedSearch, setHasSearch } = useContext(SearchResultContext)

  const { displayMap, opcoFilter, opcoUrlFilter, widgetParameters, shouldExecuteSearch, setDisplayMap, setShouldExecuteSearch, showCombinedJob } = useContext(ParameterContext)

  const { activeFilters, setActiveFilters, formValues, setFormValues, visiblePane, setVisiblePane, isFormVisible, setIsFormVisible, setShouldMapBeVisible } =
    useContext(DisplayContext)

  const [searchRadius, setSearchRadius] = useState(30)
  const [isTrainingSearchLoading, setIsTrainingSearchLoading] = useState(hasSearch ? false : true)
  const [shouldShowWelcomeMessage, setShouldShowWelcomeMessage] = useState(hasSearch ? false : true)

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
        setActiveFilters,
        activeFilters,
      })
    }

    router.events.on("routeChangeStart", handleRouteChange)

    // If the component is unmounted, unsubscribe
    // from the event with the `off` method:
    return () => {
      router.events.off("routeChangeStart", handleRouteChange)
    }
    /* eslint react-hooks/exhaustive-deps: 0 */
  }, [trainings, jobs])

  useEffect(() => {
    if (shouldExecuteSearch) {
      // provient du submit formulaire de la homepage
      setShouldExecuteSearch(false)
      executeSearch(formValues)
    }
    /* eslint react-hooks/exhaustive-deps: 0 */
  }, [])

  const executeSearch = (values) => {
    setIsLoading(true)
    try {
      handleSearchSubmit({ values })
      setIsLoading(false)
    } catch (err) {
      setIsLoading(false)
      logError("Search error", err)
    }
  }

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
      pushHistory({
        router,
        scopeContext,
        item: { id: itemId, ideaType: type === "training" ? LBA_ITEM_TYPE_OLD.FORMATION : type, directId: true },
        page: "fiche",
        display: "list",
        searchParameters: formValues,
        searchTimestamp,
        isReplace: true,
        displayMap,
      })
    }
  }

  const findItem = ({ itemId, type, jobs, trainings }) => {
    switch (type) {
      case "training": {
        return trainings?.find((el) => el.id === itemId)
      }
      case LBA_ITEM_TYPE_OLD.PEJOB: {
        return jobs?.peJobs?.find((el) => el.job.id === itemId)
      }
      case LBA_ITEM_TYPE_OLD.LBA: {
        return jobs?.lbaCompanies?.find((el) => el.company.siret === itemId)
      }
      case LBA_ITEM_TYPE_OLD.MATCHA: {
        return jobs?.matchas?.find((el) => el.job.id === itemId)
      }
      default:
        return
    }
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
    pushHistory({ router, scopeContext, display: "list", searchParameters: values, searchTimestamp, displayMap })
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
      widgetParameters,
      setJobs,
      setJobMarkers,
      factorJobsForMap,
      scopeContext,
      followUpItem,
      selectFollowUpItem,
      opcoFilter,
      opcoUrlFilter,
      showCombinedJob,
    })
  }

  const clearTrainings = () => {
    if (trainings?.length) {
      setTrainings([])
      setTrainingMarkers({ trainingList: null })
      closeMapPopups()
    }
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
        displayMap,
      })
    }
  }

  const showResultMap = (e, doNotSaveToHistory) => {
    if (e) {
      e.stopPropagation()
    }

    if (!displayMap) {
      setDisplayMap(true)
      refreshLocationMarkers({ jobs, trainings, scopeContext })
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
        displayMap: true,
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
        displayMap,
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
      displayMap,
    })
  }

  const unSelectItem = (doNotSaveToHistory) => {
    setSelectedItem(null)
    setSelectedMarker(null)
    if (selectedItem) {
      setItemToScrollTo(selectedItem)
    }

    if (!doNotSaveToHistory) {
      pushHistory({ router, scopeContext, searchParameters: formValues, searchTimestamp: currentSearch, displayMap })
    }
  }

  const listDisplayParameters = visiblePane === "resultList" ? "flex" : ["none", "none", "flex"]
  const mapDisplayParameters = visiblePane === "resultMap" ? "block" : ["none", "none", "block"]

  return (
    <Flex direction="column" sx={{ height: "100vh" }}>
      <InitWidgetSearchParameters handleSearchSubmit={handleSearchSubmit} handleItemLoad={handleItemLoad} setIsLoading={setIsLoading} />
      <WidgetHeader
        handleSearchSubmit={handleSearchSubmit}
        allJobSearchError={allJobSearchError}
        trainingSearchError={trainingSearchError}
        isTrainingSearchLoading={isTrainingSearchLoading}
        isJobSearchLoading={isJobSearchLoading}
      />
      <Flex direction="row" overflow="hidden" height="100%">
        <Box flex={{ base: 8, xl: 6 }} display={listDisplayParameters} height="100%" flexDirection="column">
          <ChoiceColumn
            shouldShowWelcomeMessage={shouldShowWelcomeMessage}
            handleSearchSubmit={handleSearchSubmit}
            showResultList={showResultList}
            showSearchForm={showSearchForm}
            unSelectItem={unSelectItem}
            searchRadius={searchRadius}
            isTrainingSearchLoading={isTrainingSearchLoading}
            isFormVisible={isFormVisible}
            searchForTrainings={searchForTrainings}
            trainingSearchError={trainingSearchError}
            searchForJobs={searchForJobs}
            isJobSearchLoading={isJobSearchLoading}
            jobSearchError={jobSearchError}
            allJobSearchError={allJobSearchError}
            isLoading={isLoading}
          />
        </Box>
        {displayMap ? (
          <Box p="0" flex={{ base: 4, xl: 5 }} display={mapDisplayParameters} position="relative">
            <Map handleSearchSubmit={handleSearchSubmit} showSearchForm={showSearchForm} selectItemOnMap={selectItemOnMap} />
          </Box>
        ) : (
          ""
        )}
      </Flex>
      <MapListSwitchButton showResultMap={showResultMap} showResultList={showResultList} isFormVisible={isFormVisible} />
    </Flex>
  )
}

export default SearchForTrainingsAndJobs
