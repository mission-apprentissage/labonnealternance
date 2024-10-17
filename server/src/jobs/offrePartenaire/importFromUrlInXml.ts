import axios from "axios"
import { CollectionName } from "shared/models/models"

import { importFromStreamInXml } from "./importFromStreamInXml"

export const importFromUrlInXml = async ({ url, destinationCollection, offerXmlTag }: { url: string; destinationCollection: CollectionName; offerXmlTag: string }) => {
  const response = await axios.get(url, {
    responseType: "stream",
  })
  const stream = response.data

  return importFromStreamInXml({ destinationCollection, offerXmlTag, stream })
}
