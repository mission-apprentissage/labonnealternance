import express, { Request } from "express"
import joi from "joi"
import { mailTemplate } from "../../assets/index.js"
import { IRecruiter } from "../../common/model/schema/recruiter/recruiter.types.js"
import { IUserRecruteur } from "../../common/model/schema/userRecruteur/userRecruteur.types.js"
import { createUserRecruteurToken } from "../../common/utils/jwtUtils.js"
import { checkIfUserMailExistInReferentiel, getAllDomainsFromEmailList, getEmailDomain, isEmailPrivateCompany } from "../../common/utils/mailUtils.js"
import { sentryCaptureException } from "../../common/utils/sentryUtils.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"
import config from "../../config.js"
import { getNearEtablissementsFromRomes } from "../../services/catalogue.service.js"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR } from "../../services/constant.service.js"
import {
  ErrorCodes,
  entrepriseOnboardingWorkflow,
  etablissementUnsubscribeDemandeDelegation,
  formatReferentielData,
  getEntrepriseDataFromSiret,
  getEtablissement,
  getEtablissementFromReferentiel,
  getValidationUrl,
  validateEtablissementEmail,
} from "../../services/etablissement.service.js"
import mailer from "../../services/mailer.service.js"
import {
  createUser,
  getUser,
  getUserValidationState,
  registerUser,
  updateUser,
  userAutoValidate,
  userRecruteurSendWelcomeEmail,
  userSetManualValidation,
} from "../../services/userRecruteur.service.js"
import authMiddleware from "../middlewares/authMiddleware.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

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
      const fromDashboardCfa = Boolean(req.query.fromDashboardCfa)
      const cfa_delegated_siret: string | undefined = req.query.cfa_delegated_siret
      if (!siret) {
        return res.status(400).json({ error: true, message: "Le numéro siret est obligatoire." })
      }
      try {
        const result = await getEntrepriseDataFromSiret({ siret, fromDashboardCfa, cfa_delegated_siret })
        if ("error" in result) {
          switch (result.errorCode) {
            case ErrorCodes.isCfa: {
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
   * Récupération des informations d'un établissement à l'aide des tables de correspondances et du référentiel
   */
  router.get(
    "/cfa/:siret",
    tryCatch(async (req, res) => {
      if (!req.params.siret) {
        return res.status(400).json({ error: true, message: "Le numéro siret est obligatoire." })
      }

      const exist = await getEtablissement({ establishment_siret: req.params.siret, type: CFA })

      if (exist) {
        return res.status(403).json({
          error: true,
          reason: "EXIST",
        })
      }

      const referentiel = await getEtablissementFromReferentiel(req.params.siret)

      if (!referentiel) {
        return res.status(400).json({
          error: true,
          reason: "UNKNOWN",
        })
      }

      if (referentiel?.etat_administratif === "fermé") {
        return res.status(400).json({
          error: true,
          reason: "CLOSED",
        })
      }

      if (!referentiel?.qualiopi) {
        return res.status(400).json({
          data: { ...formatReferentielData(referentiel) },
          error: true,
          reason: "QUALIOPI",
        })
      }

      return res.json({ ...formatReferentielData(referentiel) })
    })
  )

  /**
   * Enregistrement d'un partenaire
   */

  router.post(
    "/creation",
    tryCatch(async (req: Request<{}, {}, IUserRecruteur & IRecruiter>, res) => {
      switch (req.body.type) {
        case ENTREPRISE: {
          const siret = req.body.establishment_siret
          const result = await entrepriseOnboardingWorkflow.create({ ...req.body, fromDashboardCfa: false, siret })
          if ("error" in result) {
            switch (result.errorCode) {
              case ErrorCodes.alreadyExist: {
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
          // creation
          const formatedEmail = req.body.email.toLocaleLowerCase()

          // check if user already exist
          const exist = await getUser({ email: formatedEmail })

          if (exist) {
            return res.status(403).json({ error: true, message: "L'adresse mail est déjà associée à un compte La bonne alternance." })
          }

          // Contrôle du mail avec le référentiel :
          const referentiel = await getEtablissementFromReferentiel(req.body.establishment_siret)
          // Creation de l'utilisateur en base de données
          let newCfa: IUserRecruteur = await createUser(req.body)

          if (!referentiel.contacts.length) {
            // Validation manuelle de l'utilisateur à effectuer pas un administrateur
            newCfa = await userSetManualValidation(newCfa._id)

            await notifyToSlack({
              subject: "RECRUTEUR",
              message: `Nouvel OF en attente de validation - ${newCfa.email} - https://referentiel.apprentissage.beta.gouv.fr/organismes/${newCfa.establishment_siret}`,
            })

            return res.json({ user: newCfa })
          }

          if (checkIfUserMailExistInReferentiel(referentiel.contacts, req.body.email)) {
            // Validation automatique de l'utilisateur
            newCfa = await userAutoValidate(newCfa._id)

            const { email, _id, last_name, first_name } = newCfa

            const url = getValidationUrl(_id)

            await mailer.sendEmail({
              to: email,
              subject: "Confirmez votre adresse mail",
              template: mailTemplate["mail-confirmation-email"],
              data: {
                images: {
                  logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
                },
                first_name,
                last_name,
                confirmation_url: url,
              },
            })

            // Keep the same structure as ENTREPRISE
            return res.json({ user: newCfa })
          }

          if (isEmailPrivateCompany(formatedEmail)) {
            const domains = getAllDomainsFromEmailList(referentiel.contacts)
            const userEmailDomain = getEmailDomain(formatedEmail)
            if (domains.includes(userEmailDomain)) {
              // Validation automatique de l'utilisateur
              newCfa = await userAutoValidate(newCfa._id)
              const { email, _id, last_name, first_name } = newCfa
              const url = getValidationUrl(_id)
              await mailer.sendEmail({
                to: email,
                subject: "Confirmez votre adresse mail",
                template: mailTemplate["mail-confirmation-email"],
                data: {
                  images: {
                    logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
                  },
                  first_name,
                  last_name,
                  confirmation_url: url,
                },
              })
              // Keep the same structure as ENTREPRISE
              return res.json({ user: newCfa })
            }
          }

          // Validation manuelle de l'utilisateur à effectuer pas un administrateur
          newCfa = await userSetManualValidation(newCfa._id)

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
      const isUserAwaiting = getUserValidationState(user.status) === ETAT_UTILISATEUR.ATTENTE

      if (isUserAwaiting) {
        return res.json({ isUserAwaiting: true })
      }
      await userRecruteurSendWelcomeEmail(user)
      await registerUser(user.email)

      // Log the user in directly
      return res.json({ token: createUserRecruteurToken(user) })
    })
  )

  return router
}
