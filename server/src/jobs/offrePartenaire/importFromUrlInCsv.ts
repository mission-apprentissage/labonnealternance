import axios from "axios"
import { CollectionName } from "shared/models/models"

import { importFromStreamInCsv } from "./importFromStreamInCsv"

export const importFromUrlInCsv = async ({
  url,
  destinationCollection,
  partnerLabel,
  parseOptions = {},
}: {
  url: string
  destinationCollection: CollectionName
  partnerLabel: string
  parseOptions?: { [key: string]: any }
}) => {
  const response = await axios.get(url, {
    responseType: "stream",
  })
  const stream = response.data

  return importFromStreamInCsv({ destinationCollection, stream, partnerLabel, parseOptions })
}
