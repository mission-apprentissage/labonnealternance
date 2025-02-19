import { groupData, oleoduc, writeData } from "oleoduc"
import { IFTJobRaw } from "shared"

import { getDbCollection } from "@/common/utils/mongodbUtils"

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
      maxTokens: 1024,
    })
    if (!response) {
      return null
    }
    return response
  } catch (error) {
    console.log(error)
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
  const rawFTDocumentsVerified = await getDbCollection("raw_francetravail")
    .find({ "_metadata.openai.human_verification": { $exists: true } })
    .toArray()
  const examples = mapDocument(rawFTDocumentsVerified)
  const queryFilter = { "_metadata.openai.type": { $exists: false } }
  const count = await getDbCollection("raw_francetravail").countDocuments(queryFilter)
  logger.info(`Classification de ${count} jobs depuis raw_francetravail`)

  await oleoduc(
    await getDbCollection("raw_francetravail").find(queryFilter).stream(),
    groupData({ size: 10 }),
    writeData(async (rawFTDocuments: IFTJobRaw[]) => {
      const offres = mapDocument(rawFTDocuments)
      const response = await checkFTOffer({ offres, examples })
      for (const rsp of response.offres) {
        await getDbCollection("raw_francetravail").findOneAndUpdate(
          { id: rsp.id as string },
          {
            $set: {
              "_metadata.openai.type": rsp.type.toLowerCase(),
              ...(rsp.cfa ? { "_metadata.openai.cfa": rsp.cfa } : {}),
            },
          }
        )
      }
    })
  )

  await notifyToSlack({ subject: "Classification des offres France Travail", message: `Classification de ${count} terminées` })

  logger.info(`Classification terminée`)
}
