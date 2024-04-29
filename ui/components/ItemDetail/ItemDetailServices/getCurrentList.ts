import { mergeJobs, mergeOpportunities } from "../../../utils/itemListUtils"

export default function getCurrentList({ jobs, trainings = [], extendedSearch, activeFilters }) {
  const trainingsArray = activeFilters.includes("trainings") ? trainings : []
  let jobList = []
  let companyList = []
  let partnerList = []

  if (activeFilters.includes("duo")) {
    partnerList = jobs?.matchas?.length ? jobs.matchas.filter((job) => job.company?.mandataire) : []
  }

  if (activeFilters.includes("jobs")) {
    if (extendedSearch) {
      jobList = mergeOpportunities({ jobs, activeFilters })
    } else {
      jobList = mergeJobs({ jobs, activeFilters })
      companyList = mergeOpportunities({ jobs, activeFilters, onlyLbbLbaCompanies: "onlyLbbLba" })
    }
  }
  const fullList = trainingsArray.concat(jobList).concat(companyList).concat(partnerList)
  return fullList.filter((el) => !!el)
}
