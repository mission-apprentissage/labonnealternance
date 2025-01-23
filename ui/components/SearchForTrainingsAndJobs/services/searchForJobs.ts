import axios from "axios"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { computeMissingPositionAndDistance, factorInternalJobsForMap, factorPartnerJobsForMap, layerType, setJobMarkers } from "@/utils/mapTools"

import { logError } from "../../../utils/tools"

import { storeSearchResultInContext } from "./handleSearchHistoryContext"
import { getRomeFromParameters, minimalDataJobsApi, partialJobSearchErrorText, technicalErrorText } from "./utils"

export const searchForJobsFunction = async ({
  values,
  searchTimestamp,
  setIsJobSearchLoading,
  setJobSearchError,
  scopeContext,
  widgetParameters = undefined,
  followUpItem = undefined,
  selectFollowUpItem = undefined,
  opcoFilter = undefined,
  opcoUrlFilter = undefined,
  showCombinedJob = undefined,
  searchResultContext,
}) => {
  try {
    const { setHasSearch, setInternalJobs } = searchResultContext
    const searchCenter = values?.location?.value ? [values.location.value.coordinates[0], values.location.value.coordinates[1]] : null
    const romes = getRomeFromParameters({ values, widgetParameters })
    const rncp = romes ? "" : values?.job?.rncp

    const params: {
      romes?: string
      rncp?: string
      opco?: string
      opcoUrl?: string
      longitude?: number
      latitude?: number
      insee?: string
      radius?: number
      diploma?: string
      sources: string
    } = {
      romes,
      rncp,
      opco: opcoFilter,
      opcoUrl: opcoUrlFilter,
      sources: "lba,matcha,partnerJob",
    }
    if (values?.location?.value) {
      params.longitude = values.location.value.coordinates[0]
      params.latitude = values.location.value.coordinates[1]
      params.insee = values.location.insee
      params.radius = values.radius || 30
    }
    if (values.diploma) {
      params.diploma = values.diploma
    }

    const response = await axios.get(minimalDataJobsApi, {
      params,
    })

    let results = {} as any

    if (response.data === "romes_missing") {
      setJobSearchError(technicalErrorText)
      logError("Job search error", `Missing romes`)
    } else {
      results = {
        matchas: response.data.matchas.result && response.data.matchas.result === "error" ? null : response.data.matchas.results,
        lbaCompanies: response.data.lbaCompanies.result && response.data.lbaCompanies.result === "error" ? null : response.data.lbaCompanies.results,
        partnerJobs: response.data.partnerJobs.result && response.data.partnerJobs.result === "error" ? null : response.data.partnerJobs.results,
      }

      if (!showCombinedJob && results.matchas?.length) {
        results.matchas = results.matchas.filter((matcha) => !matcha.company.mandataire)
      }

      if (followUpItem && LBA_ITEM_TYPE_OLD.FORMATION !== followUpItem.parameters.type) {
        selectFollowUpItem({
          itemId: followUpItem.parameters.itemId,
          type: followUpItem.parameters.type,
          jobs: results,
          formValues: values,
        })
      }
    }

    // gestion des erreurs
    let jobErrorMessage = ""

    if (response.data.lbaCompanies.result === "error" || response.data.matchas.result === "error") {
      jobErrorMessage = partialJobSearchErrorText
      if (response.data.lbaCompanies.result === "error") logError("Job Search Error", `LBA Error : ${response.data.lbaCompanies.message}`)
      if (response.data.matchas.result === "error") logError("Job Search Error", `Matcha Error : ${response.data.matchas.message}`)
    }

    if (jobErrorMessage) {
      setJobSearchError(jobErrorMessage)
    }

    setInternalJobs(results)
    setHasSearch(true)
    storeSearchResultInContext({ searchResultContext, results: { jobs: results }, searchTimestamp, formValues: values })

    setJobMarkers({ jobList: factorInternalJobsForMap(results), type: layerType.INTERNAL, searchCenter, hasTrainings: scopeContext.isTraining })
  } catch (err) {
    console.error(
      `Erreur interne lors de la recherche d'emplois (${err.response && err.response.status ? err.response.status : ""} : ${
        err.response && err.response.data ? err.response.data.error : err.message
      })`
    )
    logError("Job search error", err)
    setJobSearchError(partialJobSearchErrorText)
  }

  setIsJobSearchLoading(false)
}

export const searchForJobsLightFunction = async ({ values, widgetParameters = undefined, searchResultContext, searchTimestamp }) => {
  try {
    const scopeContext = { isJob: true, isTraining: true }
    const { setHasSearch, setInternalJobs } = searchResultContext
    const searchCenter = values?.location?.value ? [values.location.value.coordinates[0], values.location.value.coordinates[1]] : null
    const romes = getRomeFromParameters({ values, widgetParameters })

    const params: {
      romes?: string
      rncp?: string
      opco?: string
      opcoUrl?: string
      longitude?: number
      latitude?: number
      insee?: string
      radius?: number
      diploma?: string
      sources: string
    } = {
      romes,
      sources: "lba,matcha,partnerJob",
    }
    if (values?.location?.value) {
      params.longitude = values.location.value.coordinates[0]
      params.latitude = values.location.value.coordinates[1]
      params.insee = values.location.insee
      params.radius = values.radius || 30
    }
    if (values.diploma) {
      params.diploma = values.diploma
    }

    const response = await axios.get(minimalDataJobsApi, {
      params,
    })

    let results = {} as any

    results = {
      matchas: response.data.matchas.result && response.data.matchas.result === "error" ? null : response.data.matchas.results,
      lbaCompanies: response.data.lbaCompanies.result && response.data.lbaCompanies.result === "error" ? null : response.data.lbaCompanies.results,
      partnerJobs: response.data.partnerJobs.result && response.data.partnerJobs.result === "error" ? null : response.data.partnerJobs.results,
    }

    setInternalJobs(results)
    setHasSearch(true)
    storeSearchResultInContext({ searchResultContext, results: { jobs: results }, searchTimestamp, formValues: values })

    setJobMarkers({ jobList: factorInternalJobsForMap(results), type: layerType.INTERNAL, searchCenter, hasTrainings: scopeContext.isTraining })
  } catch (err) {
    console.error(
      `Erreur interne lors de la recherche d'emplois (${err.response && err.response.status ? err.response.status : ""} : ${
        err.response && err.response.data ? err.response.data.error : err.message
      })`
    )
    logError("Job search error", err)
  }
}

export const searchForPartnerJobsFunction = async ({
  values,
  searchTimestamp,
  setIsPartnerJobSearchLoading,
  setPartnerJobSearchError,
  computeMissingPositionAndDistance,
  scopeContext,
  widgetParameters = undefined,
  followUpItem = undefined,
  selectFollowUpItem = undefined,
  opcoFilter = undefined,
  opcoUrlFilter = undefined,
  searchResultContext,
}) => {
  setIsPartnerJobSearchLoading(true)
  setPartnerJobSearchError("")

  try {
    const { setHasSearch, setPartnerJobs } = searchResultContext
    const searchCenter = values?.location?.value ? [values.location.value.coordinates[0], values.location.value.coordinates[1]] : null
    const romes = getRomeFromParameters({ values, widgetParameters })
    const rncp = romes ? "" : values?.job?.rncp

    const params: {
      romes?: string
      rncp?: string
      opco?: string
      opcoUrl?: string
      longitude?: number
      latitude?: number
      insee?: string
      radius?: number
      diploma?: string
      sources: string
    } = {
      romes,
      rncp,
      opco: opcoFilter,
      opcoUrl: opcoUrlFilter,
      sources: "offres",
    }
    if (values?.location?.value) {
      params.longitude = values.location.value.coordinates[0]
      params.latitude = values.location.value.coordinates[1]
      params.insee = values.location.insee
      params.radius = values.radius || 30
    }
    if (values.diploma) {
      params.diploma = values.diploma
    }

    const response = await axios.get(minimalDataJobsApi, {
      params,
    })

    let peJobs = null

    let results = {} as any

    if (response.data === "romes_missing") {
      setPartnerJobSearchError(technicalErrorText)
      logError("Job search error", `Missing romes`)
    } else {
      if (!response.data.peJobs.result || response.data.peJobs.result !== "error") peJobs = await computeMissingPositionAndDistance(searchCenter, response.data.peJobs.results)

      results = {
        peJobs: response.data.peJobs.result && response.data.peJobs.result === "error" ? null : peJobs,
      }

      if (followUpItem && followUpItem.parameters.type === LBA_ITEM_TYPE_OLD.PEJOB) {
        selectFollowUpItem({
          itemId: followUpItem.parameters.itemId,
          type: followUpItem.parameters.type,
          jobs: results,
          formValues: values,
        })
      }
    }

    // gestion des erreurs
    let jobErrorMessage = ""
    if (response.data.peJobs.result === "error") {
      setPartnerJobSearchError(true)
      jobErrorMessage = partialJobSearchErrorText
      logError("Partner Job Search Error", `Partner job source in error. FT : ${response.data.peJobs.message}`)
    }

    if (jobErrorMessage) {
      setPartnerJobSearchError(jobErrorMessage)
    }

    setPartnerJobs(results)
    setHasSearch(true)
    storeSearchResultInContext({ searchResultContext, results: { jobs: results }, searchTimestamp, formValues: values })
    setJobMarkers({ jobList: factorPartnerJobsForMap(results), type: layerType.PARTNER, searchCenter, hasTrainings: scopeContext.isTraining })
  } catch (err) {
    console.error(
      `Erreur interne lors de la recherche d'emplois (${err.response && err.response.status ? err.response.status : ""} : ${
        err.response && err.response.data ? err.response.data.error : err.message
      })`
    )
    logError("Job search error", err)
    setPartnerJobSearchError(partialJobSearchErrorText)
  }

  setIsPartnerJobSearchLoading(false)
}

export const searchForPartnerJobsLightFunction = async ({ values, widgetParameters = undefined, searchResultContext, searchTimestamp }) => {
  try {
    const { setHasSearch, setPartnerJobs } = searchResultContext
    const searchCenter = values?.location?.value ? [values.location.value.coordinates[0], values.location.value.coordinates[1]] : null
    const romes = getRomeFromParameters({ values, widgetParameters })

    const params: {
      romes?: string
      rncp?: string
      opco?: string
      opcoUrl?: string
      longitude?: number
      latitude?: number
      insee?: string
      radius?: number
      diploma?: string
      sources: string
    } = {
      romes,
      sources: "offres",
    }

    if (values?.location?.value) {
      params.longitude = values.location.value.coordinates[0]
      params.latitude = values.location.value.coordinates[1]
      params.insee = values.location.insee
      params.radius = values.radius || 30
    }
    if (values.diploma) {
      params.diploma = values.diploma
    }

    const response = await axios.get(minimalDataJobsApi, {
      params,
    })

    let peJobs = null

    let results = {} as any

    if (!response.data.peJobs.result || response.data.peJobs.result !== "error") peJobs = await computeMissingPositionAndDistance(searchCenter, response.data.peJobs.results)

    results = {
      peJobs: response.data.peJobs.result && response.data.peJobs.result === "error" ? null : peJobs,
    }

    setPartnerJobs(results)
    setHasSearch(true)
    storeSearchResultInContext({ searchResultContext, results: { jobs: results }, searchTimestamp, formValues: values })
    setJobMarkers({ jobList: factorPartnerJobsForMap(results), type: layerType.PARTNER, searchCenter, hasTrainings: true })
  } catch (err) {
    console.error(
      `Erreur interne lors de la recherche d'emplois (${err.response && err.response.status ? err.response.status : ""} : ${
        err.response && err.response.data ? err.response.data.error : err.message
      })`
    )
    logError("Job search error", err)
  }
}
