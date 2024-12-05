import { removeAccents } from "shared"

import { asyncForEach } from "../../common/utils/asyncUtils"
import { getDbCollection } from "../../common/utils/mongodbUtils"

export const updateReferentielRomeForJobSearch = async () => {
  const referentielRome = await getDbCollection("referentielromes").find({}).toArray()

  await asyncForEach(referentielRome, async (rome) => {
    const appellationSet = rome.appellations.flatMap(({ libelle }) => libelle.toLowerCase().split(/[\s,/;]+/))
    const searchField = {
      couple_appellation_rome: rome.appellations.map((appellation) => ({ code_rome: rome.rome.code_rome, intitule: rome.rome.intitule, appellation: appellation.libelle })),
      appellations_romes_sans_accent_computed: [...new Set(appellationSet.map(removeAccents))].join(", "),
    }
    await getDbCollection("referentielromes").updateOne({ _id: rome._id }, { $set: searchField })
  })
}
