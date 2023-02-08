import { getFormationsFromCatalogueMe } from "../../common/catalogue.js"
import { WidgetParameter } from "../../common/model/index.js"
import { runScript } from "../scriptWrapper.js"

const getParcoursupId = async () => {
  const formations = await getFormationsFromCatalogueMe({
    limit: 1000,
    query: { parcoursup_id: { $ne: null }, parcoursup_statut: "publié", published: true, catalogue_published: true },
    select: { parcoursup_id: 1 },
  })

  const countBeforeUpdate = await WidgetParameter.countDocuments({ id_parcoursup: { $eq: null } })

  await Promise.all(
    formations.map(async (formation) => {
      await WidgetParameter.updateMany({ cle_ministere_educatif: formation.cle_ministere_educatif }, { $set: { id_parcoursup: formation.parcoursup_id } })
    })
  )

  const countAfterUpdate = await WidgetParameter.countDocuments({ id_parcoursup: { $eq: null } })

  console.log({ before: countBeforeUpdate, after: countAfterUpdate, updated: countBeforeUpdate - countAfterUpdate, totalME: formations.length })
}

runScript(async () => await getParcoursupId())
