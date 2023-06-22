import { concat, pick, get } from "lodash"
import { mergeJobs, mergeOpportunities } from "../../../utils/itemListUtils"

export default function getCurrentList({ store, activeFilter, extendedSearch }) {
  let picked = pick(store, ["trainings", "jobs"])
  let trainingsArray = ["all", "trainings"].includes(activeFilter) ? get(picked, "trainings", []) : []
  let jobList = []
  let companyList = []

  if (["all", "duo"].includes(activeFilter)) {
    partnerList = jobs.matchas.length ? jobs.matchas.filter((job) => job.company?.mandataire) : []
  }

  if (["all", "jobs"].includes(activeFilter)) {
    if (extendedSearch) {
      jobList = mergeOpportunities({ jobs: get(picked, "jobs") })
    } else {
      jobList = mergeJobs(get(picked, "jobs"))
      companyList = mergeOpportunities({ jobs: get(picked, "jobs"), onlyLbbLbaCompanies: "onlyLbbLba" })
    }
  }
  let fullList = concat([], trainingsArray, jobList, companyList, partnerList)
  return fullList.filter((el) => !!el)
}
