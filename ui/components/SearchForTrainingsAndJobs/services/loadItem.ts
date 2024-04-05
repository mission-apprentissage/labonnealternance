import { assertUnreachable } from "@/../shared"
import axios from "axios"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import fetchFtJobDetails from "@/services/fetchFtJobDetails"
import fetchLbaCompanyDetails from "@/services/fetchLbaCompanyDetails"
import fetchLbaJobDetails from "@/services/fetchLbaJobDetails"

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

import { storeTrainingsInSession } from "./handleSessionStorage"
import { searchForJobsFunction, searchForPartnerJobsFunction } from "./searchForJobs"
import { notFoundErrorText, partialJobSearchErrorText, trainingApi, trainingErrorText } from "./utils"

export const loadItem = async ({
  item,
  setTrainings,
  setHasSearch,
  setIsFormVisible,
  setSelectedItem,
  setCurrentPage,
  setTrainingSearchError,
  setIsTrainingSearchLoading,
  setIsJobSearchLoading,
  setIsPartnerJobSearchLoading,
  setJobSearchError,
  setPartnerJobSearchError,
  setJobs,
  setInternalJobs,
  setPartnerJobs,
}) => {
  try {
    setHasSearch(true)
    setIsFormVisible(false)

    let itemMarker = null

    if (item.type === "training") {
      const response = await axios.get(`${trainingApi}/${encodeURIComponent(item.itemId)}`)

      if (response.data.result === "error") {
        logError("Training Search Error", `${response.data.message}`)
        setTrainingSearchError(trainingErrorText)
      }

      const searchTimestamp = new Date().getTime()

      setTrainings(response.data.results)
      storeTrainingsInSession({ trainings: response.data.results, searchTimestamp })

      if (response.data.results.length) {
        setTrainingMarkers({ trainingList: factorTrainingsForMap(response.data.results) })
      }
      setSelectedItem(response.data.results[0])
      setSelectedMarker(response.data.results[0])
      itemMarker = response.data.results[0]

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
        setHasSearch,
        setJobSearchError,
        setInternalJobs,
      })
      searchForPartnerJobsFunction({
        values,
        searchTimestamp,
        setIsPartnerJobSearchLoading,
        scopeContext: {
          isTraining: true,
          isJob: true,
        },
        setHasSearch,
        setPartnerJobSearchError,
        computeMissingPositionAndDistance,
        setPartnerJobs,
      })
    } else {
      const results = {
        peJobs: null,
        lbaCompanies: null,
        matchas: null,
      }

      let loadedItem = null

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
            results.matchas = [lbaCompany]
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
        itemMarker = loadedItem
      } catch (directElementLoadError) {
        setJobSearchError(directElementLoadError.isNotFoundError() ? notFoundErrorText : partialJobSearchErrorText)
      }
    }

    if (itemMarker) {
      flyToMarker(itemMarker, 12)
    }
    setCurrentPage("fiche")
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
