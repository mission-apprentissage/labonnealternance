import { ObjectId } from "mongodb"
import { isEnum } from "shared"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import { asyncForEach } from "../../../common/utils/asyncUtils"
import config from "../../../config"
import mailer from "../../../services/mailer.service"

/**
 * @description send mail to ocpo with awaiting validation user number
 * @returns {}
 */
export const relanceOpco = async () => {
  const rolesAwaitingValidation = await getDbCollection("rolemanagements")
    .find(
      {
        $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, AccessStatus.AWAITING_VALIDATION] },
        authorized_type: AccessEntityType.ENTREPRISE,
      },
      {
        projection: {
          authorized_id: 1,
        },
      }
    )
    .toArray()

  // Cancel the job if there's no users awaiting validation
  if (!rolesAwaitingValidation.length) return

  const entreprises = await getDbCollection("entreprises")
    .find({ _id: { $in: rolesAwaitingValidation.map(({ authorized_id }) => new ObjectId(authorized_id.toString())) } })
    .toArray()
  const opcoCounts = entreprises.reduce<Record<OPCOS_LABEL, number>>(
    (acc, entreprise) => {
      const { opco } = entreprise
      if (!isEnum(OPCOS_LABEL, opco)) {
        return acc
      }
      const oldCount = acc[opco] ?? 0
      acc[opco] = oldCount + 1
      return acc
    },
    {} as Record<OPCOS_LABEL, number>
  )
  await Promise.all(
    Object.entries(opcoCounts).map(async ([opco, count]) => {
      // Get related user to send the email
      const roles = await getDbCollection("rolemanagements").find({ authorized_type: AccessEntityType.OPCO, authorized_id: opco }).toArray()
      const users = await getDbCollection("userswithaccounts")
        .find({ _id: { $in: roles.map((role) => role.user_id) } })
        .toArray()

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
