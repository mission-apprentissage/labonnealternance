import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sendMessages } from "@/services/openai/openai.service"

export const checkFTOffer = async (data: any): Promise<any> => {
  const messages = [
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
  type: "CFA" | "entreprise" | "entreprise_CFA",
  id: "ID",
  cfa: "Nom du CFA" // si l'offre est de type entreprise_CFA ou CFA
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
  type: "CFA" | "entreprise" | "entreprise_CFA",
  id: "ID",
   cfa: "Nom du CFA" // si l'offre est de type entreprise_CFA ou CFA
  },
  ...
    ]}
`,
    },
  ]
  try {
    const responseStr = await sendMessages({
      messages,
      seed: 45555,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    })
    const response = JSON.parse(responseStr)

    return response
  } catch (error) {
    console.log(error)
  }
}

function mapDocument(rawFTDocuments: any) {
  const offres = rawFTDocuments.map((doc) => ({
    id: doc.id,
    description: doc.description,
    entreprise: doc.entreprise,
    appellationlibelle: doc.appellationlibelle,
    intitule: doc.intitule,
    type: doc._metadata.classification_verification,
  }))
  return offres
}

export const classifyFranceTravailJobs = async () => {
  const rawFTDocumentsVerified = await getDbCollection("raw_francetravail")
    .find({ "_metadata.openai.human_verification": { $exists: true } })
    .toArray()

  const examples = mapDocument(rawFTDocumentsVerified) // get

  const rawFTDocuments = await getDbCollection("raw_francetravail")
    .find({ "_metadata.openai.human_verification": { $exists: false } })
    .toArray()

  // loop through all rawFTDocuments by chunks of 100
  const chunkSize = 10
  const totalChunks = Math.ceil(rawFTDocuments.length / chunkSize)
  for (let i = 0; i < totalChunks; i++) {
    const chunk = rawFTDocuments.slice(i * chunkSize, (i + 1) * chunkSize)
    const offres = chunk.map((doc) => ({
      id: doc.id,
      description: doc.description,
      entreprise: doc.entreprise,
      appellationlibelle: doc.appellationlibelle,
      intitule: doc.intitule,
    }))
    const response = await checkFTOffer({ offres, examples })
    console.log(response.offres)
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
  }
}
