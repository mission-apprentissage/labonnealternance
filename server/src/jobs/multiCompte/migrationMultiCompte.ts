import { Application, User, UserRecruteur } from "../../common/model/index.js"
import { logger } from "../../common/logger.js"
import { asyncForEachGrouped } from "../../common/utils/asyncUtils.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"
import { user2Repository } from "../../common/model/schema/multiCompte/user2.schema.js"
import { entrepriseRepository } from "../../common/model/schema/multiCompte/entreprise.schema.js"
import { User2, UserEventType, UserStatusEvent } from "../../common/model/schema/multiCompte/user2.types.js"
import { ENTREPRISE, ETAT_UTILISATEUR, OPCOS, VALIDATION_UTILISATEUR } from "../../services/constant.service.js"
import { IUserRecruteur } from "../../common/model/schema/userRecruteur/userRecruteur.types.js"
import { parseEnumOrError } from "../../common/utils/enumUtils.js"
import { Entreprise, EntrepriseStatusEvent, EntrepriseStatusEventType } from "../../common/model/schema/multiCompte/entreprise.types.js"
import { CFA, CFAStatusEvent, CFAStatusEventType } from "../../common/model/schema/multiCompte/cfa.types.js"
import { cfaRepository } from "../../common/model/schema/multiCompte/cfa.schema.js"

const migrationCandidats = async (now: Date) => {
  logger.info(`Migration: lecture des user candidats...`)

  // TODO handle admin coté candidatures

  const candidats = await User.find({ role: "candidat" })
  logger.info(`Migration: ${candidats.length} user candidats à mettre à jour`)
  const stats = { success: 0, failure: 0, alreadyExist: 0 }

  await asyncForEachGrouped(candidats, 100, async (candidat, index) => {
    const { username, password, firstname, lastname, phone, email, role, type, last_action_date, is_anonymized, _id } = candidat
    index % 1000 === 0 && logger.info(`import du candidat n°${index}`)
    try {
      const existingUser = await user2Repository.findOne({ email })
      if (existingUser) {
        await Application.updateMany({ applicant_email: email }, { $set: { applicant_role: type, applicant_id: existingUser._id } })
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
      const document = await user2Repository.create(newUser)
      await Application.updateMany({ applicant_email: email }, { $set: { applicantRole: type, applicantId: document._id } })
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
  ${stats.alreadyExist} users n'ont pas été modifés car déjà créés par ailleurs.`
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
  const userRecruteurs = await UserRecruteur.find({})
  logger.info(`Migration: ${userRecruteurs.length} user recruteurs à mettre à jour`)
  const stats = { success: 0, failure: 0, entrepriseCreated: 0, cfaCreated: 0, userCreated: 0 }

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
        is_admin: type === "ADMIN",
        opco: type === "OPCO" ? parseEnumOrError(OPCOS, scope) : undefined,
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
          ...userRecruteurStatusToUserStatus(status),
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
          history: userRecruteurStatusToEntrepriseStatus(status),
        }
        await entrepriseRepository.create(entreprise)
        stats.entrepriseCreated++
      } else if (type === "CFA") {
        const cfa: Omit<CFA, "_id"> = {
          establishment_siret,
          is_qualiopi: Boolean(is_qualiopi),
          address,
          address_detail,
          establishment_enseigne,
          establishment_raison_sociale,
          geo_coordinates,
          origin,
          createdAt,
          updatedAt,
          history: userRecruteurStatusToCFAStatus(status),
        }
        await cfaRepository.create(cfa)
        stats.cfaCreated++
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

function userRecruteurStatusToUserStatus(allStatus: IUserRecruteur["status"]): UserStatusEvent[] {
  return allStatus.flatMap((statusEvent) => {
    const { date, reason, status, user, validation_type } = statusEvent
    switch (status) {
      case ETAT_UTILISATEUR.DESACTIVE: {
        const newEvent: UserStatusEvent = {
          date,
          reason,
          validation_type: validation_type,
          granted_by: user,
          status: UserEventType.DESACTIVE,
        }
        return [newEvent]
      }
      case ETAT_UTILISATEUR.VALIDE: {
        const newEvent: UserStatusEvent = {
          date,
          reason,
          validation_type: validation_type,
          granted_by: user,
          status: UserEventType.ACTIF,
        }
        return [newEvent]
      }
      default: {
        return []
      }
    }
  })
}

function userRecruteurStatusToEntrepriseStatus(allStatus: IUserRecruteur["status"]): EntrepriseStatusEvent[] {
  return allStatus.flatMap((statusEvent) => {
    const { date, reason, status, user, validation_type } = statusEvent
    switch (status) {
      case ETAT_UTILISATEUR.ATTENTE: {
        const newEvent: EntrepriseStatusEvent = {
          date,
          reason,
          validation_type,
          granted_by: user,
          status: EntrepriseStatusEventType.ATTENTE,
        }
        return [newEvent]
      }
      case ETAT_UTILISATEUR.ERROR: {
        const newEvent: EntrepriseStatusEvent = {
          date,
          reason,
          validation_type,
          granted_by: user,
          status: EntrepriseStatusEventType.ERROR,
        }
        return [newEvent]
      }
      case ETAT_UTILISATEUR.VALIDE: {
        const newEvent: EntrepriseStatusEvent = {
          date,
          reason,
          validation_type,
          granted_by: user,
          status: EntrepriseStatusEventType.VALIDE,
        }
        return [newEvent]
      }
      default: {
        return []
      }
    }
  })
}

function userRecruteurStatusToCFAStatus(allStatus: IUserRecruteur["status"]): CFAStatusEvent[] {
  return allStatus.flatMap((statusEvent) => {
    const { date, reason, status, user, validation_type } = statusEvent
    switch (status) {
      case ETAT_UTILISATEUR.ATTENTE: {
        const newEvent: CFAStatusEvent = {
          date,
          reason,
          validation_type,
          granted_by: user,
          status: CFAStatusEventType.ATTENTE,
        }
        return [newEvent]
      }
      case ETAT_UTILISATEUR.ERROR: {
        const newEvent: CFAStatusEvent = {
          date,
          reason,
          validation_type,
          granted_by: user,
          status: CFAStatusEventType.ERROR,
        }
        return [newEvent]
      }
      case ETAT_UTILISATEUR.VALIDE: {
        const newEvent: CFAStatusEvent = {
          date,
          reason,
          validation_type,
          granted_by: user,
          status: CFAStatusEventType.VALIDE,
        }
        return [newEvent]
      }
      default: {
        return []
      }
    }
  })
}

export const migrationMultiCompte = async () => {
  const now = new Date()
  await migrationRecruteurs()
  await migrationCandidats(now)
}
