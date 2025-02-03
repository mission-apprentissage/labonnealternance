import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD, oldItemTypeToNewItemType } from "shared/constants/lbaitem"
import { assertUnreachable } from "shared/utils"

import { IContextDisplay } from "@/context/DisplayContextProvider"
import { IContextSearch } from "@/context/SearchResultContextProvider"
import { buildFormValuesFromParameters, getWidgetParameters } from "@/services/config"
import fetchLbaCompanyDetails from "@/services/fetchLbaCompanyDetails"
import fetchLbaJobDetails from "@/services/fetchLbaJobDetails"
import fetchPartnerJobDetails from "@/services/fetchPartnerJobDetails"
import { fetchTrainingDetails } from "@/services/fetchTrainingDetails"
import pushHistory from "@/utils/pushHistory"
import { logError } from "@/utils/tools"

import {
  computeMissingPositionAndDistance,
  factorInternalJobsForMap,
  factorTrainingsForMap,
  flyToMarker,
  layerType,
  setJobMarkers,
  setSelectedMarker,
  setTrainingMarkers,
} from "../../../utils/mapTools"

import { storeSearchResultInContext } from "./handleSearchHistoryContext"
import { searchForJobsFunction, searchForJobsLightFunction } from "./searchForJobs"
import { searchForTrainingsLightFunction } from "./searchForTrainings"
import { notFoundErrorText, trainingErrorText } from "./utils"

export const loadItem = async ({
  item,
  setIsFormVisible,
  setCurrentPage,
  setTrainingSearchError,
  setIsTrainingSearchLoading,
  setIsJobSearchLoading,
  setJobSearchError,
  searchResultContext,
  router,
  scopeContext,
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
    } else {
      const results = {
        peJobs: null,
        lbaCompanies: null,
        matchas: null,
        partnerJobs: null,
      }

      try {
        switch (item.type) {
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

        setJobMarkers({ jobList: factorInternalJobsForMap(results), type: layerType.INTERNAL, hasTrainings: false })

        setSelectedItem(loadedItem)
        setSelectedMarker(loadedItem)
        storeSearchResultInContext({ searchResultContext, results: { jobs: results }, searchTimestamp })
        itemMarker = loadedItem
      } catch (directElementLoadError) {
        setJobSearchError(notFoundErrorText)
      }
    }

    if (itemMarker) {
      flyToMarker(itemMarker, 12)
    }
    setCurrentPage("fiche")

    pushHistory({
      router,
      scopeContext,
      item: loadedItem,
      page: "fiche",
      display: "list",
      searchParameters: null,
      searchTimestamp,
      isReplace: true,
      displayMap,
    })
  } catch (err) {
    console.error(`Erreur interne lors du chargement d'un élément (${err.response ? err.response.status : ""} : ${err?.response?.data ? err.response.data.error : ""})`)
    logError("Training search error", err)
    setTrainingSearchError(trainingErrorText)
  }

  setIsTrainingSearchLoading(false)
  setIsJobSearchLoading(false)
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
