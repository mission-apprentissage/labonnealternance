import { mailTemplate } from "../../../assets/index.js"
import { ETAT_UTILISATEUR } from "../../../services/constant.service.js"
import { UserRecruteur } from "../../../common/model/index.js"
import { IUserRecruteur } from "../../../common/model/schema/userRecruteur/userRecruteur.types.js"
import { asyncForEach } from "../../../common/utils/asyncUtils.js"
import config from "../../../config.js"
import mailer from "../../../services/mailer.service.js"

/**
 * @description send mail to ocpo with awaiting validation user number
 * @returns {}
 */
export const relanceOpco = async () => {
  const userAwaitingValidation = await UserRecruteur.find({
    $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, ETAT_UTILISATEUR.ATTENTE] },
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
        subject: "Nouveaux comptes entreprises à valider",
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
