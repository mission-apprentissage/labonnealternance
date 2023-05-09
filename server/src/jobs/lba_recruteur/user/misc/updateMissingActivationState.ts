import { logger } from "../../../../common/logger.js"
import { Formulaire, UserRecruteur } from "../../../../common/model/index.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { runScript } from "../../../scriptWrapper.js"
import { validationOrganisation } from "../../../../common/bal.js"
import { checkIfUserEmailIsPrivate } from "../../../../common/utils/mailUtils.js"
import {
  getMatchingEmailFromContactList,
  getMatchingDomainFromContactList,
  getAllEstablishmentFromBonneBoite,
  getAllEstablishmentFromBonneBoiteLegacy,
  getAllEstablishmentFromOpcoReferentiel,
} from "../../../../services/etablissement.service.js"
import { validation_utilisateur, etat_utilisateur } from "../../../../common/constants.js"

const runValidation = async (usersRecruteur) => {
  logger.info(`Start update missing validation state for entreprise...`)

  const autoValidateUser = async (userId) =>
    await usersRecruteur.updateUserValidationHistory(userId, {
      validation_type: validation_utilisateur.AUTO,
      user: "SERVEUR",
      statut: etat_utilisateur.VALIDE,
    })

  const setManualValidation = async (userId) =>
    await usersRecruteur.updateUserValidationHistory(userId, {
      validation_type: validation_utilisateur.MANUAL,
      user: "SERVEUR",
      statut: etat_utilisateur.ATTENTE,
    })

  const entreprises = await UserRecruteur.find({ type: "ENTREPRISE", etat_utilisateur: { $size: 1 }, "etat_utilisateur.statut": "EN ATTENTE DE VALIDATION" })

  logger.info(`${entreprises.length} etp à mettre à jour...`)
  await asyncForEach(entreprises, async (etp, index) => {
    logger.info(`${entreprises.length}/${index}`)
    const found = await Formulaire.findOne({ id_form: etp.id_form })

    if (!found) {
      await UserRecruteur.findByIdAndDelete(etp._id)
      return
    }

    const siren = etp.siret.substr(0, 9)

    const [bonneBoiteLegacyList, bonneBoiteList, referentielOpcoList] = await Promise.all([
      getAllEstablishmentFromBonneBoiteLegacy({ siret: { $regex: siren }, email: { $nin: ["", undefined] } }),
      getAllEstablishmentFromBonneBoite({ siret: { $regex: siren }, email: { $nin: ["", undefined] } }),
      getAllEstablishmentFromOpcoReferentiel({ siret_code: { $regex: siren } }),
    ])

    const [bonneBoiteLegacyEmailList, bonneBoiteEmailList, referentielOpcoEmailList] = await Promise.all([
      bonneBoiteLegacyList.map(({ email }) => email),
      bonneBoiteList.map(({ email }) => email),
      referentielOpcoList.reduce((acc: string[], item) => {
        item.emails.map((x) => acc.push(x))
        return acc
      }, []),
    ])

    // Create a single array with all emails duplicate free
    const emailListUnique = [...new Set([...referentielOpcoEmailList, ...bonneBoiteLegacyEmailList, ...bonneBoiteEmailList])]

    // Check BAL API for validation
    const balControl = await validationOrganisation(etp.siret, etp.email)

    if (balControl.is_valid) {
      await autoValidateUser(etp._id)
    } else {
      if (emailListUnique.length) {
        if (getMatchingEmailFromContactList(etp.email, emailListUnique)) {
          await autoValidateUser(etp._id)
        } else if (checkIfUserEmailIsPrivate(etp.email) && getMatchingDomainFromContactList(etp.email, emailListUnique)) {
          await autoValidateUser(etp._id)
        } else {
          await setManualValidation(etp._id)
        }
      } else {
        await setManualValidation(etp._id)
      }
    }
  })

  logger.info(`Done.`)
}

const resetUserValidation = async (db) => {
  const users = await db.collection("usertemps").find({}).toArray()

  await asyncForEach(users, async (user) => {
    const id = user.ID.trim()
    await UserRecruteur.findByIdAndUpdate(id, { $set: { etat_utilisateur: [] } }, { new: true })
    console.log(`${user.ID} updated`)
  })
}

runScript(async ({ usersRecruteur, db }) => {
  // logger.info("#start reset validation for specific users")
  // await resetUserValidation(db)

  logger.info("#start validation for specific users")
  await runValidation(usersRecruteur)
})
