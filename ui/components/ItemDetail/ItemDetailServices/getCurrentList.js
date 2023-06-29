import { mergeJobs, mergeOpportunities } from "../../../utils/itemListUtils"

export default function getCurrentList({ store, activeFilter, extendedSearch }) {
  const { jobs, trainings = [] } = store

  let trainingsArray = ["all", "trainings"].includes(activeFilter) ? trainings : []
  let jobList = []
  let companyList = []
  let partnerList = []

  if ("duo" === activeFilter) {
    partnerList = jobs?.matchas?.length ? jobs.matchas.filter((job) => job.company?.mandataire) : []
  }

  if (["all", "jobs"].includes(activeFilter)) {
    if (extendedSearch) {
      jobList = mergeOpportunities({ jobs, activeFilter })
    } else {
      jobList = mergeJobs({ jobs, activeFilter })
      companyList = mergeOpportunities({ jobs, activeFilter, onlyLbbLbaCompanies: "onlyLbbLba" })
    }
  }
  let fullList = trainingsArray.concat(jobList).concat(companyList).concat(partnerList)
  return fullList.filter((el) => !!el)
}
