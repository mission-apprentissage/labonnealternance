import { concat, pick, get } from "lodash"
import { amongst } from "../../../utils/arrayutils"
import { mergeJobs, mergeOpportunities } from "../../../utils/itemListUtils"

export default function getCurrentList({ store, activeFilter, extendedSearch }) {
  let picked = pick(store, ["trainings", "jobs"])
  let trainingsArray = amongst(activeFilter, ["all", "trainings"]) ? get(picked, "trainings", []) : []

  let jobList = []
  let companyList = []
  if (amongst(activeFilter, ["all", "jobs"])) {
    if (extendedSearch) jobList = mergeOpportunities(get(picked, "jobs"))
    else {
      jobList = mergeJobs(get(picked, "jobs"))
      companyList = mergeOpportunities(get(picked, "jobs"), "onlyLbbLba")
    }
  }
  let fullList = concat([], trainingsArray, jobList, companyList)
  return fullList.filter((el) => !!el)
}
