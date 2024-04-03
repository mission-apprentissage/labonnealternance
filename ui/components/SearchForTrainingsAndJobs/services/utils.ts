import { publicConfig } from "@/config.public"

const { apiEndpoint } = publicConfig

const trainingsApi = "/v1/formations/min"
const trainingApi = `${apiEndpoint}/v1/formations/formation`
const jobsApi = `${apiEndpoint}/v1/jobs`
const minimalDataJobsApi = jobsApi + "/min"
const offreApi = jobsApi + "/job"
const matchaApi = jobsApi + "/matcha"
const companyApi = jobsApi + "/company"

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
  allJobSearchErrorText,
  companyApi,
  defaultFilters,
  getJobCount,
  getPartnerJobCount,
  getRomeFromParameters,
  jobsApi,
  minimalDataJobsApi,
  matchaApi,
  notFoundErrorText,
  offreApi,
  partialJobSearchErrorText,
  technicalErrorText,
  trainingApi,
  trainingErrorText,
  trainingsApi,
}
