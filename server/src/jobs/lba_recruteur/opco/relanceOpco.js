import { mailTemplate } from "../../../assets/index.js"
import { etat_utilisateur } from "../../../common/constants.js"
import { UserRecruteur } from "../../../common/model/index.js"
import config from "../../../config.js"

/**
 * @description send mail to ocpo with awaiting validation user number
 * @param {*} mailer component
 * @returns {}
 */
export const relanceOpco = async (mailer) => {
  const userAwaitingValidation = await UserRecruteur.find({
    $expr: { $eq: [{ $arrayElemAt: ["$etat_utilisateur.statut", -1] }, etat_utilisateur.ATTENTE] },
    opco: { $ne: null },
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
    const user = await UserRecruteur.findOne({ scope: opco, type: "OPCO" })

    // send mail to recipient
    await mailer.sendEmail({
      to: user.email,
      subject: "La bonne alternance - Vos entreprises souhaitent déposer des offres",
      template: mailTemplate["mail-relance-opco"],
      data: {
        count: userList[opco],
        url: `${config.publicUrl}/authentification`,
      },
    })
  }
}
