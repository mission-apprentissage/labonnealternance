import { ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { factorInternalJobsForMap, layerType, setJobMarkers } from "@/utils/mapTools"

import { apiGet } from "../../../utils/api.utils"
import { logError } from "../../../utils/tools"

import { storeSearchResultInContext } from "./handleSearchHistoryContext"
import { getRomeFromParameters, partialJobSearchErrorText } from "./utils"

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
      sources: "lba,matcha,partnerJob",
    }
    if (opcoFilter) {
      params.opco = opcoFilter
    }
    if (opcoUrlFilter) {
      params.opcoUrl = opcoUrlFilter
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

    const response = await apiGet("/v1/_private/jobs/min", { querystring: params })

    const results: { matchas: ILbaItemLbaJob[]; lbaCompanies: ILbaItemLbaCompany[]; partnerJobs: ILbaItemPartnerJob[]; peJobs: null } = {
      matchas: response.matchas && "error" in response.matchas ? null : "results" in response.matchas ? response.matchas.results : null,
      lbaCompanies: response.lbaCompanies && "error" in response.lbaCompanies ? null : "results" in response.lbaCompanies ? response.lbaCompanies.results : null,
      partnerJobs: response.partnerJobs && "error" in response.partnerJobs ? null : "results" in response.partnerJobs ? response.partnerJobs.results : null,
      peJobs: null,
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

    if ("error" in response.lbaCompanies || "error" in response.matchas) {
      setJobSearchError(partialJobSearchErrorText)
      if ("error" in response.lbaCompanies) logError("Job Search Error", `LBA Error : ${response.lbaCompanies.message}`)
      if ("error" in response.matchas) logError("Job Search Error", `Matcha Error : ${response.matchas.message}`)
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

    const response = await apiGet("/v1/_private/jobs/min", { querystring: params })

    const results: { matchas: ILbaItemLbaJob[]; lbaCompanies: ILbaItemLbaCompany[]; partnerJobs: ILbaItemPartnerJob[]; peJobs: null } = {
      matchas: response.matchas && "error" in response.matchas ? null : "results" in response.matchas ? response.matchas.results : null,
      lbaCompanies: response.lbaCompanies && "error" in response.lbaCompanies ? null : "results" in response.lbaCompanies ? response.lbaCompanies.results : null,
      partnerJobs: response.partnerJobs && "error" in response.partnerJobs ? null : "results" in response.partnerJobs ? response.partnerJobs.results : null,
      peJobs: null,
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
