import { pick } from "lodash-es"
import { logger } from "../../../common/logger.js"
import { Formulaire, User } from "../../../common/model/index.js"
import { runScript } from "../../scriptWrapper.js"

const updateFormulaire = async () => {
  // update record using MongoDB API to avoid timestamp automatic update
  await Formulaire.collection.updateMany({}, { $unset: { events: "", mailing: "", "offres.relance_mail_sent": "" } })
  /**
   * To be clarified before further work on rome_detail field
   */
  // await Formulaire.collection.find({ offres: { $exists: true } }).forEach(async (formulaire) => {
  //   formulaire.offres.forEach((offre) => {
  //     if (offre.rome_detail) {
  //       offre.rome_detail = pick(offre.rome_detail, ["definition", "competencesDeBase", "libelle", "appellation"]);
  //     }
  //   });
  //   // update record using MongoDB API to avoid timestamp automatic update
  //   await Formulaire.collection.update({ _id: formulaire._id }, formulaire);
  // });
}

const updateUser = async () => {
  // update record using MongoDB API to avoid timestamp automatic update
  await User.collection.updateMany({}, { $unset: { username: "", mail_sent: "" } })
}

const format = (stat) => pick(stat, ["ns", "size", "count"])
const getStat = async (db) => {
  const stat = await db.collection.stats({ scale: 1024 })
  return format(stat)
}

runScript(async () => {
  logger.info("Before :")
  console.log(await getStat(Formulaire))
  console.log(await getStat(User))
  await updateFormulaire()
  await updateUser()
  logger.info("———————————————")
  logger.info("After :")
  console.log(await getStat(Formulaire))
  console.log(await getStat(User))
})
