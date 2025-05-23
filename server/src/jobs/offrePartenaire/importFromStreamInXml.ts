import { PassThrough, pipeline } from "node:stream"

import { ObjectId } from "mongodb"
import { CollectionName } from "shared/models/models"
import * as xml2j from "xml2js"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import { notifyToSlack } from "../../common/utils/slackUtils"

const xmlParser = new xml2j.Parser({ explicitArray: false, emptyTag: null, trim: true })

const xmlToJson = async (offerXml: string, index: number) => {
  index % 1000 === 0 && logger.info("parsing offer", index)
  const json = await xmlParser.parseStringPromise(offerXml)
  return json
}

export const importFromStreamInXml = async ({
  stream,
  destinationCollection,
  offerXmlTag,
  partnerLabel,
  conflictingOpeningTagWithoutAttributes = false,
}: {
  stream: NodeJS.ReadableStream
  destinationCollection: CollectionName
  offerXmlTag: string
  partnerLabel: string
  conflictingOpeningTagWithoutAttributes?: boolean
}) => {
  logger.info("deleting old data")
  await getDbCollection(destinationCollection).deleteMany({})

  logger.info("import starting...")

  const now = new Date()
  let currentOffer = ""
  let offerInsertCount = 0
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
        offerInsertCount++
        const json = await xmlToJson(openingTag + currentOffer + closingTag, offerInsertCount)
        await getDbCollection(destinationCollection).insertOne({ ...json, _id: new ObjectId(), createdAt: now })
        currentOffer = ""
      }
    }
  }

  const xmlToJsonTransform = new PassThrough({
    transform(chunk, _encoding, callback) {
      readChunk(chunk.toString()).then(() => callback(null, null))
    },
  })
  return new Promise((resolve, reject) => {
    pipeline(stream, xmlToJsonTransform, (err) => {
      logger.info(`${offerInsertCount} offers inserted`)
      if (err) {
        logger.error("Pipeline failed.", err)
        reject(err)
      } else {
        logger.info("Pipeline succeeded.")
        const message = `import ${partnerLabel} terminé : ${offerInsertCount} offres importées`
        logger.info(message)
        notifyToSlack({
          subject: `import des offres ${partnerLabel} dans raw`,
          message,
        })
        resolve({
          offerInsertCount,
        })
      }
    })
  })
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
