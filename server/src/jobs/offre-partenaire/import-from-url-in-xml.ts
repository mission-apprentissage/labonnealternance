import { createGunzip } from "node:zlib"
import axios from "axios"
import type { CollectionName } from "shared/models/models"

import { logger } from "@/common/logger"
import { importFromStreamInXml } from "./import-from-stream-in-xml"

// certains partenaires servent un fichier .gz sans header content-encoding : axios ne le décompresse pas, il faut le faire nous-mêmes
export const isGzipPayload = (headers: Record<string, unknown>): boolean => {
  const contentType = String(headers["content-type"] ?? "")
  const contentDisposition = String(headers["content-disposition"] ?? "")
  return /application\/(x-)?gzip/i.test(contentType) || /filename\*?=[^;]*\.gz\b/i.test(contentDisposition)
}

export const gunzipIfNeeded = (stream: NodeJS.ReadableStream, headers: Record<string, unknown>): NodeJS.ReadableStream => {
  if (!isGzipPayload(headers)) {
    return stream
  }
  const gunzip = createGunzip()
  // pipe() ne propage pas les erreurs de la source : sans ça une coupure réseau laisserait le gunzip ouvert indéfiniment
  stream.on("error", (err) => gunzip.destroy(err))
  return stream.pipe(gunzip)
}

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
  const isGzip = isGzipPayload(response.headers)
  logger.info({ partnerLabel, contentType: response.headers["content-type"], isGzip }, "flux téléchargé")
  const stream = gunzipIfNeeded(response.data, response.headers)

  return importFromStreamInXml({ destinationCollection, offerXmlTag, stream, importName: partnerLabel, conflictingOpeningTagWithoutAttributes })
}
