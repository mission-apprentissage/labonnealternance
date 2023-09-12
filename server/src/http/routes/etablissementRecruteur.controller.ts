import express, { Request } from "express"
import joi from "joi"
import { createUserRecruteurToken } from "../../common/utils/jwtUtils.js"
import { getAllDomainsFromEmailList, getEmailDomain, isEmailFromPrivateCompany, isUserMailExistInReferentiel } from "../../common/utils/mailUtils.js"
import { sentryCaptureException } from "../../common/utils/sentryUtils.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"
import { getNearEtablissementsFromRomes } from "../../services/catalogue.service.js"
import { BusinessErrorCodes, CFA, ENTREPRISE, ETAT_UTILISATEUR } from "../../services/constant.service.js"
import {
  entrepriseOnboardingWorkflow,
  etablissementUnsubscribeDemandeDelegation,
  getEntrepriseDataFromSiret,
  getEtablissement,
  getEtablissementFromReferentiel,
  getOpcoData,
  getOrganismeDeFormationDataFromSiret,
  sendUserConfirmationEmail,
  validateCreationEntrepriseFromCfa,
  validateEtablissementEmail,
} from "../../services/etablissement.service.js"
import {
  autoValidateUser,
  getUserStatus,
  sendWelcomeEmailToUserRecruteur,
  setUserHasToBeManuallyValidated,
  getUser,
  createUser,
  updateUser,
  registerUser,
} from "../../services/userRecruteur.service.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { IUserRecruteur } from "../../db/schema/userRecruteur/userRecruteur.types.js"
import { IRecruiter } from "../../db/schema/recruiter/recruiter.types.js"
import authMiddleware from "../middlewares/authMiddleware.js"

const getCfaRomeSchema = joi.object({
  latitude: joi.number().required(),
  longitude: joi.number().required(),
  rome: joi.array().items(joi.string()).required(),
})

export default () => {
  const router = express.Router()

  /**
   * Retourne la liste de tous les CFA ayant une formation avec les ROME passés..
   * Resultats triés par proximité (km).
   */
  router.get(
    "/cfa/rome",
    tryCatch(async (req, res) => {
      const { latitude, longitude, rome } = req.query

      await getCfaRomeSchema.validateAsync(
        {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          rome,
        },
        { abortEarly: false }
      )

      const etablissements = await getNearEtablissementsFromRomes({ rome, origin: { latitude, longitude } })
      res.send(etablissements)
    })
  )

  /**
   * Récupérer les informations d'une entreprise à l'aide de l'API du gouvernement
   */
  router.get(
    "/entreprise/:siret",
    tryCatch(async (req, res) => {
      const siret: string | undefined = req.params.siret
      const cfa_delegated_siret: string | undefined = req.query.cfa_delegated_siret
      if (!siret) {
        return res.status(400).json({ error: true, message: "Le numéro siret est obligatoire." })
      }
      try {
        const cfaVerification = await validateCreationEntrepriseFromCfa({ siret, cfa_delegated_siret })
        if (cfaVerification) {
          return res.status(400).json({
            error: true,
            message: cfaVerification.message,
          })
        }
        const result = await getEntrepriseDataFromSiret({ siret, cfa_delegated_siret })
        if ("error" in result) {
          switch (result.errorCode) {
            case BusinessErrorCodes.IS_CFA: {
              return res.status(400).json({
                error: true,
                message: result.message,
                isCfa: true,
              })
            }
            default: {
              return res.status(400).json({
                error: true,
                message: result.message,
              })
            }
          }
        } else {
          res.json(result)
        }
      } catch (error) {
        sentryCaptureException(error)
        res.status(500).json({ error: true, message: "Le service est momentanément indisponible." })
      }
    })
  )

  /**
   * Récupérer les informations d'une entreprise à l'aide de l'API du gouvernement
   */
  router.get(
    "/entreprise/:siret/opco",
    tryCatch(async (req, res) => {
      const siret: string | undefined = req.params.siret
      if (!siret) {
        return res.status(400).json({ error: true, message: "Le numéro siret est obligatoire." })
      }
      const result = await getOpcoData(siret)
      if (!result) {
        return res.status(404).json({ error: true, message: "aucune données OPCO trouvées" })
      }
      return res.json(result)
    })
  )

  /**
   * Récupération des informations d'un établissement à l'aide des tables de correspondances et du référentiel
   */
  router.get(
    "/cfa/:siret",
    tryCatch(async (req, res) => {
      const { siret } = req.params
      if (!siret) {
        return res.status(400).json({ error: true, message: "Le numéro siret est obligatoire." })
      }
      const response = await getOrganismeDeFormationDataFromSiret(siret)
      if ("error" in response) {
        const { message, errorCode } = response
        switch (errorCode) {
          case BusinessErrorCodes.ALREADY_EXISTS:
            return res.status(403).json({ error: true, reason: message })
          default:
            return res.status(400).json({ error: true, reason: message })
        }
      }
      if (!response.is_qualiopi) {
        return res.status(400).json({
          data: response,
          error: true,
          reason: "QUALIOPI",
        })
      }
      return res.json(response)
    })
  )

  /**
   * Enregistrement d'un partenaire
   */

  router.post(
    "/creation",
    tryCatch(async (req: Request<{}, {}, IUserRecruteur & IRecruiter>, res) => {
      // TODO add some Joi
      switch (req.body.type) {
        case ENTREPRISE: {
          const siret = req.body.establishment_siret
          const result = await entrepriseOnboardingWorkflow.create({ ...req.body, siret })
          if ("error" in result) {
            switch (result.errorCode) {
              case BusinessErrorCodes.ALREADY_EXISTS: {
                return res.status(403).json({
                  error: true,
                  message: result.message,
                })
              }
              default: {
                return res.status(400).json({
                  error: true,
                  message: result.message,
                })
              }
            }
          }
          return res.json(result)
        }
        case CFA: {
          const { email, establishment_siret } = req.body
          const formatedEmail = email.toLocaleLowerCase()
          // check if user already exist
          const userRecruteurOpt = await getUser({ email: formatedEmail })
          if (userRecruteurOpt) {
            return res.status(403).json({ error: true, message: "L'adresse mail est déjà associée à un compte La bonne alternance." })
          }
          // Contrôle du mail avec le référentiel :
          const referentiel = await getEtablissementFromReferentiel(establishment_siret)
          // Creation de l'utilisateur en base de données
          let newCfa: IUserRecruteur = await createUser(req.body)
          if (!referentiel?.contacts.length) {
            // Validation manuelle de l'utilisateur à effectuer pas un administrateur
            newCfa = await setUserHasToBeManuallyValidated(newCfa._id)
            await notifyToSlack({
              subject: "RECRUTEUR",
              message: `Nouvel OF en attente de validation - ${newCfa.email} - https://referentiel.apprentissage.beta.gouv.fr/organismes/${newCfa.establishment_siret}`,
            })
            return res.json({ user: newCfa })
          }
          if (isUserMailExistInReferentiel(referentiel.contacts, email)) {
            // Validation automatique de l'utilisateur
            newCfa = await autoValidateUser(newCfa._id)
            const { email, _id, last_name, first_name } = newCfa
            await sendUserConfirmationEmail({
              email,
              firstName: first_name,
              lastName: last_name,
              userRecruteurId: _id,
            })
            // Keep the same structure as ENTREPRISE
            return res.json({ user: newCfa })
          }
          if (isEmailFromPrivateCompany(formatedEmail)) {
            const domains = getAllDomainsFromEmailList(referentiel.contacts.map(({ email }) => email))
            const userEmailDomain = getEmailDomain(formatedEmail)
            if (userEmailDomain && domains.includes(userEmailDomain)) {
              // Validation automatique de l'utilisateur
              newCfa = await autoValidateUser(newCfa._id)
              const { email, _id, last_name, first_name } = newCfa
              await sendUserConfirmationEmail({
                email,
                firstName: first_name,
                lastName: last_name,
                userRecruteurId: _id,
              })
              // Keep the same structure as ENTREPRISE
              return res.json({ user: newCfa })
            }
          }
          // Validation manuelle de l'utilisateur à effectuer pas un administrateur
          newCfa = await setUserHasToBeManuallyValidated(newCfa._id)
          await notifyToSlack({
            subject: "RECRUTEUR",
            message: `Nouvel OF en attente de validation - ${newCfa.email} - https://referentiel.apprentissage.beta.gouv.fr/organismes/${newCfa.establishment_siret}`,
          })
          // Keep the same structure as ENTREPRISE
          return res.json({ user: newCfa })
        }
        default: {
          return res.status(400).json({ error: "unsupported type" })
        }
      }
    })
  )

  /**
   * Désactiver les mises en relations avec les entreprises
   */

  router.post(
    "/:establishment_siret/proposition/unsubscribe",
    tryCatch(async (req, res) => {
      await etablissementUnsubscribeDemandeDelegation(req.params.establishment_siret)
      res.status(200)
      return res.json({ ok: true })
    })
  )

  /**
   * Mise à jour d'un partenaire
   */

  router.put(
    "/:id",
    authMiddleware("jwt-bearer"),
    tryCatch(async (req, res) => {
      const result = await updateUser({ _id: req.params.id }, req.body)
      return res.json(result)
    })
  )

  router.post(
    "/validation",
    tryCatch(async (req, res) => {
      const id = req.body.id

      if (!id) {
        return res.status(400)
      }

      const exist = await getEtablissement({ _id: id })

      if (!exist) {
        return res.status(400).json({
          error: true,
          message: "L'utilisateur n'existe pas.",
        })
      }

      // Validate email
      const validation = await validateEtablissementEmail(id)

      if (!validation) {
        return res.status(400).json({
          error: true,
          message: "La validation de l'adresse mail à échoué. Merci de contacter le support La bonne alternance.",
        })
      }

      const user: IUserRecruteur = await getUser({ _id: req.body.id })
      const isUserAwaiting = getUserStatus(user.status) === ETAT_UTILISATEUR.ATTENTE

      if (isUserAwaiting) {
        return res.json({ isUserAwaiting: true })
      }
      await sendWelcomeEmailToUserRecruteur(user)
      await registerUser(user.email)

      // Log the user in directly
      return res.json({ token: createUserRecruteurToken(user) })
    })
  )

  return router
}
