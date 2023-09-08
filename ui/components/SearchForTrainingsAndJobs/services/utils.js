import { baseUrl } from "../../../config/config"

const trainingsApi = baseUrl + "/api/v1/formations"
const trainingApi = trainingsApi + "/formation"
const jobsApi = baseUrl + "/api/v1/jobs"
const offreApi = jobsApi + "/job"
const companyApi = jobsApi + "/company"
const matchaApi = jobsApi + "/matcha"

const allJobSearchErrorText = "Problème momentané d'accès aux opportunités d'emploi"
const partialJobSearchErrorText = "Problème momentané d'accès à certaines opportunités d'emploi"
const trainingErrorText = "Oups ! Les résultats formation ne sont pas disponibles actuellement !"
const notFoundErrorText = "L'élément recherché n'existe plus"
const technicalErrorText = "Error technique momentanée"

const getRomeFromParameters = ({ values, widgetParameters }) => {
  let romes = ""
  if (widgetParameters?.parameters?.jobName && widgetParameters?.parameters?.romes && widgetParameters?.parameters?.frozenJob) {
    romes = widgetParameters?.parameters?.romes
  } else if (values?.job?.romes) {
    romes = values.job.romes.join(",")
  }
  return romes
}

const getRncpFromParameters = ({ widgetParameters }) => widgetParameters?.parameters?.rncp

const getRncpsFromParameters = ({ values, widgetParameters }) => {
  return widgetParameters?.parameters?.jobName && widgetParameters?.parameters?.romes && widgetParameters?.parameters?.frozenJob
    ? ""
    : values.job?.rncps
    ? values.job.rncps.join(",")
    : ""
}

const getJobCount = (jobs) => {
  let jobCount = 0

  if (jobs) {
    if (jobs.peJobs) {
      jobCount += jobs.peJobs.length
    }
    if (jobs.matchas) {
      jobCount += jobs.matchas.length
    }
    if (jobs.lbaCompanies) {
      jobCount += jobs.lbaCompanies.length
    }
  }

  return jobCount
}

const getPartnerJobCount = (jobs) => {
  return jobs && jobs.matchas ? jobs.matchas.filter((job) => job.company?.mandataire).length : 0
}

const defaultFilters = ["jobs", "trainings", "duo"]

export {
  trainingApi,
  trainingsApi,
  jobsApi,
  allJobSearchErrorText,
  partialJobSearchErrorText,
  trainingErrorText,
  technicalErrorText,
  notFoundErrorText,
  getRomeFromParameters,
  getRncpFromParameters,
  getRncpsFromParameters,
  offreApi,
  matchaApi,
  companyApi,
  getJobCount,
  getPartnerJobCount,
  defaultFilters,
}
