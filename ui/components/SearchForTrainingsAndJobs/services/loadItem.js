import axios from "axios"
import { logError } from "utils/tools"
import { searchForJobsFunction } from "components/SearchForTrainingsAndJobs/services/searchForJobs"
import { trainingApi, offreApi, matchaApi, companyApi, trainingErrorText, partialJobSearchErrorText, notFoundErrorText } from "components/SearchForTrainingsAndJobs/services/utils"

import { flyToMarker, setSelectedMarker } from "utils/mapTools"
import { storeTrainingsInSession } from "./handleSessionStorage"

export const loadItem = async ({
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
}) => {
  try {
    setHasSearch(true)
    setIsFormVisible(false)

    let itemMarker = null

    if (item.type === "training") {
      const response = await axios.get(`${trainingApi}/${!useMock ? encodeURIComponent(item.itemId) : "id-formation-test"}`)

      if (response.data.result === "error") {
        logError("Training Search Error", `${response.data.message}`)
        setTrainingSearchError(trainingErrorText)
      }

      const searchTimestamp = new Date().getTime()

      setTrainings(response.data.results)
      storeTrainingsInSession({ trainings: response.data.results, searchTimestamp })

      if (response.data.results.length) {
        setTrainingMarkers(factorTrainingsForMap(response.data.results))
      }
      setSelectedItem(response.data.results[0])
      setSelectedMarker(response.data.results[0])
      itemMarker = response.data.results[0]

      // lancement d'une recherche d'emploi autour de la formation chargée
      let values = {
        job: {
          rncps: [itemMarker.rncpCode],
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
        computeMissingPositionAndDistance,
        setJobs,
        setAllJobSearchError: () => {},
        setJobMarkers,
        factorJobsForMap,
        scopeContext: {
          isTraining: true,
          isJob: true,
        },
      })
    } else {
      let results = {
        peJobs: null,
        lbbCompanies: null,
        lbaCompanies: null,
        matchas: null,
      }

      let loadedItem = null

      let errorMessage = null
      let responseResult = null

      switch (item.type) {
        case "peJob": {
          const response = await axios.get(offreApi + "/" + item.itemId)

          // gestion des erreurs
          if (!response?.data?.message) {
            let peJobs = await computeMissingPositionAndDistance(null, response.data.peJobs)

            results.peJobs = peJobs
            loadedItem = peJobs[0]
          } else {
            errorMessage = `PE Error : ${response.data.message}`
            responseResult = response.data.result
          }
          break
        }
        case "matcha": {
          let matchaUrl = `${matchaApi}/${!useMock ? item.itemId : "id-matcha-test"}`
          const response = await axios.get(matchaUrl)

          // gestion des erreurs
          if (!response?.data?.message) {
            let matchas = await computeMissingPositionAndDistance(null, response.data.matchas)
            results.matchas = matchas
            loadedItem = matchas[0]
          } else {
            errorMessage = `Matcha Error : ${response.data.message}`
            responseResult = response.data.result
          }
          break
        }

        default: {
          const response = await axios.get(`${companyApi}/${item.itemId}?type=${item.type}`)

          // gestion des erreurs
          if (!response?.data?.message) {
            let companies = item.type === "lbb" ? response.data.lbbCompanies : response.data.lbaCompanies

            loadedItem = companies[0]
            results.lbbCompanies = item.type === "lbb" ? companies : null
            results.lbaCompanies = item.type === "lba" ? companies : null
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

        setJobMarkers(factorJobsForMap(results), null)

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
    console.log(`Erreur interne lors du chargement d'un élément (${err.response ? err.response.status : ""} : ${err?.response?.data ? err.response.data.error : ""})`)
    logError("Training search error", err)
    setTrainingSearchError(trainingErrorText)
  }

  setIsTrainingSearchLoading(false)
  setIsJobSearchLoading(false)
  return
}
