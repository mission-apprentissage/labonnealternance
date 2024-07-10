import { assertUnreachable } from "@/../shared"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import fetchFtJobDetails from "@/services/fetchFtJobDetails"
import fetchLbaCompanyDetails from "@/services/fetchLbaCompanyDetails"
import fetchLbaJobDetails from "@/services/fetchLbaJobDetails"
import { fetchTrainingDetails } from "@/services/fetchTrainingDetails"
import pushHistory from "@/utils/pushHistory"

import {
  flyToMarker,
  layerType,
  setSelectedMarker,
  setTrainingMarkers,
  computeMissingPositionAndDistance,
  factorTrainingsForMap,
  setJobMarkers,
  factorPartnerJobsForMap,
  factorInternalJobsForMap,
} from "../../../utils/mapTools"
import { logError } from "../../../utils/tools"

import { storeSearchResultInContext } from "./handleSearchHistoryContext"
import { searchForJobsFunction, searchForPartnerJobsFunction } from "./searchForJobs"
import { notFoundErrorText, partialJobSearchErrorText, trainingErrorText } from "./utils"

export const loadItem = async ({
  item,
  setIsFormVisible,
  setCurrentPage,
  setTrainingSearchError,
  setIsTrainingSearchLoading,
  setIsJobSearchLoading,
  setIsPartnerJobSearchLoading,
  setJobSearchError,
  setPartnerJobSearchError,
  searchResultContext,
  router,
  scopeContext,
  displayMap,
}) => {
  try {
    const { setHasSearch, setTrainings, setSelectedItem, setJobs } = searchResultContext

    setHasSearch(true)
    setIsFormVisible(false)

    let itemMarker = null

    const searchTimestamp = new Date().getTime()

    let loadedItem = null

    if (item.type === "training") {
      loadedItem = await fetchTrainingDetails({ id: item.itemId })

      setTrainings([loadedItem])
      storeSearchResultInContext({ searchResultContext, results: { trainings: [loadedItem] }, searchTimestamp })
      setTrainingMarkers({ trainingList: factorTrainingsForMap([loadedItem]) })
      setSelectedItem(loadedItem)
      setSelectedMarker(loadedItem)
      itemMarker = loadedItem

      // lancement d'une recherche d'emploi autour de la formation chargée
      const values = {
        job: {
          romes: itemMarker.romes.map((rome) => rome.code),
        },
        location: {
          value: {
            coordinates: [itemMarker.place.longitude, itemMarker.place.latitude],
          },
          type: "Point",
        },
        radius: 30,
        diploma: "",
      }

      searchForJobsFunction({
        values,
        searchTimestamp,
        setIsJobSearchLoading,
        scopeContext: {
          isTraining: true,
          isJob: true,
        },
        setJobSearchError,
        searchResultContext,
      })

      searchForPartnerJobsFunction({
        values,
        searchTimestamp,
        setIsPartnerJobSearchLoading,
        scopeContext: {
          isTraining: true,
          isJob: true,
        },
        setPartnerJobSearchError,
        computeMissingPositionAndDistance,
        searchResultContext,
      })
    } else {
      const results = {
        peJobs: null,
        lbaCompanies: null,
        matchas: null,
      }

      try {
        switch (item.type) {
          case LBA_ITEM_TYPE_OLD.PEJOB: {
            const ftJob = await fetchFtJobDetails({ id: item.itemId })
            const ftJobs = await computeMissingPositionAndDistance(null, [ftJob])
            results.peJobs = ftJobs
            loadedItem = ftJobs[0]
            break
          }
          case LBA_ITEM_TYPE_OLD.MATCHA: {
            const lbaJob = await fetchLbaJobDetails({ id: item.itemId })
            const lbaJobs = await computeMissingPositionAndDistance(null, [lbaJob])
            results.matchas = lbaJobs
            loadedItem = lbaJobs[0]
            break
          }
          case LBA_ITEM_TYPE_OLD.LBA: {
            const lbaCompany = await fetchLbaCompanyDetails({ id: item.itemId })
            results.lbaCompanies = [lbaCompany]
            loadedItem = lbaCompany
            break
          }
          default: {
            assertUnreachable("should not happen" as never)
          }
        }

        setJobs(results)

        setHasSearch(true)

        if (item.type === LBA_ITEM_TYPE_OLD.PEJOB) {
          setJobMarkers({ jobList: factorPartnerJobsForMap(results), type: layerType.PARTNER, hasTrainings: false })
        } else {
          setJobMarkers({ jobList: factorInternalJobsForMap(results), type: layerType.INTERNAL, hasTrainings: false })
        }

        setSelectedItem(loadedItem)
        setSelectedMarker(loadedItem)
        storeSearchResultInContext({ searchResultContext, results: { jobs: results }, searchTimestamp })
        itemMarker = loadedItem
      } catch (directElementLoadError) {
        setJobSearchError(directElementLoadError.isNotFoundError() ? notFoundErrorText : partialJobSearchErrorText)
      }
    }

    if (itemMarker) {
      flyToMarker(itemMarker, 12)
    }
    setCurrentPage("fiche")

    pushHistory({
      router,
      scopeContext,
      item: loadedItem,
      page: "fiche",
      display: "list",
      searchParameters: null,
      searchTimestamp,
      isReplace: true,
      displayMap,
    })
  } catch (err) {
    console.error(`Erreur interne lors du chargement d'un élément (${err.response ? err.response.status : ""} : ${err?.response?.data ? err.response.data.error : ""})`)
    logError("Training search error", err)
    setTrainingSearchError(trainingErrorText)
  }

  setIsTrainingSearchLoading(false)
  setIsJobSearchLoading(false)
  setIsPartnerJobSearchLoading(false)
  return
}
