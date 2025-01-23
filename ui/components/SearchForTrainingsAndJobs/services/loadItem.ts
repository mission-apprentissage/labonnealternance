import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD, oldItemTypeToNewItemType } from "shared/constants/lbaitem"
import { assertUnreachable } from "shared/utils"

import { IContextSearch } from "@/context/SearchResultContextProvider"
import fetchFtJobDetails from "@/services/fetchFtJobDetails"
import fetchLbaCompanyDetails from "@/services/fetchLbaCompanyDetails"
import fetchLbaJobDetails from "@/services/fetchLbaJobDetails"
import fetchPartnerJobDetails from "@/services/fetchPartnerJobDetails"
import { fetchTrainingDetails } from "@/services/fetchTrainingDetails"
import pushHistory from "@/utils/pushHistory"

import {
  flyToMarker,
  layerType,
  setSelectedMarker,
  setTrainingMarkers,
  computeMissingPositionAndDistance,
  factorTrainingsForMap,
  setJobMarkers,
  factorPartnerJobsForMap,
  factorInternalJobsForMap,
} from "../../../utils/mapTools"
import { logError } from "../../../utils/tools"

import { storeSearchResultInContext } from "./handleSearchHistoryContext"
import { searchForJobsFunction, searchForPartnerJobsFunction } from "./searchForJobs"
import { notFoundErrorText, partialJobSearchErrorText, trainingErrorText } from "./utils"

export const loadItem = async ({
  item,
  setIsFormVisible,
  setCurrentPage,
  setTrainingSearchError,
  setIsTrainingSearchLoading,
  setIsJobSearchLoading,
  setIsPartnerJobSearchLoading,
  setJobSearchError,
  setPartnerJobSearchError,
  searchResultContext,
  router,
  displayMap,
}) => {
  try {
    const { setHasSearch, setTrainings, setSelectedItem, setJobs } = searchResultContext

    setHasSearch(true)
    setIsFormVisible(false)

    let itemMarker = null

    const searchTimestamp = new Date().getTime()

    let loadedItem = null

    if (item.type === "training") {
      loadedItem = await fetchTrainingDetails({ id: item.itemId })

      setTrainings([loadedItem])
      storeSearchResultInContext({ searchResultContext, results: { trainings: [loadedItem] }, searchTimestamp })
      setTrainingMarkers({ trainingList: factorTrainingsForMap([loadedItem]) })
      setSelectedItem(loadedItem)
      setSelectedMarker(loadedItem)
      itemMarker = loadedItem

      // lancement d'une recherche d'emploi autour de la formation chargée
      const values = {
        job: {
          romes: itemMarker.romes.map((rome) => rome.code),
        },
        location: {
          value: {
            coordinates: [itemMarker.place.longitude, itemMarker.place.latitude],
          },
          type: "Point",
        },
        radius: 30,
        diploma: "",
      }

      searchForJobsFunction({
        values,
        searchTimestamp,
        setIsJobSearchLoading,
        scopeContext: {
          isTraining: true,
          isJob: true,
        },
        setJobSearchError,
        searchResultContext,
      })

      searchForPartnerJobsFunction({
        values,
        searchTimestamp,
        setIsPartnerJobSearchLoading,
        scopeContext: {
          isTraining: true,
          isJob: true,
        },
        setPartnerJobSearchError,
        computeMissingPositionAndDistance,
        searchResultContext,
      })
    } else {
      const results = {
        peJobs: null,
        lbaCompanies: null,
        matchas: null,
        partnerJobs: null,
      }

      try {
        switch (item.type) {
          case LBA_ITEM_TYPE_OLD.PEJOB: {
            const ftJob = await fetchFtJobDetails({ id: item.itemId })
            const ftJobs = await computeMissingPositionAndDistance(null, [ftJob])
            results.peJobs = ftJobs
            loadedItem = ftJobs[0]
            break
          }
          case LBA_ITEM_TYPE_OLD.MATCHA: {
            const lbaJob = await fetchLbaJobDetails({ id: item.itemId })
            const lbaJobs = await computeMissingPositionAndDistance(null, [lbaJob])
            results.matchas = lbaJobs
            loadedItem = lbaJobs[0]
            break
          }
          case LBA_ITEM_TYPE_OLD.LBA: {
            const lbaCompany = await fetchLbaCompanyDetails({ id: item.itemId })
            results.lbaCompanies = [lbaCompany]
            loadedItem = lbaCompany
            break
          }
          case LBA_ITEM_TYPE_OLD.PARTNER_JOB: {
            const partnerJob = await fetchPartnerJobDetails({ id: item.itemId })
            results.partnerJobs = [partnerJob]
            loadedItem = partnerJob
            break
          }
          default: {
            assertUnreachable("should not happen" as never)
          }
        }

        setJobs(results)

        setHasSearch(true)

        if (item.type === LBA_ITEM_TYPE_OLD.PEJOB) {
          setJobMarkers({ jobList: factorPartnerJobsForMap(results), type: layerType.PARTNER, hasTrainings: false })
        } else {
          setJobMarkers({ jobList: factorInternalJobsForMap(results), type: layerType.INTERNAL, hasTrainings: false })
        }

        setSelectedItem(loadedItem)
        setSelectedMarker(loadedItem)
        storeSearchResultInContext({ searchResultContext, results: { jobs: results }, searchTimestamp })
        itemMarker = loadedItem
      } catch (directElementLoadError) {
        setJobSearchError(directElementLoadError.isNotFoundError() ? notFoundErrorText : partialJobSearchErrorText)
      }
    }

    if (itemMarker) {
      flyToMarker(itemMarker, 12)
    }
    setCurrentPage("fiche")

    pushHistory({
      router,
      item: loadedItem,
      page: "fiche",
      display: "list",
      searchParameters: null,
      searchTimestamp,
      isReplace: true,
      displayMap,
      path: router.pathname,
    })
  } catch (err) {
    console.error(`Erreur interne lors du chargement d'un élément (${err.response ? err.response.status : ""} : ${err?.response?.data ? err.response.data.error : ""})`)
    logError("Training search error", err)
    setTrainingSearchError(trainingErrorText)
  }

  setIsTrainingSearchLoading(false)
  setIsJobSearchLoading(false)
  setIsPartnerJobSearchLoading(false)
  return
}

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
    console.log("DOES IT HAPPEN")
    return searchResultContext.selectedItem
  } else {
    console.log("HAPPEN PAS ", searchResultContext?.selectedItem?.id, searchResultContext?.selectedItem?.ideaType, searchResultContext?.selectedItem)
  }

  const training = await fetchTrainingDetails({ id })

  if (!training) {
    throw new Error("not_found")
  }

  return training
}

// export const fetchJobsAndTrainings = async ({ router, id, type, searchResultContext, searchParams, setHasError }) => {
//   console.log("SEARCHPARAMS fetchJobsAndTrainings : ", searchParams, router.query)

//   const loadItem = true

//   if (searchParams) {
//   }

//   const jobResults = {
//     peJobs: null,
//     lbaCompanies: null,
//     matchas: null,
//     partnerJobs: null,
//   }
//   const trainingResults = []
//   let loadedItem = null

//   if (loadItem) {
//     switch (type) {
//       case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA: {
//         const lbaJob = await fetchLbaJobDetails({ id })
//         const lbaJobs = await computeMissingPositionAndDistance(null, [lbaJob])
//         jobResults.matchas = lbaJobs
//         loadedItem = lbaJobs[0]
//         break
//       }
//       case LBA_ITEM_TYPE.RECRUTEURS_LBA: {
//         const lbaCompany = await fetchLbaCompanyDetails({ id })
//         jobResults.lbaCompanies = [lbaCompany]
//         loadedItem = lbaCompany
//         break
//       }
//       case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES: {
//         const partnerJob = await fetchPartnerJobDetails({ id })
//         jobResults.partnerJobs = [partnerJob]
//         loadedItem = partnerJob
//         break
//       }
//       case LBA_ITEM_TYPE.FORMATION: {
//         const loadedItem = await fetchTrainingDetails({ id })
//         jobResults.partnerJobs = [loadedItem]
//         break
//       }

//       default: {
//         assertUnreachable(type)
//       }
//     }
//   }

//   searchResultContext.setJobs(jobResults)
//   searchResultContext.setSelectedItem(loadedItem)

//   // const response = await apiGet(trainingsApi, { querystring })

//   // const params: {
//   //     romes?: string
//   //     rncp?: string
//   //     opco?: string
//   //     opcoUrl?: string
//   //     longitude?: number
//   //     latitude?: number
//   //     insee?: string
//   //     radius?: number
//   //     diploma?: string
//   //     sources: string
//   //   } = {
//   //     romes,
//   //     rncp,
//   //     opco: opcoFilter,
//   //     opcoUrl: opcoUrlFilter,
//   //     sources: "lba,matcha,partnerJob",
//   //   }
//   //   if (values?.location?.value) {
//   //     params.longitude = values.location.value.coordinates[0]
//   //     params.latitude = values.location.value.coordinates[1]
//   //     params.insee = values.location.insee
//   //     params.radius = values.radius || 30
//   //   }
//   //   if (values.diploma) {
//   //     params.diploma = values.diploma
//   //   }

//   //   const response = await axios.get(minimalDataJobsApi, {
//   //     params,
//   //   })

//   // setTrainings(response.results)
// }

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
  //searchResultContext.setSelectedItem(data)
  const updatedTrainings = searchResultContext.trainings.map((v) => {
    if (v.id === data.id) {
      data.place.distance = v.place.distance
      return data
    }
    return v
  })
  searchResultContext.setTrainingsAndSelectedItem(updatedTrainings, data)
}

const updateJobAndKeepDistance = (list, job) =>
  list.map((v) => {
    if (v.id === job.id) {
      job.place.distance = v.place.distance
      return job
    }
    return v
  })

export const updateJobContext = ({ searchResultContext, job }: { searchResultContext: IContextSearch; job }) => {
  //searchResultContext.setSelectedItem(data)
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
  searchResultContext.setJobsAndSelectedItem(toUpdateJobs, job)
}
