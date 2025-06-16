import { Transform, Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

import type { AnyBulkWriteOperation } from "mongodb"
import { IFTJobRaw } from "shared"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import config from "@/config"
import { ZChatCompletionResponse } from "@/services/openai/openai.service"

import { logger } from "../../../common/logger"
import { notifyToSlack } from "../../../common/utils/slackUtils"
import { Message, sendMistralMessages } from "../../../services/mistralai/mistralai.service"

export const checkFTOffer = async (data: any): Promise<any> => {
  const messages: Message[] = [
    {
      role: "system",
      content: `En tant qu'expert d'analyse semantique dans le domaine des offres d'emplois en Alternance et en apprentissage, j'ai besoin que tu classifie des offres d'emplois en fonction de qui a posté l'offre.
       Ce qui me permettra de trier les offres pour les étudiants.
       Les CFA (centre de formations en apprentissage) postent des offres pour le compte d'autre entreprise.
       J'ai besoin de savoir si une offre est une offre postée par un CFA pour le compte d'une entreprise ou si l'offre est postée directement par l'entreprise elle même.
       Il se peut que les offres postées le soient par des plateformes d'interim, l'offre est donc de type entreprise.

       Il se peut que l'offre soit postée par une entreprise mais qu'un CFA soit liée à cette offre, par exemple: Cette offre est liée au CFA "Nom du CFA". Dans ce cas l'offre est de type entreprise avec CFA.

Je vais te donner les informations de l'offres au format JSON.

Une fois que tu as déterminé si les offres sont de type CFA, Entreprise ou Entreprise_CFA tu répondras au format JSON:
{offres: [{
  type: "cfa" | "entreprise" | "entreprise_cfa", // conserve bien la casse du type retourné ici
  id: "ID",
  cfa: "Nom du CFA" // si l'offre est de type entreprise_cfa ou cfa
  },
  ...
    ]}

    Assure-toi de retourner une structure JSON valide

    ## Below some examples of the data already classified
    ${JSON.stringify(data.examples)}
  `,
    },
    {
      role: "user",
      content: `
Voici plusierus offres: ${JSON.stringify({ offres: data.offres })}.
Une fois que tu as déterminé si les offres sont de type CFA, Entreprise ou Entreprise_CFA tu répondras au format JSON:
{offres: [{
  type: "cfa" | "entreprise" | "entreprise_cfa", // conserve bien la casse du type ici
  id: "ID",
   cfa: "Nom du CFA" // si l'offre est de type entreprise_cfa ou cfa
  },
  ...
    ]}
`,
    },
  ]
  try {
    const response = await sendMistralMessages({
      messages,
      randomSeed: 45555,
    })
    if (!response) {
      return null
    }
    const { data, error } = ZChatCompletionResponse.safeParse(JSON.parse(response))
    if (error) {
      throw new Error(`Invalid response format: ${JSON.stringify(error, null, 2)}`)
    }
    return data
  } catch (error) {
    console.error(error)
  }
}

function mapDocument(rawFTDocuments: IFTJobRaw[]) {
  const offres = rawFTDocuments.map((doc) => ({
    id: doc.id,
    description: doc.description,
    entreprise: doc.entreprise,
    appellationlibelle: doc.appellationlibelle,
    intitule: doc.intitule,
    ...(doc._metadata?.openai?.type ? { type: doc._metadata?.openai?.type } : {}),
  }))
  return offres
}

export const classifyFranceTravailJobs = async () => {
  if (config.env !== "production") return

  const rawFTDocumentsVerified = await getDbCollection("raw_francetravail")
    .find({ "_metadata.openai.human_verification": { $exists: true } })
    .limit(40)
    .toArray()

  const examples = mapDocument(rawFTDocumentsVerified)
  const queryFilter = { "_metadata.openai.type": { $exists: false } }

  const count = await getDbCollection("raw_francetravail").countDocuments(queryFilter)
  logger.info(`Classification de ${count} jobs depuis raw_francetravail`)

  const cursor = getDbCollection("raw_francetravail").find(queryFilter).stream()

  const batchSize = 10
  let buffer: IFTJobRaw[] = []

  const groupStream = new Transform({
    objectMode: true,
    transform(chunk, _encoding, callback) {
      buffer.push(chunk)
      if (buffer.length >= batchSize) {
        this.push(buffer)
        buffer = []
      }
      callback()
    },
    flush(callback) {
      if (buffer.length > 0) {
        this.push(buffer)
      }
      callback()
    },
  })

  const classifyStream = new Writable({
    objectMode: true,
    async write(documents: IFTJobRaw[], _encoding, callback) {
      try {
        const offres = mapDocument(documents)
        const response = await checkFTOffer({ offres, examples })

        const ops: AnyBulkWriteOperation<IFTJobRaw>[] = response.offres.map((rsp) => ({
          updateOne: {
            filter: { id: rsp.id as string },
            update: {
              $set: {
                "_metadata.openai.type": rsp.type.toLowerCase(),
                ...(rsp.cfa ? { "_metadata.openai.cfa": rsp.cfa } : {}),
              },
            },
          },
        }))

        if (ops.length > 0) {
          await getDbCollection("raw_francetravail").bulkWrite(ops, { ordered: false })
        }

        callback()
      } catch (err: any) {
        logger.error("Erreur de classification d’un batch France Travail", err)
        callback(err)
      }
    },
  })

  await pipeline(cursor, groupStream, classifyStream)

  await notifyToSlack({
    subject: "Classification des offres France Travail",
    message: `Classification de ${count} terminées`,
  })

  logger.info(`Classification terminée`)
}
