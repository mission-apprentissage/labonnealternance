import { ILbaItemFormation } from "shared"

import { factorTrainingsForMap, setTrainingMarkers } from "@/utils/mapTools"

import { apiGet } from "../../../utils/api.utils"
import { logError } from "../../../utils/tools"

import { storeSearchResultInContext } from "./handleSearchHistoryContext"
import { getRomeFromParameters, trainingErrorText, trainingsApi } from "./utils"

export const searchForTrainingsFunction = async ({
  values,
  searchTimestamp,
  setIsTrainingSearchLoading,
  setTrainingSearchError,
  clearTrainings,
  setIsFormVisible,
  setTrainingMarkers,
  factorTrainingsForMap,
  widgetParameters,
  followUpItem,
  selectFollowUpItem,
  searchResultContext,
}) => {
  setIsTrainingSearchLoading(true)
  setTrainingSearchError("")
  clearTrainings()
  try {
    const { setHasSearch, setTrainings } = searchResultContext
    const hasLocation = values?.location?.value ? true : false
    const romes = getRomeFromParameters({ values, widgetParameters })
    const querystring: {
      romes?: string
      longitude?: number
      latitude?: number
      radius?: number
      diploma?: string
    } = {
      romes,
    }
    if (hasLocation) {
      querystring.longitude = values.location.value.coordinates[0]
      querystring.latitude = values.location.value.coordinates[1]
      querystring.radius = values.radius || 30
    }
    if (values.diploma) {
      querystring.diploma = values.diploma
    }

    const response: ILbaItemFormation[] = await apiGet(trainingsApi, { querystring })

    setTrainings(response)
    storeSearchResultInContext({ searchResultContext, results: { trainings: response }, searchTimestamp, formValues: values })
    setHasSearch(true)
    setIsFormVisible(false)

    if (response?.length) {
      setTrainingMarkers({
        trainingList: factorTrainingsForMap(response),
        options: {
          centerMapOnTraining: hasLocation,
        },
      })
    }

    if (followUpItem?.parameters.type === "training") {
      selectFollowUpItem({
        itemId: followUpItem.parameters.itemId,
        type: followUpItem.parameters.type,
        trainings: response,
        formValues: values,
      })
    }
  } catch (err) {
    console.error(`Erreur interne lors de la recherche de formations (${err.response ? err.response?.status : ""} : ${err?.response?.data ? err.response.data?.error : ""})`)
    logError("Training search error", err)
    setTrainingSearchError(trainingErrorText)
  }

  setIsTrainingSearchLoading(false)
}

export const searchForTrainingsLightFunction = async ({ values, searchTimestamp, widgetParameters, searchResultContext }) => {
  try {
    const { setHasSearch, setTrainings } = searchResultContext
    const hasLocation = values?.location?.value ? true : false
    const romes = getRomeFromParameters({ values, widgetParameters })

    const querystring: {
      romes?: string
      longitude?: number
      latitude?: number
      radius?: number
      diploma?: string
    } = {
      romes,
    }
    if (hasLocation) {
      querystring.longitude = values.location.value.coordinates[0]
      querystring.latitude = values.location.value.coordinates[1]
      querystring.radius = values.radius || 30
    }
    if (values.diploma) {
      querystring.diploma = values.diploma
    }

    const response: ILbaItemFormation[] = await apiGet(trainingsApi, { querystring })

    setTrainings(response)
    storeSearchResultInContext({ searchResultContext, results: { trainings: response }, searchTimestamp, formValues: values })
    setHasSearch(true)

    if (response?.length) {
      setTrainingMarkers({
        trainingList: factorTrainingsForMap(response),
        options: {
          centerMapOnTraining: hasLocation,
        },
      })
    }
  } catch (err) {
    console.error(`Erreur interne lors de la recherche de formations (${err.response ? err.response?.status : ""} : ${err?.response?.data ? err.response.data?.error : ""})`)
    logError("Training search error", err)
  }
}
