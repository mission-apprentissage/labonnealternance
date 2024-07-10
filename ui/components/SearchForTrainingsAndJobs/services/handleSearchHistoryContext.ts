import { ILbaItemTraining2 } from "@/../shared"

import { IContextSearch, IContextSearchHistory } from "@/context/SearchResultContextProvider"

import { factorInternalJobsForMap, factorPartnerJobsForMap, factorTrainingsForMap, layerType, setJobMarkers, setTrainingMarkers } from "../../../utils/mapTools"

const SEARCH_HISTORY_LIMIT = 20
export const storeSearchResultInContext = ({
  searchResultContext,
  results,
  searchTimestamp,
}: {
  searchResultContext: IContextSearch
  results: { trainings?: ILbaItemTraining2[]; jobs?: { peJobs: [] | null; lbaCompanies: [] | null; matchas: [] | null } }
  searchTimestamp: number
}): void => {
  const { searchHistory, setSearchHistory } = searchResultContext

  const indexToReplace = searchHistory.findIndex((log) => searchTimestamp === log.index)
  let search: IContextSearchHistory = indexToReplace >= 0 ? searchHistory[indexToReplace] : { index: searchTimestamp, searchParameters: null }

  const jobsToAdd = search.jobs ?? {}
  let jobs
  if (results.jobs) {
    jobs = {
      ...jobsToAdd,
      ...results.jobs,
    }
  }

  search = {
    ...search,
    ...results,
    jobs,
    index: searchTimestamp,
  }

  searchHistory[indexToReplace >= 0 ? indexToReplace : searchHistory.length] = search

  if (searchHistory.length > SEARCH_HISTORY_LIMIT) {
    searchHistory.shift()
  }

  console.log("searchHIstor ", searchHistory)
  setSearchHistory(searchHistory)
}

export const restoreSearchFromSearchHistoryContext = ({
  searchResultContext,
  searchTimestamp,
  setTrainings,
  setJobs,
}: {
  searchResultContext: IContextSearch
  searchTimestamp: number
  setTrainings: any
  setJobs: any
}): void => {
  const { searchHistory } = searchResultContext
  const search = searchHistory.find((log) => {
    console.log(log.index, " / ", searchTimestamp, "----- ", log)
    return log.index == searchTimestamp
  })

  console.log("RESTORE FROM SEARCH HISTORY CONTEXT : ", search, searchHistory, searchTimestamp)

  if (search?.jobs) {
    setJobs(search.jobs)
    setJobMarkers({ jobList: factorInternalJobsForMap(search.jobs), type: layerType.INTERNAL, hasTrainings: search?.trainings })
    setJobMarkers({ jobList: factorPartnerJobsForMap(search.jobs), type: layerType.PARTNER, hasTrainings: search?.trainings })
  }

  if (search?.trainings) {
    setTrainings(search.trainings)
    setTrainingMarkers({ trainingList: factorTrainingsForMap(search.trainings) })
  }
}
