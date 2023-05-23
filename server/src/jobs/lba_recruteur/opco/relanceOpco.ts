import { mailTemplate } from "../../../assets/index.js"
import { etat_utilisateur } from "../../../common/constants.js"
import { UserRecruteur } from "../../../common/model/index.js"
import { IUserRecruteur } from "../../../common/model/schema/userRecruteur/userRecruteur.types.js"
import { asyncForEach } from "../../../common/utils/asyncUtils.js"
import config from "../../../config.js"

/**
 * @description send mail to ocpo with awaiting validation user number
 * @param {*} mailer component
 * @returns {}
 */
export const relanceOpco = async (mailer) => {
  const userAwaitingValidation = await UserRecruteur.find({
    $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, etat_utilisateur.ATTENTE] },
    opco: { $nin: [null, "Opco multiple", "inconnu"] },
  }).lean()

  // Cancel the job if there's no users awaiting validation
  if (!userAwaitingValidation.length) return

  // count user to validate per opco
  const userList = userAwaitingValidation.reduce((acc, user) => {
    if (user.opco in acc) {
      acc[user.opco]++
    } else {
      acc[user.opco] = 1
    }
    return acc
  }, {})

  for (const opco in userList) {
    // Get related user to send the email
    const users = await UserRecruteur.find({ scope: opco, type: "OPCO" })

    await asyncForEach(users, async (user: IUserRecruteur) => {
      // send mail to recipient
      await mailer.sendEmail({
        to: user.email,
        subject: "La bonne alternance - Vos entreprises souhaitent déposer des offres",
        template: mailTemplate["mail-relance-opco"],
        data: {
          images: {
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
          },
          count: userList[opco],
          url: `${config.publicUrlEspacePro}/authentification`,
        },
      })
    })
  }
}
