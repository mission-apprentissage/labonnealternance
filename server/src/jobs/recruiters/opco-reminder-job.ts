import { ObjectId } from "mongodb"
import { isEnum } from "shared"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"

import { asyncForEach } from "@/common/utils/async-utils"
import { getStaticFilePath } from "@/common/utils/get-static-file-path"
import { getDatabase, getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import mailer from "@/services/mailer.service"

const OPCO_REMINDER_JOB_NAME = "Envoi du rappel de validation des utilisateurs en attente aux OPCOs"

const getLastOpcoReminderDate = async (): Promise<Date | null> => {
  const lastReminder = await getDatabase().collection("job_processor.jobs").findOne(
    { type: "cron_task", name: OPCO_REMINDER_JOB_NAME, status: "finished" },
    { projection: { updated_at: 1, ended_at: 1, started_at: 1 }, sort: { ended_at: -1, started_at: -1, updated_at: -1 } }
  )

  return lastReminder?.ended_at ?? lastReminder?.started_at ?? null
}

const getCountableRoleManagements = async (since: Date | null) => {
  return getDbCollection("rolemanagements")
    .aggregate<{ authorized_id: string }>([
      { $match: { authorized_type: AccessEntityType.ENTREPRISE } },
      { $project: { authorized_id: 1, last_status: { $arrayElemAt: ["$status", -1] } } },
      {
        $match: {
          "last_status.status": AccessStatus.AWAITING_VALIDATION,
          ...(since ? { "last_status.date": { $gte: since } } : {}),
        },
      },
    ])
    .toArray()
}

/**
 * @description send mail to ocpo with awaiting validation user number
 * @returns {}
 */
export const opcoReminderJob = async () => {
  const lastReminderDate = await getLastOpcoReminderDate()
  const rolesAwaitingValidation = await getCountableRoleManagements(lastReminderDate)

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
      const roles = await getDbCollection("rolemanagements").find({ authorized_type: AccessEntityType.OPCO, authorized_id: opco }).toArray()
      const users = await getDbCollection("userswithaccounts")
        .find({ _id: { $in: roles.map((role) => role.user_id) } })
        .toArray()

      const countPhrase =
        count === 1
          ? "1 nouvelle entreprise dépendant de votre OPCO s'est connectée pour la première fois depuis notre dernier message"
          : `${count} nouvelles entreprises dépendant de votre OPCO se sont connectées pour la première fois depuis notre dernier message`

      await asyncForEach(users, async (user) => {
        await mailer.sendEmail({
          to: user.email,
          subject: "Nouveaux comptes entreprises à valider",
          template: getStaticFilePath("./templates/mail-relance-opco.mjml.ejs"),
          data: {
            images: {
              logoLba: `${config.publicUrl}/images/emails/logo_LBA.png`,
              logoRf: `${config.publicUrl}/images/emails/logo_rf.png`,
            },
            count,
            countPhrase,
            publicEmail: config.publicEmail,
            utmParams: "utm_source=lba&utm_medium=email&utm_campaign=lba_opco_notif-comptes-a-valider",
          },
        })
      })
    })
  )
}
