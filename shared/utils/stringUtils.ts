import { kebabCase } from "change-case"

import { LBA_ITEM_TYPE } from "../constants/lbaitem.js"

export const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
export const removeRegexChars = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "")

export const joinNonNullStrings = (values: (string | null | undefined)[]): string | null => {
  const result = values.flatMap((item) => (item && item.trim() ? [item.trim()] : [])).join(" ")
  return result || null
}

// cf https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
export const hashcode = (str: string) => {
  let hash = 0
  if (str.length === 0) return hash
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

export const buildJobUrl = (type: LBA_ITEM_TYPE, id: string, title: string) => {
  return `/emploi/${type}/${encodeURIComponent(id)}/${kebabCase(title)}`
}

export const buildTrainingUrl = (id: string, title: string) => {
  return `/formation/${encodeURIComponent(id)}/${kebabCase(title)}`
}

// TODO: ajuster de sorte à n'avoir que des appels avec jobTitle
export const getDirectJobPath = (jobId: string, jobTitle = "offre") => buildJobUrl(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, jobId, jobTitle)
