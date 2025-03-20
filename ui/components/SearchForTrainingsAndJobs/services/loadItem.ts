import { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD, oldItemTypeToNewItemType } from "shared/constants/lbaitem"
import { assertUnreachable } from "shared/utils/index"

import { IContextSearch } from "@/context/SearchResultContextProvider"
import fetchLbaCompanyDetails from "@/services/fetchLbaCompanyDetails"
import fetchLbaJobDetails from "@/services/fetchLbaJobDetails"
import fetchPartnerJobDetails from "@/services/fetchPartnerJobDetails"
import { fetchTrainingDetails } from "@/services/fetchTrainingDetails"

export const fetchJobItemDetails = async ({
  id,
  type,
  searchResultContext,
}: {
  id: string
  type: LBA_ITEM_TYPE
  searchResultContext: IContextSearch
}): Promise<ILbaItemLbaCompanyJson | ILbaItemLbaJobJson | ILbaItemPartnerJobJson> => {
  if (
    searchResultContext?.selectedItem?.id === id &&
    oldItemTypeToNewItemType(searchResultContext.selectedItem.ideaType) === type &&
    searchResultContext.selectedItem.detailsLoaded
  ) {
    return searchResultContext.selectedItem as ILbaItemLbaCompanyJson | ILbaItemLbaJobJson | ILbaItemPartnerJobJson
  }

  switch (type) {
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA: {
      const lbaJob = await fetchLbaJobDetails({ id })
      return lbaJob
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
