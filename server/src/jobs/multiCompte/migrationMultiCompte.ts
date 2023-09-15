import dayjs from "dayjs"
import { logger } from "../../common/logger.js"
import { Appointment, User, UserRecruteur } from "../../common/model/index.js"
import { AppointmentUserType } from "../../common/model/schema/appointments/appointments.types.js"
import { cfaRepository } from "../../common/model/schema/multiCompte/cfa.schema.js"
import { CFA } from "../../common/model/schema/multiCompte/cfa.types.js"
import { entrepriseRepository } from "../../common/model/schema/multiCompte/entreprise.schema.js"
import { Entreprise } from "../../common/model/schema/multiCompte/entreprise.types.js"
import { roleManagementRepository } from "../../common/model/schema/multiCompte/roleManagement.schema.js"
import { AccessEntityType, AccessStatus, RoleManagement, RoleManagementEvent } from "../../common/model/schema/multiCompte/roleManagement.types.js"
import { user2Repository } from "../../common/model/schema/multiCompte/user2.schema.js"
import { User2, UserEventType } from "../../common/model/schema/multiCompte/user2.types.js"
import { IUserRecruteur } from "../../common/model/schema/userRecruteur/userRecruteur.types.js"
import { asyncForEachGrouped } from "../../common/utils/asyncUtils.js"
import { parseEnumOrError } from "../../common/utils/enumUtils.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"
import { ENTREPRISE, ETAT_UTILISATEUR, OPCOS, VALIDATION_UTILISATEUR } from "../../services/constant.service.js"

const migrationCandidats = async (now: Date) => {
  logger.info(`Migration: lecture des user candidats...`)

  // l'utilisateur admin n'est pas repris
  const candidats = await User.find({ role: "candidat" })
  logger.info(`Migration: ${candidats.length} user candidats à mettre à jour`)
  const stats = { success: 0, failure: 0, alreadyExist: 0 }

  await asyncForEachGrouped(candidats, 100, async (candidat, index) => {
    const { username, password, firstname, lastname, phone, email, role, type, last_action_date, is_anonymized, _id } = candidat
    index % 1000 === 0 && logger.info(`import du candidat n°${index}`)
    try {
      if (type) {
        await Appointment.updateMany({ applicant_id: candidat._id }, { $set: { applicant_user_type: parseEnumOrError(AppointmentUserType, type) } })
      }
      const existingUser = await user2Repository.findOne({ email })
      if (existingUser) {
        await Appointment.updateMany({ applicant_id: candidat._id }, { $set: { applicant_id: existingUser._id } })
        if (dayjs(candidat.last_action_date).isAfter(existingUser.last_connection)) {
          await user2Repository.updateOne({ _id: existingUser._id }, { last_connection: candidat.last_action_date })
        }
        stats.alreadyExist++
        return
      }
      const newUser: Omit<User2, "_id"> = {
        firstname,
        lastname,
        phone,
        email,
        last_connection: last_action_date,
        is_anonymized: is_anonymized,
        createdAt: last_action_date,
        updatedAt: last_action_date,
        origin: "migration user candidat",
        history: [
          {
            date: now,
            reason: "migration",
            status: is_anonymized ? UserEventType.DESACTIVE : UserEventType.ACTIF,
            validation_type: VALIDATION_UTILISATEUR.AUTO,
          },
        ],
      }
      await user2Repository.create({ ...newUser, _id: candidat._id })
      stats.success++
    } catch (err) {
      logger.error(`erreur lors de l'import du user candidat avec id=${_id}`)
      logger.error(err)
      stats.failure++
    }
  })
  logger.info(`Migration: user candidats terminés`)
  const message = `${stats.success} user candidats repris avec succès.
  ${stats.failure} user candidats en erreur.
  ${stats.alreadyExist} users en doublon.`
  logger.info(message)
  await notifyToSlack({
    subject: "Migration multi-compte",
    message,
    error: stats.failure > 0,
  })
  return stats
}

const migrationRecruteurs = async () => {
  logger.info(`Migration: lecture des user recruteurs...`)
  const userRecruteurs: IUserRecruteur[] = await UserRecruteur.find({})
  logger.info(`Migration: ${userRecruteurs.length} user recruteurs à mettre à jour`)
  const stats = { success: 0, failure: 0, entrepriseCreated: 0, cfaCreated: 0, userCreated: 0, adminAccess: 0, opcoAccess: 0 }

  await asyncForEachGrouped(userRecruteurs, 100, async (userRecruteur, index) => {
    const {
      last_name,
      first_name,
      opco,
      idcc,
      establishment_raison_sociale,
      establishment_enseigne,
      establishment_siret,
      address_detail,
      address,
      geo_coordinates,
      phone,
      email,
      scope,
      type,
      establishment_id,
      origin,
      is_email_checked,
      is_qualiopi,
      status,
      last_connection,
      createdAt,
      updatedAt,
    } = userRecruteur
    index % 1000 === 0 && logger.info(`import du user recruteur n°${index}`)
    try {
      const fieldsUpdate: Omit<User2, "_id"> = {
        firstname: first_name ?? "",
        lastname: last_name ?? "",
        phone: phone ?? "",
        email,
        last_connection: last_connection,
        is_anonymized: false,
        createdAt,
        updatedAt,
        origin,
        history: [
          ...(is_email_checked
            ? [
                {
                  date: createdAt,
                  reason: "migration",
                  status: UserEventType.VALIDATION_EMAIL,
                  validation_type: VALIDATION_UTILISATEUR.AUTO,
                },
              ]
            : []),
          {
            date: createdAt,
            reason: "migration",
            status: UserEventType.ACTIF,
            validation_type: VALIDATION_UTILISATEUR.AUTO,
          },
        ],
      }
      await user2Repository.create({ ...fieldsUpdate, _id: userRecruteur._id })
      stats.userCreated++
      if (type === ENTREPRISE) {
        const entreprise: Omit<Entreprise, "_id"> = {
          establishment_siret,
          address,
          address_detail,
          establishment_enseigne,
          establishment_id,
          establishment_raison_sociale,
          geo_coordinates,
          idcc,
          opco,
          origin,
          createdAt,
          updatedAt,
        }
        const createdEntreprise = await entrepriseRepository.create({ ...entreprise, _id: userRecruteur._id })
        stats.entrepriseCreated++
        const roleManagement: Omit<RoleManagement, "_id"> = {
          accessor_id: userRecruteur._id,
          accessor_type: AccessEntityType.USER,
          accessed_type: AccessEntityType.ENTREPRISE,
          accessed_id: createdEntreprise._id,
          createdAt: userRecruteur.createdAt,
          updatedAt: userRecruteur.updatedAt,
          origin,
          history: userRecruteurStatusToRoleManagementStatus(status),
        }
        await roleManagementRepository.create(roleManagement)
      } else if (type === "CFA") {
        const cfa: Omit<CFA, "_id"> = {
          establishment_siret,
          address,
          address_detail,
          establishment_enseigne,
          establishment_raison_sociale,
          geo_coordinates,
          origin,
          createdAt,
          updatedAt,
        }
        const createdCfa = await cfaRepository.create({ ...cfa, _id: userRecruteur._id })
        stats.cfaCreated++
        const roleManagement: Omit<RoleManagement, "_id"> = {
          accessor_id: userRecruteur._id,
          accessor_type: AccessEntityType.USER,
          accessed_type: AccessEntityType.CFA,
          accessed_id: createdCfa._id,
          createdAt: userRecruteur.createdAt,
          updatedAt: userRecruteur.updatedAt,
          origin,
          history: userRecruteurStatusToRoleManagementStatus(status),
        }
        await roleManagementRepository.create(roleManagement)
      } else if (type === "ADMIN") {
        const roleManagement: Omit<RoleManagement, "_id"> = {
          accessor_id: userRecruteur._id,
          accessor_type: AccessEntityType.USER,
          accessed_type: AccessEntityType.ADMIN,
          accessed_id: "",
          createdAt: userRecruteur.createdAt,
          updatedAt: userRecruteur.updatedAt,
          origin,
          history: userRecruteurStatusToRoleManagementStatus(status),
        }
        await roleManagementRepository.create(roleManagement)
        stats.adminAccess++
      } else if (type === "OPCO") {
        const opco = parseEnumOrError(OPCOS, scope)
        const roleManagement: Omit<RoleManagement, "_id"> = {
          accessor_id: userRecruteur._id,
          accessor_type: AccessEntityType.USER,
          accessed_type: AccessEntityType.OPCO,
          accessed_id: opco,
          createdAt: userRecruteur.createdAt,
          updatedAt: userRecruteur.updatedAt,
          origin,
          history: userRecruteurStatusToRoleManagementStatus(status),
        }
        await roleManagementRepository.create(roleManagement)
        stats.opcoAccess++
      }
      stats.success++
    } catch (err) {
      logger.error(`erreur lors de l'import du user recruteur avec id=${userRecruteur._id}`)
      logger.error(err)
      stats.failure++
    }
  })
  logger.info(`Migration: user candidats terminés`)
  const message = `${stats.success} user recruteurs repris avec succès.
  ${stats.failure} user recruteurs en erreur.
  ${stats.userCreated} user créés.
  ${stats.entrepriseCreated} entreprises créées.
  ${stats.cfaCreated} CFA créés.
  `
  logger.info(message)
  await notifyToSlack({
    subject: "Migration multi-compte",
    message,
    error: stats.failure > 0,
  })
  return stats
}

function userRecruteurStatusToRoleManagementStatus(allStatus: IUserRecruteur["status"]): RoleManagementEvent[] {
  return allStatus.flatMap((statusEvent) => {
    const { date, reason, status, user, validation_type } = statusEvent
    const statusMapping: Record<ETAT_UTILISATEUR, AccessStatus | null> = {
      [ETAT_UTILISATEUR.DESACTIVE]: AccessStatus.DENIED,
      [ETAT_UTILISATEUR.VALIDE]: AccessStatus.GRANTED,
      [ETAT_UTILISATEUR.ATTENTE]: AccessStatus.AWAITING_VALIDATION,
      [ETAT_UTILISATEUR.ERROR]: null,
    }
    const accessStatus = statusMapping[status]
    if (accessStatus) {
      const newEvent: RoleManagementEvent = {
        date,
        reason,
        validation_type: validation_type,
        granted_by: user,
        status: accessStatus,
      }
      return [newEvent]
    } else {
      return []
    }
  })
}

export const migrationMultiCompte = async () => {
  await user2Repository.deleteMany({})
  await entrepriseRepository.deleteMany({})
  await cfaRepository.deleteMany({})
  await roleManagementRepository.deleteMany({})
  const now = new Date()
  await migrationRecruteurs()
  await migrationCandidats(now)
}
