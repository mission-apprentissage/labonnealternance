import axios from "axios"
import { logError } from "utils/tools"
import { SendTrackEvent } from "utils/plausible"

import { trainingsApi, trainingErrorText, getRomeFromParameters, getRncpsFromParameters } from "components/SearchForTrainingsAndJobs/services/utils"
import { storeTrainingsInSession } from "./handleSessionStorage"

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
  useMock,
}) => {
  setIsTrainingSearchLoading(true)
  setTrainingSearchError("")
  clearTrainings()
  try {
    const hasLocation = values?.location?.value ? true : false
    const response = await axios.get(trainingsApi, {
      params: {
        romes: getRomeFromParameters({ values, widgetParameters }),
        rncps: getRncpsFromParameters({ values, widgetParameters }),
        longitude: hasLocation ? values.location.value.coordinates[0] : null,
        latitude: hasLocation ? values.location.value.coordinates[1] : null,
        radius: values.radius || 30,
        diploma: values.diploma,
        useMock,
      },
    })

    if (response.data.result === "error") {
      logError("Training Search Error", `${response.data.message}`)
      setTrainingSearchError(trainingErrorText)
    } else {
      if (values?.job?.type) {
        try {
          SendTrackEvent({
            event: `Résultat recherche formation par ${values.job.type === "job" ? "Métier" : "Diplôme"}`,
            label: values.job.label,
            nb_formations: response.data.results.length,
          })
        } catch (err) {}
      }
    }

    setTrainings(response.data.results)
    storeTrainingsInSession({ trainings: response.data.results, searchTimestamp })
    setHasSearch(true)
    setIsFormVisible(false)

    if (response.data.results.length) {
      setTrainingMarkers(factorTrainingsForMap(response.data.results), {
        centerMapOnTraining: hasLocation ? true : false,
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
