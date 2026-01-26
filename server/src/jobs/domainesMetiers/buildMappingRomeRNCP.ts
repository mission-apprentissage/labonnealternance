import { ObjectId } from "mongodb"
import { ensureInitialization } from "@/common/utils/mongodbUtils"

export async function buildMappingRomeRNCP() {
  const results = await ensureInitialization()
    .db()
    .collection("fiches_rncp")
    .aggregate([
      {
        $project: {
          codeRomes: "$FICHE.CODES_ROME.ROME.CODE",
          codeRncp: "$FICHE.NUMERO_FICHE",
          intituleRncp: "$FICHE.INTITULE",
        },
      },
    ])
    .toArray()

  const romeToRncpMapping: Record<string, { code: string; intitule: string }[]> = {}
  results.forEach((document) => {
    const { codeRncp, codeRomes, intituleRncp } = document as { codeRncp: string; codeRomes: string[] | string; intituleRncp: string }
    if (!codeRomes) {
      return
    }
    const romeArray = typeof codeRomes === "string" ? [codeRomes] : codeRomes
    romeArray.forEach((codeRome) => {
      let rncps = romeToRncpMapping[codeRome]
      if (!rncps) {
        rncps = []
        romeToRncpMapping[codeRome] = rncps
      }
      rncps.push({
        code: codeRncp,
        intitule: intituleRncp,
      })
    })
  })
  const now = new Date()
  const docToInserts = Object.entries(romeToRncpMapping).map(([rome, rncps]) => {
    return {
      _id: new ObjectId(),
      created_at: now,
      rome,
      rncps,
    }
  })

  await ensureInitialization().db().collection("rome_to_rncp").deleteMany({})
  await ensureInitialization().db().collection("rome_to_rncp").insertMany(docToInserts)
}
