import dayjs from "dayjs"
import { AppointmentUserType } from "shared/constants/appointment.js"
import { EApplicantRole } from "shared/constants/rdva.js"
import { ENTREPRISE, ETAT_UTILISATEUR, OPCOS, VALIDATION_UTILISATEUR } from "shared/constants/recruteur.js"
import { ICFA } from "shared/models/cfa.model.js"
import { EntrepriseStatus, IEntreprise, IEntrepriseStatusEvent } from "shared/models/entreprise.model.js"
import { AccessEntityType, AccessStatus, IRoleManagement, IRoleManagementEvent } from "shared/models/roleManagement.model.js"
import { IUser2, IUserStatusEvent, UserEventType } from "shared/models/user2.model.js"
import { IUserRecruteur } from "shared/models/usersRecruteur.model.js"

import { logger } from "../../common/logger.js"
import { Appointment, User, UserRecruteur } from "../../common/model/index.js"
import { Cfa } from "../../common/model/schema/multiCompte/cfa.schema.js"
import { Entreprise } from "../../common/model/schema/multiCompte/entreprise.schema.js"
import { RoleManagement } from "../../common/model/schema/multiCompte/roleManagement.schema.js"
import { User2 } from "../../common/model/schema/multiCompte/user2.schema.js"
import { asyncForEachGrouped } from "../../common/utils/asyncUtils.js"
import { parseEnumOrError } from "../../common/utils/enumUtils.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"

export const migrationUsers = async () => {
  await User2.deleteMany({})
  await Entreprise.deleteMany({})
  await Cfa.deleteMany({})
  await RoleManagement.deleteMany({})
  const now = new Date()
  await migrationRecruteurs()
  await migrationCandidats(now)
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
      origin: originRaw,
      is_email_checked,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      is_qualiopi,
      status: oldStatus,
      last_connection,
      createdAt,
      updatedAt,
    } = userRecruteur
    const origin = originRaw || "user migration"
    index % 1000 === 0 && logger.info(`import du user recruteur n°${index}`)
    try {
      const newStatus: IUserStatusEvent[] = []
      if (is_email_checked) {
        newStatus.push({
          date: createdAt,
          reason: "migration",
          status: UserEventType.VALIDATION_EMAIL,
          validation_type: VALIDATION_UTILISATEUR.AUTO,
          granted_by: "migration",
        })
      }
      newStatus.push({
        date: createdAt,
        reason: "migration",
        status: UserEventType.ACTIF,
        validation_type: VALIDATION_UTILISATEUR.AUTO,
        granted_by: "migration",
      })
      const newUser: IUser2 = {
        _id: userRecruteur._id,
        first_name: first_name ?? "",
        last_name: last_name ?? "",
        phone: phone ?? "",
        email,
        last_action_date: last_connection,
        createdAt,
        updatedAt,
        origin,
        status: newStatus,
      }
      await User2.create(newUser)
      stats.userCreated++
      if (type === ENTREPRISE) {
        if (!establishment_siret) {
          throw new Error("inattendu pour une ENTERPRISE: pas de establishment_siret")
        }
        const entreprise: IEntreprise = {
          _id: userRecruteur._id,
          origin,
          siret: establishment_siret,
          address,
          address_detail,
          enseigne: establishment_enseigne,
          establishment_id,
          raison_sociale: establishment_raison_sociale,
          geo_coordinates,
          idcc,
          opco,
          createdAt,
          updatedAt,
          status: userRecruteurStatusToEntrepriseStatus(oldStatus),
        }
        const createdEntreprise = await Entreprise.create(entreprise)
        stats.entrepriseCreated++
        const roleManagement: Omit<IRoleManagement, "_id"> = {
          user_id: userRecruteur._id,
          authorized_type: AccessEntityType.ENTREPRISE,
          authorized_id: createdEntreprise._id,
          createdAt: userRecruteur.createdAt,
          updatedAt: userRecruteur.updatedAt,
          origin,
          status: userRecruteurStatusToRoleManagementStatus(oldStatus),
        }
        await RoleManagement.create(roleManagement)
      } else if (type === "CFA") {
        if (!establishment_siret) {
          throw new Error("inattendu pour un CFA: pas de establishment_siret")
        }
        const cfa: ICFA = {
          _id: userRecruteur._id,
          siret: establishment_siret,
          address,
          address_detail,
          enseigne: establishment_enseigne,
          raison_sociale: establishment_raison_sociale,
          geo_coordinates,
          origin,
          createdAt,
          updatedAt,
        }
        const createdCfa = await Cfa.create(cfa)
        stats.cfaCreated++
        const roleManagement: Omit<IRoleManagement, "_id"> = {
          user_id: userRecruteur._id,
          authorized_type: AccessEntityType.CFA,
          authorized_id: createdCfa._id,
          createdAt: userRecruteur.createdAt,
          updatedAt: userRecruteur.updatedAt,
          origin,
          status: userRecruteurStatusToRoleManagementStatus(oldStatus),
        }
        await RoleManagement.create(roleManagement)
      } else if (type === "ADMIN") {
        const roleManagement: Omit<IRoleManagement, "_id"> = {
          user_id: userRecruteur._id,
          authorized_type: AccessEntityType.ADMIN,
          authorized_id: "",
          createdAt: userRecruteur.createdAt,
          updatedAt: userRecruteur.updatedAt,
          origin,
          status: userRecruteurStatusToRoleManagementStatus(oldStatus),
        }
        await RoleManagement.create(roleManagement)
        stats.adminAccess++
      } else if (type === "OPCO") {
        const opco = parseEnumOrError(OPCOS, scope ?? null)
        const roleManagement: Omit<IRoleManagement, "_id"> = {
          user_id: userRecruteur._id,
          authorized_type: AccessEntityType.OPCO,
          authorized_id: opco,
          createdAt: userRecruteur.createdAt,
          updatedAt: userRecruteur.updatedAt,
          origin,
          status: userRecruteurStatusToRoleManagementStatus(oldStatus),
        }
        await RoleManagement.create(roleManagement)
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

const migrationCandidats = async (now: Date) => {
  logger.info(`Migration: lecture des user candidats...`)

  // l'utilisateur admin n'est pas repris
  const candidats = await User.find({ role: EApplicantRole.CANDIDAT })
  logger.info(`Migration: ${candidats.length} user candidats à mettre à jour`)
  const stats = { success: 0, failure: 0, alreadyExist: 0 }

  await asyncForEachGrouped(candidats, 100, async (candidat, index) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { firstname, lastname, phone, email, role, type, last_action_date, is_anonymized, _id } = candidat
    index % 1000 === 0 && logger.info(`import du candidat n°${index}`)
    try {
      if (type) {
        await Appointment.updateMany({ applicant_id: candidat._id }, { $set: { applicant_type: parseEnumOrError(AppointmentUserType, type) } })
      }
      const existingUser = await User2.findOne({ email })
      if (existingUser) {
        await Appointment.updateMany({ applicant_id: candidat._id }, { $set: { applicant_id: existingUser._id } })
        if (dayjs(candidat.last_action_date).isAfter(existingUser.last_action_date)) {
          await User2.updateOne({ _id: existingUser._id }, { last_action_date: candidat.last_action_date })
        }
        stats.alreadyExist++
        return
      }
      const newUser: IUser2 = {
        _id: candidat._id,
        first_name: firstname,
        last_name: lastname,
        phone,
        email,
        last_action_date: last_action_date,
        createdAt: last_action_date,
        updatedAt: last_action_date,
        origin: "migration user candidat",
        status: [
          {
            date: now,
            reason: "migration",
            status: is_anonymized ? UserEventType.DESACTIVE : UserEventType.ACTIF,
            validation_type: VALIDATION_UTILISATEUR.AUTO,
          },
        ],
      }
      await User2.create(newUser)
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

function userRecruteurStatusToRoleManagementStatus(allStatus: IUserRecruteur["status"]): IRoleManagementEvent[] {
  return allStatus.flatMap((statusEvent) => {
    const { date, reason, status, user, validation_type } = statusEvent
    const statusMapping: Record<ETAT_UTILISATEUR, AccessStatus | null> = {
      [ETAT_UTILISATEUR.DESACTIVE]: AccessStatus.DENIED,
      [ETAT_UTILISATEUR.VALIDE]: AccessStatus.GRANTED,
      [ETAT_UTILISATEUR.ATTENTE]: AccessStatus.AWAITING_VALIDATION,
      [ETAT_UTILISATEUR.ERROR]: null,
    }
    const accessStatus = status ? statusMapping[status] : null
    if (accessStatus && date) {
      const newEvent: IRoleManagementEvent = {
        date,
        reason: reason ?? "",
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

function userRecruteurStatusToEntrepriseStatus(allStatus: IUserRecruteur["status"]): IEntrepriseStatusEvent[] {
  return allStatus.flatMap((statusEvent) => {
    const { date, reason, status, user, validation_type } = statusEvent
    const statusMapping: Record<ETAT_UTILISATEUR, EntrepriseStatus | null> = {
      [ETAT_UTILISATEUR.VALIDE]: EntrepriseStatus.VALIDE,
      [ETAT_UTILISATEUR.ERROR]: EntrepriseStatus.ERROR,
      [ETAT_UTILISATEUR.ATTENTE]: null,
      [ETAT_UTILISATEUR.DESACTIVE]: null,
    }
    const entrepriseStatus = status ? statusMapping[status] : null
    if (entrepriseStatus && date) {
      const newEvent: IEntrepriseStatusEvent = {
        date,
        reason: reason ?? "",
        validation_type: validation_type,
        granted_by: user,
        status: entrepriseStatus,
      }
      return [newEvent]
    } else {
      return []
    }
  })
}
