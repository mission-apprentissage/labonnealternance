import { asyncForEach } from "../common/utils/asyncUtils"
import { getDbCollection } from "../common/utils/mongodbUtils"

export const up = async () => {
  const referentielRome = await getDbCollection("referentielromes").find({}).toArray()

  await asyncForEach(referentielRome, async (rome) => {
    const searchField = {
      couple_appellation_rome: rome.appellations.map((appellation) => ({ code_rome: rome.rome.code_rome, intitule: rome.rome.intitule, appellation: appellation.libelle })),
    }
    await getDbCollection("referentielromes").updateOne({ _id: rome._id }, { $set: searchField })
  })
}
