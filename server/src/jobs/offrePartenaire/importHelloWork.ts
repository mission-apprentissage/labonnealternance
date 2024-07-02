import { PassThrough, pipeline } from "node:stream"

import axios from "axios"
import { ObjectId } from "bson"
import * as xml2j from "xml2js"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const xmlParser = new xml2j.Parser({ explicitArray: false, emptyTag: null })
const offerNodeName = "country"
const openingTag = `<${offerNodeName}`
const closingTag = `</${offerNodeName}>`

const offerHandler = async (offerXml: string, now: Date) => {
  logger.info("parsing offer")
  const json = await xmlParser.parseStringPromise(offerXml)
  await getDbCollection("raw_hellowork").insertOne({ ...json, _id: new ObjectId(), createdAt: now })
}

export const importHelloWork = async () => {
  logger.info("deleting old data")
  await getDbCollection("raw_hellowork").deleteMany({})

  logger.info("import starting...")

  const now = new Date()
  const url = "https://aiweb.cs.washington.edu/research/projects/xmltk/xmldata/data/mondial/mondial-3.0.xml"
  const response = await axios.get(url, {
    responseType: "stream",
  })

  let currentOffer = ""
  let offerInsertCount = 0

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
        await offerHandler(openingTag + currentOffer + closingTag, now)
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
    pipeline(response.data, xmlToJsonTransform, (err) => {
      logger.info(`${offerInsertCount} offers inserted`)
      if (err) {
        logger.error("Pipeline failed.", err)
        reject(err)
      } else {
        logger.info("Pipeline succeeded.")
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
