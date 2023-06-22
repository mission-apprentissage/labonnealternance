import { concat, pick, get } from "lodash"
import { amongst } from "../../../utils/arrayutils"
import { mergeJobs, mergeOpportunities } from "../../../utils/itemListUtils"

export default function getCurrentList({ store, activeFilter, extendedSearch }) {
  let picked = pick(store, ["trainings", "jobs"])
  let trainingsArray = amongst(activeFilter, ["all", "trainings"]) ? get(picked, "trainings", []) : []

  let partnerList = []
  let jobList = []
  let companyList = []

  if (amongst(activeFilter, ["all", "duo"])) {
    partnerList = jobs.matchas.length ? jobs.matchas.filter((job) => job.company?.mandataire) : []
  }

  if (amongst(activeFilter, ["all", "jobs"])) {
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
