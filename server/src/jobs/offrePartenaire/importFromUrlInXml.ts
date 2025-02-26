import axios from "axios"
import { CollectionName } from "shared/models/models"

import { importFromStreamInXml } from "./importFromStreamInXml"

export const importFromUrlInXml = async ({
  url,
  destinationCollection,
  offerXmlTag,
  partnerLabel,
}: {
  url: string
  destinationCollection: CollectionName
  offerXmlTag: string
  partnerLabel: string
}) => {
  const response = await axios.get(url, {
    responseType: "stream",
  })
  const stream = response.data

  console.log("????")

  return importFromStreamInXml({ destinationCollection, offerXmlTag, stream, partnerLabel })
}
