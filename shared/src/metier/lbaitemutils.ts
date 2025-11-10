import type { LBA_ITEM_TYPE } from "../constants/lbaitem.js"
import { toKebabCase } from "../utils/stringUtils.js"

export const buildJobUrl = (type: LBA_ITEM_TYPE, id: string, title?: string | undefined) => {
  title = title || "offre"
  return `/emploi/${type}/${encodeURIComponent(id)}/${toKebabCase(title)}`
}

export const buildTrainingUrl = (id: string, title: string) => {
  return `/formation/${encodeURIComponent(id)}/${toKebabCase(title)}`
}

export const getDirectJobPath = buildJobUrl
