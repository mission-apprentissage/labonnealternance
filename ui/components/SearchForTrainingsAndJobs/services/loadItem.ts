import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD, oldItemTypeToNewItemType } from "shared/constants/lbaitem"
import { assertUnreachable } from "shared/utils"

import { IContextDisplay } from "@/context/DisplayContextProvider"
import { IContextSearch } from "@/context/SearchResultContextProvider"
import { buildFormValuesFromParameters, getWidgetParameters } from "@/services/config"
import fetchLbaCompanyDetails from "@/services/fetchLbaCompanyDetails"
import fetchLbaJobDetails from "@/services/fetchLbaJobDetails"
import fetchPartnerJobDetails from "@/services/fetchPartnerJobDetails"
import { fetchTrainingDetails } from "@/services/fetchTrainingDetails"

import { computeMissingPositionAndDistance } from "../../../utils/mapTools"

import { storeSearchResultInContext } from "./handleSearchHistoryContext"
import { searchForJobsLightFunction } from "./searchForJobs"
import { searchForTrainingsLightFunction } from "./searchForTrainings"

// export const loadItem = async ({
//   item,
//   setIsFormVisible,
//   setCurrentPage,
//   setTrainingSearchError,
//   setIsTrainingSearchLoading,
//   setIsJobSearchLoading,
//   setIsPartnerJobSearchLoading,
//   setJobSearchError,
//   setPartnerJobSearchError,
//   searchResultContext,
//   router,
//   displayMap,
// }) => {
//   try {
//     const { setHasSearch, setTrainings, setSelectedItem, setJobs } = searchResultContext

//     setHasSearch(true)
//     setIsFormVisible(false)

//     let itemMarker = null

//     const searchTimestamp = new Date().getTime()

//     let loadedItem = null

//     if (item.type === "training") {
//       loadedItem = await fetchTrainingDetails({ id: item.itemId })

//       setTrainings([loadedItem])
//       storeSearchResultInContext({ searchResultContext, results: { trainings: [loadedItem] }, searchTimestamp })
//       setTrainingMarkers({ trainingList: factorTrainingsForMap([loadedItem]) })
//       setSelectedItem(loadedItem)
//       setSelectedMarker(loadedItem)
//       itemMarker = loadedItem

//     }

//         if (item.type === LBA_ITEM_TYPE_OLD.PEJOB) {
//           setJobMarkers({ jobList: factorPartnerJobsForMap(results), type: layerType.PARTNER, hasTrainings: false })
//         } else {
//           setJobMarkers({ jobList: factorInternalJobsForMap(results), type: layerType.INTERNAL, hasTrainings: false })
//         }

//         setSelectedMarker(loadedItem)
//         itemMarker = loadedItem

//     if (itemMarker) {
//       flyToMarker(itemMarker, 12)
//     }

export const fetchJobItemDetails = async ({ id, type, searchResultContext }) => {
  if (
    searchResultContext?.selectedItem?.id === id &&
    oldItemTypeToNewItemType(searchResultContext.selectedItem.ideaType) === type &&
    searchResultContext.selectedItem.detailsLoaded
  ) {
    return searchResultContext.selectedItem
  }

  switch (type) {
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA: {
      const lbaJob = await fetchLbaJobDetails({ id })
      const lbaJobs = await computeMissingPositionAndDistance(null, [lbaJob])
      return lbaJobs[0]
      break
    }
    case LBA_ITEM_TYPE.RECRUTEURS_LBA: {
      const lbaCompany = await fetchLbaCompanyDetails({ id })
      return lbaCompany
      break
    }
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES: {
      const partnerJob = await fetchPartnerJobDetails({ id })
      return partnerJob
      break
    }
    default: {
      assertUnreachable(type as never)
    }
  }
}

export const fetchTrainingItemDetails = async ({ id, searchResultContext }) => {
  if (searchResultContext?.selectedItem?.id === id && searchResultContext.selectedItem.ideaType === LBA_ITEM_TYPE.FORMATION && searchResultContext.selectedItem.detailsLoaded) {
    return searchResultContext.selectedItem
  }

  const training = await fetchTrainingDetails({ id })

  if (!training) {
    throw new Error("not_found")
  }

  return training
}

export const shouldFetchItemData = (itemId: string, itemType: LBA_ITEM_TYPE, searchContext: IContextSearch) => {
  if (!itemId) {
    return false
  }
  let itemToFind = null

  switch (itemType) {
    case LBA_ITEM_TYPE.FORMATION: {
      itemToFind = searchContext?.trainings?.find((training) => training.id === itemId)
      break
    }
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA: {
      itemToFind = searchContext?.jobs?.matchas?.find((job) => job.id === itemId)
      break
    }
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES: {
      itemToFind = searchContext?.jobs?.partnerJobs?.find((job) => job.id === itemId)
      break
    }
    case LBA_ITEM_TYPE.RECRUTEURS_LBA: {
      itemToFind = searchContext?.jobs?.lbaCompanies?.find((job) => job.id === itemId)
      break
    }
    default: {
      assertUnreachable(itemType)
    }
  }
  if (itemToFind) {
    if (itemToFind.detailsLoaded) {
      return false
    }
  }

  return true
}

export const updateTrainingContext = (searchResultContext: IContextSearch, data) => {
  const updatedTrainings = searchResultContext.trainings.length
    ? searchResultContext.trainings.map((v) => {
        if (v.id === data.id) {
          data.place.distance = v.place.distance
          return data
        }
        return v
      })
    : [data]
  searchResultContext.setTrainingsAndSelectedItem(updatedTrainings, data)
}

const updateJobAndKeepDistance = (list, job) => {
  if (!list) {
    return [job]
  }

  return list.map((v) => {
    if (v.id === job.id) {
      job.place.distance = v.place.distance
      return job
    }
    return v
  })
}

export const updateJobContext = ({ searchResultContext, job }: { searchResultContext: IContextSearch; job }) => {
  const { peJobs, partnerJobs, lbaCompanies, matchas } = searchResultContext.jobs
  const toUpdateJobs = {
    peJobs,
    partnerJobs,
    lbaCompanies,
    matchas,
  }

  switch (job?.ideaType) {
    case LBA_ITEM_TYPE_OLD.MATCHA: {
      toUpdateJobs.matchas = updateJobAndKeepDistance(toUpdateJobs.matchas, job)
      break
    }
    case LBA_ITEM_TYPE_OLD.PARTNER_JOB: {
      toUpdateJobs.partnerJobs = updateJobAndKeepDistance(toUpdateJobs.partnerJobs, job)
      break
    }
    case LBA_ITEM_TYPE_OLD.LBA: {
      toUpdateJobs.lbaCompanies = updateJobAndKeepDistance(toUpdateJobs.lbaCompanies, job)
      break
    }
    case LBA_ITEM_TYPE_OLD.PEJOB: {
      toUpdateJobs.peJobs = updateJobAndKeepDistance(toUpdateJobs.peJobs, job)
      break
    }
    default: {
      assertUnreachable("shouldNotHappen" as never)
    }
  }
  // @ts-ignore
  searchResultContext.setJobsAndSelectedItem(toUpdateJobs, job)
}

export const initContextFromQueryParameters = ({ searchResultContext, displayContext, item }: { searchResultContext: IContextSearch; displayContext: IContextDisplay; item }) => {
  const searchTimestamp = new Date().getTime()
  const widgetParameters = getWidgetParameters()
  if (widgetParameters?.applyWidgetParameters) {
    if (widgetParameters.applyWidgetParameters) {
      widgetParameters.formValues = buildFormValuesFromParameters(widgetParameters.parameters)
      searchForJobsLightFunction({
        values: widgetParameters.formValues,
        widgetParameters,
        searchResultContext,
        searchTimestamp,
      })
      searchForTrainingsLightFunction({
        values: widgetParameters.formValues,
        widgetParameters,
        searchResultContext,
        searchTimestamp,
      })
      displayContext.setFormValues(widgetParameters.formValues)
    }
  } else if (item.ideaType === LBA_ITEM_TYPE.FORMATION) {
    const values = {
      job: {
        romes: item.romes.map((rome) => rome.code),
      },
      location: {
        value: {
          coordinates: [item.place.longitude, item.place.latitude],
        },
        type: "Point",
      },
      radius: 30,
      diploma: "",
    }

    searchForJobsLightFunction({
      values,
      widgetParameters,
      searchResultContext,
      searchTimestamp,
    })
    storeSearchResultInContext({
      searchResultContext,
      results: { trainings: [item] },
      searchTimestamp,
      formValues: values,
    })
    displayContext.setFormValues(values)
    searchResultContext.setHasSearch(true)
  } else {
    const values = {
      job: {
        romes: item?.romes?.map((rome) => rome.code),
      },
      location: {
        value: {
          coordinates: [item.place.longitude, item.place.latitude],
        },
        type: "Point",
      },
      radius: 30,
      diploma: "",
    }

    const results: {
      jobs: { matchas: any[]; partnerJobs: any[]; lbaCompanies: any[]; peJobs: any[] }
      trainings: any[]
    } = {
      jobs: { matchas: [], partnerJobs: [], lbaCompanies: [], peJobs: [] },
      trainings: [],
    }

    switch (item.ideaType) {
      case LBA_ITEM_TYPE_OLD.MATCHA: {
        results.jobs.matchas = [item]
        break
      }
      case LBA_ITEM_TYPE_OLD.PARTNER_JOB: {
        results.jobs.partnerJobs = [item]
        break
      }
      case LBA_ITEM_TYPE_OLD.LBA: {
        results.jobs.lbaCompanies = [item]
        break
      }
      default: {
        assertUnreachable("shouldNotHappen" as never)
      }
    }
    // @ts-ignore
    storeSearchResultInContext({ searchResultContext, results, searchTimestamp, formValues: values })
    searchResultContext.setHasSearch(true)
  }
}
