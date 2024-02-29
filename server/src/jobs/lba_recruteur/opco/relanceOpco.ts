import { OPCOS } from "shared/constants/recruteur"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"

import { isEnum } from "@/common/utils/enumUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { Entreprise, RoleManagement, User2 } from "../../../common/model/index"
import { asyncForEach } from "../../../common/utils/asyncUtils"
import config from "../../../config"
import mailer from "../../../services/mailer.service"

/**
 * @description send mail to ocpo with awaiting validation user number
 * @returns {}
 */
export const relanceOpco = async () => {
  const rolesAwaitingValidation = await RoleManagement.find(
    {
      $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, AccessStatus.AWAITING_VALIDATION] },
      authorized_type: AccessEntityType.ENTREPRISE,
    },
    { authorized_id: 1 }
  ).lean()

  // Cancel the job if there's no users awaiting validation
  if (!rolesAwaitingValidation.length) return

  const entreprises = await Entreprise.find({ _id: { $in: rolesAwaitingValidation.map(({ authorized_id }) => authorized_id) } })
  const opcoCounts = entreprises.reduce<Record<OPCOS, number>>(
    (acc, entreprise) => {
      const { opco } = entreprise
      if (!isEnum(OPCOS, opco)) {
        return acc
      }
      const oldCount = acc[opco] ?? 0
      acc[opco] = oldCount + 1
      return acc
    },
    {} as Record<OPCOS, number>
  )
  await Promise.all(
    Object.entries(opcoCounts).map(async ([opco, count]) => {
      // Get related user to send the email
      const roles = await RoleManagement.find({ authorized_type: AccessEntityType.OPCO, authorized_id: opco }).lean()
      const users = await User2.find({ _id: { $in: roles.map((role) => role.user_id) } })

      await asyncForEach(users, async (user) => {
        await mailer.sendEmail({
          to: user.email,
          subject: "Nouveaux comptes entreprises à valider",
          template: getStaticFilePath("./templates/mail-relance-opco.mjml.ejs"),
          data: {
            images: {
              logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            },
            count,
          },
        })
      })
    })
  )
}
