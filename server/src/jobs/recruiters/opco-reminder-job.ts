import { ObjectId } from "mongodb"
import { isEnum } from "shared"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/async-utils"
import { getStaticFilePath } from "@/common/utils/get-static-file-path"
import { getDatabase, getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import mailer from "@/services/mailer.service"

// Clef du cron dans jobs.ts : la relance borne son comptage sur l'exécution précédente, donc le
// nom doit rester commun aux deux fichiers.
export const OPCO_REMINDER_JOB_NAME = "Envoi du rappel de validation des utilisateurs en attente aux OPCOs"

/**
 * Borne sur `started_at` et non `ended_at` : l'exécution précédente a interrogé la base à son
 * démarrage, les comptes arrivés pendant son déroulé ne seraient comptés par personne.
 *
 * Lecture directe de la collection plutôt que `findJobs` de job-processor : cette API exige
 * `initJobProcessor` et lève « Job processor is not setup » sous vitest, ce qui obligerait à la
 * mocker et ferait perdre la couverture réelle de la requête (cf. send-job-partners-nightly-digest).
 */
const getLastOpcoReminderDate = async (): Promise<Date | null> => {
  const lastReminder = await getDatabase()
    .collection("job_processor.jobs")
    .findOne({ type: "cron_task", name: OPCO_REMINDER_JOB_NAME, status: "finished" }, { projection: { started_at: 1, ended_at: 1 }, sort: { started_at: -1 } })

  return lastReminder?.started_at ?? lastReminder?.ended_at ?? null
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
  if (!lastReminderDate) {
    // Premier run, ou plus aucune trace de l'exécution précédente (TTL de 90 jours du job
    // processor, renommage du cron) : le mail part sur le stock complet alors qu'il annonce
    // « depuis notre dernier message ». Sans cette ligne, rien ne distingue ce run d'un run normal.
    logger.warn("opcoReminderJob: aucune exécution précédente trouvée, comptage sur le stock complet")
  }
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
            countPhrase,
            publicEmail: config.publicEmail,
            utmParams: "utm_source=lba&utm_medium=email&utm_campaign=lba_opco_notif-comptes-a-valider",
          },
        })
      })
    })
  )
}
