import { LBA_ITEM_TYPE } from "../constants/lbaitem.js"
import { toKebabCase } from "../utils/stringUtils.js"

export const buildJobUrl = (type: LBA_ITEM_TYPE, id: string, title: string) => {
  return `/emploi/${type}/${encodeURIComponent(id)}/${toKebabCase(title)}`
}

export const buildTrainingUrl = (id: string, title: string) => {
  return `/formation/${encodeURIComponent(id)}/${toKebabCase(title)}`
}

export const getDirectJobPath = (jobId: string, jobTitle = "offre") => buildJobUrl(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, jobId, jobTitle)
