import { logger } from "../../../../common/logger.js"
import { Recruiter, UserRecruteur } from "../../../../common/model/index.js"
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
import { updateUserValidationHistory } from "../../../../services/userRecruteur.service.js"
import { notifyToSlack } from "../../../../common/utils/slackUtils.js"

const autoValidateUser = async (userId) =>
  await updateUserValidationHistory(userId, {
    validation_type: validation_utilisateur.AUTO,
    user: "SERVEUR",
    status: etat_utilisateur.VALIDE,
  })

const stat = { validated: 0, notFound: 0, total: 0 }

const runValidation = async () => {
  logger.info(`Start update missing validation state for entreprise...`)

  const entreprises = await UserRecruteur.find({ type: "ENTREPRISE", status: { $size: 1 }, "status.status": "EN ATTENTE DE VALIDATION" })

  if (!entreprises.length) {
    notifyToSlack({ subject: "USER VALIDATION", message: "Aucunes entreprises à contrôler" })
    return
  }

  stat.total = entreprises.length

  logger.info(`${entreprises.length} etp à mettre à jour...`)

  await asyncForEach(entreprises, async (etp, index) => {
    logger.info(`${entreprises.length}/${index}`)
    const found = await Recruiter.findOne({ establishment_id: etp.establishment_id })

    if (!found) {
      await UserRecruteur.findByIdAndDelete(etp.establishment_id)
      return
    }

    const siren = etp.establishment_siret.substr(0, 9)

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
    const balControl = await validationOrganisation(etp.establishment_siret, etp.email)

    if (balControl.is_valid) {
      await autoValidateUser(etp._id)
      stat.validated++
    } else {
      if (emailListUnique.length) {
        if (getMatchingEmailFromContactList(etp.email, emailListUnique)) {
          await autoValidateUser(etp._id)
          stat.validated++
        } else if (checkIfUserEmailIsPrivate(etp.email) && getMatchingDomainFromContactList(etp.email, emailListUnique)) {
          await autoValidateUser(etp._id)
          stat.validated++
        } else {
          stat.notFound++
        }
      } else {
        stat.notFound++
      }
    }
  })

  notifyToSlack({ subject: "USER VALIDATION", message: `${stat.validated} entreprises validées sur un total de ${stat.total} (${stat.notFound} reste à valider manuellement)` })

  return stat
}

runScript(async () => {
  logger.info("#start validation for specific users")
  const stat = await runValidation()
  logger.info(`Done.`)
  return stat
})
