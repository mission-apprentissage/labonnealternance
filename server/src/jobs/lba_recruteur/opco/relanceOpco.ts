import { IUserRecruteur } from "shared"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { UserRecruteur } from "../../../common/model/index"
import { asyncForEach } from "../../../common/utils/asyncUtils"
import config from "../../../config"
import { ETAT_UTILISATEUR } from "../../../services/constant.service"
import mailer from "../../../services/mailer.service"

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
        template: getStaticFilePath("./templates/mail-relance-opco.mjml.ejs"),
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
