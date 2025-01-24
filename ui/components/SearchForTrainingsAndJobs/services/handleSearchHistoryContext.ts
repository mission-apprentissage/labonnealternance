import { ILbaItemTraining2 } from "@/../shared"

import { IContextSearch, IContextSearchHistory } from "@/context/SearchResultContextProvider"

import { factorInternalJobsForMap, factorTrainingsForMap, layerType, setJobMarkers, setTrainingMarkers } from "../../../utils/mapTools"

const SEARCH_HISTORY_LIMIT = 20 // arbitraire
export const storeSearchResultInContext = ({
  searchResultContext,
  results,
  searchTimestamp,
  formValues,
}: {
  searchResultContext: IContextSearch
  results: { trainings?: ILbaItemTraining2[]; jobs?: { peJobs: [] | null; lbaCompanies: [] | null; matchas: [] | null; partnerJobs: [] | null } }
  searchTimestamp: number
  formValues?: any
}): void => {
  const { searchHistory, setSearchHistory } = searchResultContext

  const indexToReplace = searchHistory.findIndex((log) => searchTimestamp === log.index)
  let search: IContextSearchHistory = indexToReplace >= 0 ? searchHistory[indexToReplace] : { index: searchTimestamp, formValues: null }

  search = {
    trainings: results?.trainings ?? search?.trainings,
    jobs: {
      peJobs: results?.jobs?.peJobs ?? search?.jobs?.peJobs,
      matchas: results?.jobs?.matchas ?? search?.jobs?.matchas,
      lbaCompanies: results?.jobs?.lbaCompanies ?? search?.jobs?.lbaCompanies,
      partnerJobs: results?.jobs?.partnerJobs ?? search?.jobs?.partnerJobs,
    },
    formValues,
    index: searchTimestamp,
  }

  searchHistory[indexToReplace >= 0 ? indexToReplace : searchHistory.length] = search

  if (searchHistory.length > SEARCH_HISTORY_LIMIT) {
    searchHistory.shift()
  }

  setSearchHistory(searchHistory)
}

export const restoreSearchFromSearchHistoryContext = ({
  searchResultContext,
  searchTimestamp,
  displayContext,
}: {
  searchResultContext: IContextSearch
  searchTimestamp: number
  displayContext: any
}): void => {
  const { searchHistory, setJobs, setTrainings } = searchResultContext
  const search = searchHistory.find((log) => {
    return log.index == searchTimestamp
  })

  if (search?.jobs) {
    setJobs(search.jobs)
    setJobMarkers({ jobList: factorInternalJobsForMap(search.jobs), type: layerType.INTERNAL, hasTrainings: !!search?.trainings })
  }

  if (search?.trainings) {
    setTrainings(search.trainings)
    setTrainingMarkers({ trainingList: factorTrainingsForMap(search.trainings) })
  }

  if (search?.formValues) {
    displayContext.setFormValues(search.formValues)
  }
}
