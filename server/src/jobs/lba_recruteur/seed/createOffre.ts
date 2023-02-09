/* eslint-disable */
import { omit } from "lodash-es"
import { logger } from "../../../common/logger.js"
import { Formulaire, Offre } from "../../../common/model/index.js"

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const createOffreCollection = async (application) => {
  logger.info("Deleting offres collections...")
  await Offre.deleteMany({})

  logger.info("Creating offres collections...")
  let formulaires = await Formulaire.find({}).lean()

  await Promise.all(
    formulaires.map(async (form) => {
      await Promise.all(
        form.offres.map(async (offre) => {
          const filtOffre = omit(offre, ["_id"])
          const filtForm = omit(form, ["_id", "offres", "mailing", "events", "statut"])
          filtForm.statutFormulaire = form.statut
          filtOffre.id_offre = offre._id

          await Offre.collection.insertOne({ ...filtOffre, ...filtForm })
          // await delay(300);
        })
      )
    })
  )

  let offres = await Offre.countDocuments()

  return { offres }
}
