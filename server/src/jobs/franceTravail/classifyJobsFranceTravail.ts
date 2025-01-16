import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sendMessages } from "@/services/openai/openai.service"

// ): Promise<{
//   type: string
//   name: string
// }> => {
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
  tauxConfiance:
  },
  ...
    ]}
  `,
    },
    {
      role: "user",
      content: `
Voici plusierus offres: ${JSON.stringify(data)}.
Une fois que tu as déterminé si les offres sont de type CFA, Entreprise ou Entreprise_CFA tu répondras au format JSON:
{offres: [{
  type: "CFA" | "entreprise" | "entreprise_CFA",
  id: "ID",
  tauxConfiance:
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

export const classifyFranceTravailJobs = async () => {
  const rawFTDocuments = await getDbCollection("raw_francetravail")
    .find({ _metadata: { $exists: false } })
    .toArray()
  // for (const { _id, createdAd, ...rawFtJob } of rawFTDocuments) {
  //   const response = await checkFTOffer({ description: rawFtJob.description, entreprise: rawFtJob.entreprise, appellationlibelle: rawFtJob.appellationlibelle })
  //   await getDbCollection("raw_francetravail").findOneAndUpdate(
  //     { id: rawFtJob.id as string },
  //     {
  //       $set: {
  //         "_metadata.classification": response.type,
  //       },
  //     }
  //   )
  // }

  // loop through all rawFTDocuments by chunks of 100
  const chunkSize = 10
  const totalChunks = Math.ceil(rawFTDocuments.length / chunkSize)
  for (let i = 0; i < totalChunks; i++) {
    const chunk = rawFTDocuments.slice(i * chunkSize, (i + 1) * chunkSize)
    const offres = chunk.map((doc) => ({
      id: doc.id,
      description: doc.description,
      entreprise: doc.entreprise,
      // appellationlibelle: doc.appellationlibelle,
    }))
    const response = await checkFTOffer({ offres })
    console.log(response.offres)
    for (const rsp of response.offres) {
      await getDbCollection("raw_francetravail").findOneAndUpdate(
        { id: rsp.id as string },
        {
          $set: {
            "_metadata.classification": rsp.type === "Entreprise_CFA" ? "entreprise_CFA" : rsp.type,
            "_metadata.tauxConfiance": rsp.tauxConfiance,
          },
        }
      )
    }
  }
}
