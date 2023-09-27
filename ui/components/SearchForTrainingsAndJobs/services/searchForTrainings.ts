import { apiGet } from "../../../utils/api.utils"
import { logError } from "../../../utils/tools"

import { storeTrainingsInSession } from "./handleSessionStorage"
import { getRomeFromParameters, trainingErrorText } from "./utils"

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

    const querystring: { 
      romes?: string, 
      longitude?: number, 
      latitude?: number, 
      radius?: number, 
      diploma?: string } = {
      romes,
    }
    if(hasLocation){
      querystring.longitude = values.location.value.coordinates[0]
      querystring.latitude = values.location.value.coordinates[1]
      querystring.radius = values.radius || 30
    }
    if(values.diploma){
      querystring.diploma = values.diploma
    }

    const response = await apiGet("/api/v1/formations", {querystring})

    setTrainings(response.results)
    storeTrainingsInSession({ trainings: response.results, searchTimestamp })
    setHasSearch(true)
    setIsFormVisible(false)

    if (response.results.length) {
      setTrainingMarkers({
        trainingList: factorTrainingsForMap(response.results),
        options: {
          centerMapOnTraining: hasLocation,
        },
      })

      if (followUpItem?.parameters.type === "training") {
        selectFollowUpItem({
          itemId: followUpItem.parameters.itemId,
          type: followUpItem.parameters.type,
          trainings: response.results,
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
