// @ts-nocheck
import { logger } from "../../../../common/logger"
import { Recruiter, UserRecruteur } from "../../../../common/model/index"
import { asyncForEach } from "../../../../common/utils/asyncUtils"
import { runScript } from "../../../scriptWrapper"

runScript(async () => {
  const entreprises = await UserRecruteur.find({ type: "ENTREPRISE", opco: { $exists: false } }).lean()

  logger.info(`${entreprises.length} etp à mettre à jour...`)

  await asyncForEach(entreprises, async (etp) => {
    const form = await Recruiter.findOne({ establishment_siret: etp.establishment_siret })

    if (form?.opco) {
      // logger.info(`updating ${etp.siret} : opco: ${form.opco} — idcc: ${form.idcc} `);

      // update record using MongoDB API to avoid timestamp automatic update
      await User.collection.findOneAndUpdate({ _id: etp._id }, { $set: { opco: form.opco, idcc: form.idcc } })
    }
  })
})
