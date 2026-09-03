import { PassThrough, pipeline } from "node:stream"
import Boom, { internal } from "@hapi/boom"
import { ObjectId } from "mongodb"
import type { CollectionName } from "shared/models/models"
import * as xml2j from "xml2js"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"

const XML_PREVIEW_LENGTH = 500
// en dessous de ce ratio par rapport à l'import précédent, l'import passe mais on veut le savoir
const SUSPICIOUS_SHRINK_RATIO = 0.5
const SUSPICIOUS_SHRINK_PERCENT = Math.round((1 - SUSPICIOUS_SHRINK_RATIO) * 100)

function logError(error: any) {
  logger.error(error)
  if (Boom.isBoom(error)) {
    const { data, cause } = error
    if (data) {
      logger.error(data)
    }
    if (cause) {
      logger.error("Caused by:")
      logError(cause)
    }
  }
}

const xmlParser = new xml2j.Parser({ explicitArray: false, emptyTag: null, trim: true })

export const xmlToJson = async (offerXml: string, index: number) => {
  try {
    if (index % 1_000 === 0) logger.info({ index }, "parsing offer")
    offerXml = offerXml.replaceAll("<br>", "<br/>")
    const json = await xmlParser.parseStringPromise(offerXml)
    return json
  } catch (err) {
    const newError = internal(`error while parsing xml`, {
      xmlLength: offerXml?.length ?? 0,
      xmlPreview: offerXml?.substring(0, XML_PREVIEW_LENGTH) ?? "",
    })
    newError.cause = err
    throw newError
  }
}

export const importFromStreamInXml = async ({
  stream,
  destinationCollection,
  offerXmlTag,
  importName,
  conflictingOpeningTagWithoutAttributes = false,
}: {
  stream: NodeJS.ReadableStream
  destinationCollection: CollectionName
  offerXmlTag: string
  importName: string
  conflictingOpeningTagWithoutAttributes?: boolean
}) => {
  logger.info("import starting...")

  // les données précédentes ne sont supprimées qu'une fois l'import confirmé : un flux illisible ne doit pas vider la collection
  const previousCount = await getDbCollection(destinationCollection).countDocuments({})
  const now = new Date()
  let currentOffer = ""
  let offerInsertCount = 0
  let offerErrorCount = 0
  const openingTag = `<${offerXmlTag}${conflictingOpeningTagWithoutAttributes ? ">" : ""}`
  const closingTag = `</${offerXmlTag}>`

  const readChunk = async (str: string) => {
    const stringReader = newStringReader({ str, index: 0 })
    while (!stringReader.isDone()) {
      if (!currentOffer) {
        stringReader.goTo(openingTag)
        stringReader.skip(openingTag)
      }
      const content = stringReader.takeUntil(closingTag)
      currentOffer += content
      const found = stringReader.skip(closingTag)
      if (found) {
        const xmlContent = openingTag + currentOffer + closingTag
        const json = await xmlToJson(xmlContent, offerInsertCount + 1)
        await getDbCollection(destinationCollection).insertOne({ ...json, _id: new ObjectId(), createdAt: now })
        offerInsertCount++
        currentOffer = ""
      }
    }
  }

  // pipeline() détruit le transform sans attendre les insertions en cours : on garde la main dessus pour ne pas nettoyer trop tôt
  let pendingChunk: Promise<unknown> = Promise.resolve()

  const xmlToJsonTransform = new PassThrough({
    async transform(chunkBuffer, _encoding, callback) {
      const chunk = chunkBuffer.toString()
      pendingChunk = readChunk(chunk)
        .then(() => callback(null, null))
        .catch((err) => {
          const newError = internal("error while reading xml chunk", {
            chunkLength: chunk?.length ?? 0,
            chunkPreview: chunk?.substring(0, XML_PREVIEW_LENGTH) ?? "",
          })
          newError.cause = err
          logError(newError)
          sentryCaptureException(newError)

          offerErrorCount++
          currentOffer = ""
          callback(null, null)
        })
    },
  })

  const discardImportedOffers = async () => {
    await pendingChunk.catch(() => {
      // l'erreur du chunk est déjà remontée par le pipeline, on veut seulement que les insertions en cours soient terminées
    })
    const { deletedCount } = await getDbCollection(destinationCollection).deleteMany({ createdAt: now })
    logger.info({ deletedCount, previousCount }, `import ${importName} annulé : les données précédentes sont conservées`)
  }

  try {
    await new Promise<void>((resolve, reject) => {
      pipeline(stream, xmlToJsonTransform, (err) => (err ? reject(err) : resolve()))
    })
  } catch (err) {
    logger.error(err, "Pipeline failed.")
    await discardImportedOffers()
    throw err
  }

  logger.info(`${offerInsertCount} offers inserted`)

  if (offerInsertCount === 0) {
    await discardImportedOffers()
    throw internal(`import ${importName} : aucune offre importée`, { destinationCollection, previousCount, offerErrorCount })
  }

  const { deletedCount } = await getDbCollection(destinationCollection).deleteMany({ createdAt: { $ne: now } })
  logger.info({ deletedCount }, "deleted old data")

  if (previousCount > 0 && offerInsertCount < previousCount * SUSPICIOUS_SHRINK_RATIO) {
    const shrinkError = internal(`import ${importName} : le nombre d'offres a chuté de plus de ${SUSPICIOUS_SHRINK_PERCENT}% par rapport à l'import précédent`, {
      destinationCollection,
      previousCount,
      offerInsertCount,
    })
    logError(shrinkError)
    sentryCaptureException(shrinkError)
  }

  logger.info("Pipeline succeeded.")
  logger.info(`import ${importName} terminé : ${offerInsertCount} offres importées. ${offerErrorCount} offres en erreur.`)
  return {
    offerInsertCount,
    offerErrorCount,
  }
}

const newStringReader = (stringHead: { str: string; index: number }) => ({
  isDone() {
    return stringHead.index >= stringHead.str.length
  },
  goTo(part: string) {
    this.takeUntil(part)
  },
  skip(part: string) {
    if (stringHead.str.substring(stringHead.index, stringHead.index + part.length) === part) {
      stringHead.index += part.length
      return true
    } else {
      return false
    }
  },
  takeUntil(part: string) {
    const rightString = stringHead.str.substring(stringHead.index)
    const index = rightString.indexOf(part)
    if (index === -1) {
      stringHead.index = stringHead.str.length
      return rightString
    } else {
      const taken = rightString.substring(0, index)
      stringHead.index += index
      return taken
    }
  },
})
