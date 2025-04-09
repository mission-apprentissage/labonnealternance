import axios from "axios"
import { CollectionName } from "shared/models/models"

import { importFromStreamInXml } from "./importFromStreamInXml"

export const importFromUrlInXml = async ({
  url,
  destinationCollection,
  offerXmlTag,
  partnerLabel,
  conflictingOpeningTagWithoutAttributes = false, // ex : si la source est <xml><jobs><job>...</job>...</jobs><xml> et que le tag est job il faut mettre true
}: {
  url: string
  destinationCollection: CollectionName
  offerXmlTag: string
  partnerLabel: string
  conflictingOpeningTagWithoutAttributes?: boolean
}) => {
  const response = await axios.get(url, {
    responseType: "stream",
  })
  const stream = response.data

  return importFromStreamInXml({ destinationCollection, offerXmlTag, stream, partnerLabel, conflictingOpeningTagWithoutAttributes })
}
