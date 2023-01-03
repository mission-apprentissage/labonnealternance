import axios from "axios"
import { SendTrackEvent } from "utils/plausible"
import { logError } from "utils/tools"

import { allJobSearchErrorText, getRomeFromParameters, jobsApi, partialJobSearchErrorText, technicalErrorText } from "../../SearchForTrainingsAndJobs/services/utils"
import { storeJobsInSession } from "./handleSessionStorage"

export const searchForJobsFunction = async ({
  values,
  searchTimestamp,
  setIsJobSearchLoading,
  setHasSearch,
  setJobSearchError,
  setAllJobSearchError,
  computeMissingPositionAndDistance,
  setJobs,
  setJobMarkers,
  factorJobsForMap,
  scopeContext,
  widgetParameters,
  followUpItem,
  selectFollowUpItem,
  opcoFilter,
  useMock,
}) => {
  setIsJobSearchLoading(true)
  setJobSearchError("")
  setAllJobSearchError(false)

  try {
    const searchCenter = values?.location?.value ? [values.location.value.coordinates[0], values.location.value.coordinates[1]] : null

    const response = await axios.get(jobsApi, {
      params: {
        romes: getRomeFromParameters({ values, widgetParameters }),
        longitude: values?.location?.value ? values.location.value.coordinates[0] : null,
        latitude: values?.location?.value ? values.location.value.coordinates[1] : null,
        insee: values?.location?.insee,
        zipcode: values?.location?.zipcode,
        radius: values.radius || 30,
        opco: opcoFilter,
        useMock: useMock,
      },
    })

    let peJobs = null

    let results = {}

    if (response.data === "romes_missing") {
      setJobSearchError(technicalErrorText)
      logError("Job search error", `Missing romes`)
    } else {
      if (!response.data.peJobs.result || response.data.peJobs.result !== "error") peJobs = await computeMissingPositionAndDistance(searchCenter, response.data.peJobs.results)

      results = {
        peJobs: response.data.peJobs.result && response.data.peJobs.result === "error" ? null : peJobs,
        matchas: response.data.matchas.result && response.data.matchas.result === "error" ? null : response.data.matchas.results,
        lbbCompanies: response.data.lbbCompanies.result && response.data.lbbCompanies.result === "error" ? null : response.data.lbbCompanies.results,
        lbaCompanies: response.data.lbaCompanies.result && response.data.lbaCompanies.result === "error" ? null : response.data.lbaCompanies.results,
      }

      if (followUpItem && followUpItem.parameters.type !== "training") {
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
    if (
      response.data.peJobs.result === "error" &&
      //response.data.matchas.result === "error" &&
      response.data.lbbCompanies.result === "error" &&
      response.data.lbaCompanies.result === "error"
    ) {
      //TODO: définition niveau d'erreur JOB total
      setAllJobSearchError(true)
      jobErrorMessage = allJobSearchErrorText
      logError(
        "Job Search Error",
        `All job sources in error. PE : ${response.data.peJobs.message} - LBB : ${response.data.lbbCompanies.message} - LBA : ${response.data.lbaCompanies.message}`
      )
    } else {
      if (
        response.data.peJobs.result === "error" ||
        //response.data.matchas.result === "error" ||
        response.data.lbbCompanies.result === "error" ||
        response.data.lbaCompanies.result === "error"
      ) {
        jobErrorMessage = partialJobSearchErrorText
        if (response.data.peJobs.result === "error") logError("Job Search Error", `PE Error : ${response.data.peJobs.message}`)
        if (response.data.lbbCompanies.result === "error") logError("Job Search Error", `LBB Error : ${response.data.lbbCompanies.message}`)
        if (response.data.lbaCompanies.result === "error") logError("Job Search Error", `LBA Error : ${response.data.lbaCompanies.message}`)
        if (response.data.matchas.result === "error") logError("Job Search Error", `Matcha Error : ${response.data.matchas.message}`)
      }
    }

    if (jobErrorMessage) {
      setJobSearchError(jobErrorMessage)
    }

    sendJobSearchTrackEvent(values, results)
    setJobs(results)
    setHasSearch(true)
    storeJobsInSession({ jobs: results, searchTimestamp })

    setJobMarkers({ jobList: factorJobsForMap(results), searchCenter: scopeContext.isTraining ? null : searchCenter, hasTrainings: scopeContext.isTraining })
  } catch (err) {
    console.log(
      `Erreur interne lors de la recherche d'emplois (${err.response && err.response.status ? err.response.status : ""} : ${
        err.response && err.response.data ? err.response.data.error : err.message
      })`
    )
    logError("Job search error", err)
    setJobSearchError(allJobSearchErrorText)
    setAllJobSearchError(true)
  }

  setIsJobSearchLoading(false)
}

const sendJobSearchTrackEvent = (values, results) => {
  if (values?.job?.type) {
    try {
      SendTrackEvent({
        event: `Résultat recherche emploi par ${values.job.type === "job" ? "Métier" : "Diplôme"}`,
        label: values.job.label,
        nb_peJobs: results.peJobs.length,
        nb_matchas: results.matchas.length,
        nb_lbas: results.lbaCompanies.length,
        nb_lbbs: results.lbbCompanies.length,
      })
    } catch (err) {}
  }
}
