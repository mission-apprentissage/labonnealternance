import axios from "axios"

import { logError } from "../../../utils/tools"

import { storeTrainingsInSession } from "./handleSessionStorage"
import { getRomeFromParameters, trainingErrorText, trainingsApi } from "./utils"

export const searchForTrainingsFunction = async ({
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
}) => {
  setIsTrainingSearchLoading(true)
  setTrainingSearchError("")
  clearTrainings()
  try {
    const hasLocation = values?.location?.value ? true : false
    const romes = getRomeFromParameters({ values, widgetParameters })

    const response = await axios.get(trainingsApi, {
      params: {
        romes,
        longitude: hasLocation ? values.location.value.coordinates[0] : null,
        latitude: hasLocation ? values.location.value.coordinates[1] : null,
        radius: values.radius || 30,
        diploma: values.diploma,
      },
    })

    if (response.data.result === "error") {
      logError("Training Search Error", `${response.data.message}`)
      setTrainingSearchError(trainingErrorText)
    }

    setTrainings(response.data.results)
    storeTrainingsInSession({ trainings: response.data.results, searchTimestamp })
    setHasSearch(true)
    setIsFormVisible(false)

    if (response.data.results.length) {
      setTrainingMarkers({
        trainingList: factorTrainingsForMap(response.data.results),
        options: {
          centerMapOnTraining: hasLocation,
        },
      })

      if (followUpItem?.parameters.type === "training") {
        selectFollowUpItem({
          itemId: followUpItem.parameters.itemId,
          type: followUpItem.parameters.type,
          trainings: response.data.results,
          formValues: values,
        })
      }
    }
  } catch (err) {
    console.log(`Erreur interne lors de la recherche de formations (${err.response ? err.response?.status : ""} : ${err?.response?.data ? err.response.data?.error : ""})`)
    logError("Training search error", err)
    setTrainingSearchError(trainingErrorText)
  }

  setIsTrainingSearchLoading(false)
}
