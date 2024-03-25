import axios from "axios"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

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
import { companyApi, matchaApi, notFoundErrorText, offreApi, partialJobSearchErrorText, trainingApi, trainingErrorText } from "./utils"

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
        setHasSearch,
        setJobSearchError,
        setInternalJobs,
      })
      searchForPartnerJobsFunction({
        values,
        searchTimestamp,
        setIsPartnerJobSearchLoading,
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

      let errorMessage = null
      let responseResult = null

      switch (item.type) {
        case LBA_ITEM_TYPE_OLD.PEJOB: {
          const response = await axios.get(offreApi + "/" + item.itemId)

          // gestion des erreurs
          if (!response?.data?.message) {
            const peJobs = await computeMissingPositionAndDistance(null, response.data.peJobs)

            results.peJobs = peJobs
            loadedItem = peJobs[0]
          } else {
            errorMessage = `PE Error : ${response.data.message}`
            responseResult = response.data.result
          }
          break
        }
        case LBA_ITEM_TYPE_OLD.MATCHA: {
          const matchaUrl = `${matchaApi}/${item.itemId}`
          const response = await axios.get(matchaUrl)

          // gestion des erreurs
          if (!response?.data?.message) {
            const matchas = await computeMissingPositionAndDistance(null, response.data.matchas)
            results.matchas = matchas
            loadedItem = matchas[0]
          } else {
            errorMessage = `Matcha Error : ${response.data.message}`
            responseResult = response.data.result
          }
          break
        }

        default: {
          const response = await axios.get(`${companyApi}/${item.itemId}`)

          // gestion des erreurs
          if (!response?.data?.message) {
            const companies = response.data.lbaCompanies

            loadedItem = companies[0]
            results.lbaCompanies = companies
          } else {
            errorMessage = `${item.type} Error : ${response.data.message}`
            responseResult = response.data.result
          }
          break
        }
      }

      if (!errorMessage) {
        setJobs(results)

        setHasSearch(true)

        if (item.type === LBA_ITEM_TYPE_OLD.PEJOB) {
          setJobMarkers({ jobList: factorInternalJobsForMap(results), type: layerType.PARTNER, hasTrainings: false })
        } else {
          setJobMarkers({ jobList: factorPartnerJobsForMap(results), type: layerType.PARTNER, hasTrainings: false })
        }

        setSelectedItem(loadedItem)
        setSelectedMarker(loadedItem)
        itemMarker = loadedItem
      } else {
        logError("Job Load Error", errorMessage)
        setJobSearchError(responseResult === "not_found" ? notFoundErrorText : partialJobSearchErrorText)
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
