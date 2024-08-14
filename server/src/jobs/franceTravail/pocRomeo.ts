import { IRomeoPayload, getRomeoPredictions } from "../../common/apis/FranceTravail"
import { getDbCollection } from "../../common/utils/mongodbUtils"

type MainObject = {
  contexte: string
  identifiant: string
  intitule: string
  uuidInference: string
  metiersRome: MetierRome[] // Original metiersRome array
  [key: string]: any // Allows adding dynamic keys
}

type MetierRome = {
  codeAppellation: string
  codeRome: string
  libelleAppellation: string
  libelleRome: string
  scorePrediction: number
}

function transformMetiersRomeArray(objects: MainObject[]): MainObject[] {
  return objects.map((object) => {
    const { metiersRome, ...rest } = object

    metiersRome.forEach((metier, index) => {
      const suffix = index + 1 // Start from 1
      for (const [key, value] of Object.entries(metier)) {
        rest[`${key}${suffix}`] = value
      }
    })

    return rest as MainObject
  })
}

export const pocRomeo = async () => {
  const result = (await getDbCollection("raw_hellowork")
    .find({}, { projection: { "job.title": 1, "job.company_sector": 1 } })
    .limit(3)
    .toArray()) as any
  const dataset: IRomeoPayload[] = result.map(
    ({ _id, job }): IRomeoPayload => ({
      intitule: job.title,
      identifiant: _id.toString(),
      contexte: job.company_sector,
    })
  )
  const romeoResult = await getRomeoPredictions(dataset)
  if (!romeoResult) return null
  const formated = transformMetiersRomeArray(romeoResult)
  console.log(formated)
}
