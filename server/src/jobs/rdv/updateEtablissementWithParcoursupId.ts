import { EligibleTrainingsForAppointment } from "../../db/index.js"
import { getFormationsFromCatalogueMe } from "../../services/catalogue.service.js"
import { runScript } from "../scriptWrapper.js"

const getParcoursupId = async () => {
  const formations = await getFormationsFromCatalogueMe({
    query: { parcoursup_id: { $ne: null }, parcoursup_statut: "publié", published: true, catalogue_published: true },
    limit: 1000,
    select: { parcoursup_id: 1 },
  })

  const countBeforeUpdate = await EligibleTrainingsForAppointment.countDocuments({ parcoursup_id: { $eq: null } })

  await Promise.all(
    formations.map(async (formation) => {
      await EligibleTrainingsForAppointment.updateMany({ cle_ministere_educatif: formation.cle_ministere_educatif }, { $set: { parcoursup_id: formation.parcoursup_id } })
    })
  )

  const countAfterUpdate = await EligibleTrainingsForAppointment.countDocuments({ parcoursup_id: { $eq: null } })

  console.log({ before: countBeforeUpdate, after: countAfterUpdate, updated: countBeforeUpdate - countAfterUpdate, totalME: formations.length })
}

runScript(async () => await getParcoursupId())
