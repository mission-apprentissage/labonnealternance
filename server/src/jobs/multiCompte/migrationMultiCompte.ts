import { Application, User } from "../../common/model/index.js"
import { randomUUID } from "crypto"
import { logger } from "../../common/logger.js"
import { asyncForEach, asyncForEachGrouped } from "../../common/utils/asyncUtils.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"
import { user2Repository } from "../../common/model/schema/multiCompte/user2.schema.js"
import { UserEventType } from "../../common/model/schema/multiCompte/user2.types.js"
import { IUser } from "../../common/model/schema/user/user.types.js"
import { VALIDATION_UTILISATEUR } from "../../services/constant.service.js"
import { Components } from "../../common/components/components.js"
import { ObjectId } from "mongodb"

const migrationCandidats = async () => {
  logger.info(`Migration: lecture des user candidats...`)
  const candidats = await User.find({ role: "candidat" })
  const now = new Date()
  logger.info(`Migration: ${candidats.length} user candidats à mettre à jour`)
  const stats = { success: 0, failure: 0 }

  await asyncForEachGrouped(candidats, 100, async (candidat, index) => {
    const { username, password, firstname, lastname, phone, email, role, type, last_action_date, is_anonymized, _id } = candidat
    index % 1000 === 0 && logger.info(`import du candidat n°${index}`)
    try {
      const document = await user2Repository.create({
        firstname,
        lastname,
        phone,
        email,
        lastConnection: last_action_date,
        is_anonymized,
        createdAt: last_action_date,
        updatedAt: last_action_date,
        history: [
          {
            date: now,
            reason: "migration",
            status: is_anonymized ? UserEventType.INACTIF : UserEventType.ACTIF,
            validation_type: VALIDATION_UTILISATEUR.AUTO,
          },
        ],
      })
      await Application.updateMany({ applicant_email: email }, { $set: { applicantRole: type, applicantId: document.id } })
      stats.success++
    } catch (err) {
      logger.error(`erreur lors de l'import du user avec id=${_id}`)
      logger.error(err)
      stats.failure++
    }
  })
  logger.info(`Migration: user candidats terminés`)
  //   await notifyToSlack({
  //     subject: "Migration multi-compte",
  //     message: `${stats.success} user candidats repris avec succès. ${stats.failure} user candidats en erreur.`,
  //     error: stats.failure > 0,
  //   })
  return stats
}

// const migrationApplications = async () => {}

export const migrationMultiCompte = async () => {
  await migrationCandidats()
}
