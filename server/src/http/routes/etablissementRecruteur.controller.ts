import joi from "joi"
import { zRoutes } from "shared/index"

import { IRecruiter } from "../../common/model/schema/recruiter/recruiter.types"
import { IUserRecruteur } from "../../common/model/schema/userRecruteur/userRecruteur.types"
import { createUserRecruteurToken } from "../../common/utils/jwtUtils"
import { getAllDomainsFromEmailList, getEmailDomain, isEmailFromPrivateCompany, isUserMailExistInReferentiel } from "../../common/utils/mailUtils"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"
import { getNearEtablissementsFromRomes } from "../../services/catalogue.service"
import { BusinessErrorCodes, CFA, ENTREPRISE, ETAT_UTILISATEUR } from "../../services/constant.service"
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
} from "../../services/etablissement.service"
import {
  autoValidateUser,
  createUser,
  getUser,
  getUserStatus,
  registerUser,
  sendWelcomeEmailToUserRecruteur,
  setUserHasToBeManuallyValidated,
  updateUser,
} from "../../services/userRecruteur.service"
import { Server } from "../server"

const getCfaRomeSchema = joi.object({
  latitude: joi.number().required(),
  longitude: joi.number().required(),
  rome: joi.array().items(joi.string()).required(),
})

export default (server: Server) => {
  /**
   * Retourne la liste de tous les CFA ayant une formation avec les ROME passés..
   * Resultats triés par proximité (km).
   */
  server.get(
    "/api/etablissement/cfa/rome",
    {
      schema: zRoutes.get["/api/etablissement/cfa/rome"],
    },
    async (req, res) => {
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
    }
  )

  /**
   * Récupérer les informations d'une entreprise à l'aide de l'API du gouvernement
   */
  server.get(
    "/api/etablissement/entreprise/:siret",
    {
      schema: zRoutes.get["/api/etablissement/entreprise/:siret"],
    },
    async (req, res) => {
      const siret: string | undefined = req.params.siret
      const cfa_delegated_siret: string | undefined = req.query.cfa_delegated_siret
      if (!siret) {
        return res.status(400).send({ error: true, message: "Le numéro siret est obligatoire." })
      }
      try {
        const cfaVerification = await validateCreationEntrepriseFromCfa({ siret, cfa_delegated_siret })
        if (cfaVerification) {
          return res.status(400).send({
            error: true,
            message: cfaVerification.message,
          })
        }
        const result = await getEntrepriseDataFromSiret({ siret, cfa_delegated_siret })
        if ("error" in result) {
          switch (result.errorCode) {
            case BusinessErrorCodes.IS_CFA: {
              return res.status(400).send({
                error: true,
                message: result.message,
                isCfa: true,
              })
            }
            default: {
              return res.status(400).send({
                error: true,
                message: result.message,
              })
            }
          }
        } else {
          res.status(200).send(result)
        }
      } catch (error) {
        sentryCaptureException(error)
        res.status(500).send({ error: true, message: "Le service est momentanément indisponible." })
      }
    }
  )

  /**
   * Récupérer l'OPCO d'une entreprise à l'aide des données en base ou de l'API CFA DOCK
   */
  server.get(
    "/api/etablissement/entreprise/:siret/opco",
    {
      schema: zRoutes.get["/api/etablissement/entreprise/:siret/opco"],
    },
    async (req, res) => {
      const siret: string | undefined = req.params.siret
      if (!siret) {
        return res.status(400).send({ error: true, message: "Le numéro siret est obligatoire." })
      }
      const result = await getOpcoData(siret)
      if (!result) {
        return res.status(404).send({ error: true, message: "aucune données OPCO trouvées" })
      }
      return res.status(200).send(result)
    }
  )

  /**
   * Récupération des informations d'un établissement à l'aide des tables de correspondances et du référentiel
   */
  server.get(
    "/api/etablissement/cfa/:siret",
    {
      schema: zRoutes.get["/api/etablissement/cfa/:siret"],
    },
    async (req, res) => {
      const { siret } = req.params
      if (!siret) {
        return res.status(400).send({ error: true, message: "Le numéro siret est obligatoire." })
      }
      const response = await getOrganismeDeFormationDataFromSiret(siret)
      if ("error" in response) {
        const { message, errorCode } = response
        switch (errorCode) {
          case BusinessErrorCodes.ALREADY_EXISTS:
            return res.status(403).send({ error: true, reason: message })
          default:
            return res.status(400).send({ error: true, reason: message })
        }
      }
      if (!response.is_qualiopi) {
        return res.status(400).send({
          data: response,
          error: true,
          reason: "QUALIOPI",
        })
      }
      return res.status(200).send(response)
    }
  )

  /**
   * Enregistrement d'un partenaire
   */
  server.post(
    "/api/etablissement/creation",
    {
      schema: zRoutes.post["/api/etablissement/creation"],
    },
    async (req, res) => {
      // TODO add some Joi
      switch (req.body.type) {
        case ENTREPRISE: {
          const siret = req.body.establishment_siret
          const result = await entrepriseOnboardingWorkflow.create({ ...req.body, siret })
          if ("error" in result) {
            switch (result.errorCode) {
              case BusinessErrorCodes.ALREADY_EXISTS: {
                return res.status(403).send({
                  error: true,
                  message: result.message,
                })
              }
              default: {
                return res.status(400).send({
                  error: true,
                  message: result.message,
                })
              }
            }
          }
          return res.status(200).send(result)
        }
        case CFA: {
          const { email, establishment_siret } = req.body
          const formatedEmail = email.toLocaleLowerCase()
          // check if user already exist
          const userRecruteurOpt = await getUser({ email: formatedEmail })
          if (userRecruteurOpt) {
            return res.status(403).send({ error: true, message: "L'adresse mail est déjà associée à un compte La bonne alternance." })
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
            return res.status(200).send({ user: newCfa })
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
            return res.status(200).send({ user: newCfa })
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
              return res.status(200).send({ user: newCfa })
            }
          }
          // Validation manuelle de l'utilisateur à effectuer pas un administrateur
          newCfa = await setUserHasToBeManuallyValidated(newCfa._id)
          await notifyToSlack({
            subject: "RECRUTEUR",
            message: `Nouvel OF en attente de validation - ${newCfa.email} - https://referentiel.apprentissage.beta.gouv.fr/organismes/${newCfa.establishment_siret}`,
          })
          // Keep the same structure as ENTREPRISE
          return res.status(200).send({ user: newCfa })
        }
        default: {
          return res.status(400).send({ error: "unsupported type" })
        }
      }
    }
  )

  /**
   * Désactiver les mises en relations avec les entreprises
   */

  server.post(
    "/api/etablissement/:establishment_siret/proposition/unsubscribe",
    {
      schema: zRoutes.post["/api/etablissement/:establishment_siret/proposition/unsubscribe"],
    },
    async (req, res) => {
      await etablissementUnsubscribeDemandeDelegation(req.params.establishment_siret)
      res.status(200)
      return res.status(200).send({ ok: true })
    }
  )

  /**
   * Mise à jour d'un partenaire
   */

  server.put(
    "/api/etablissement/:id",
    {
      schema: zRoutes.put["/api/etablissement/:id"],
      preHandler: server.auth(zRoutes.put["/api/etablissement/:id"].securityScheme),
    },
    async (req, res) => {
      const result = await updateUser({ _id: req.params.id }, req.body)
      return res.status(200).send(result)
    }
  )

  server.post(
    "/api/etablissement/validation",
    {
      schema: zRoutes.post["/api/etablissement/validation"],
    },
    async (req, res) => {
      const id = req.body.id

      if (!id) {
        return res.status(400)
      }

      const exist = await getEtablissement({ _id: id })

      if (!exist) {
        return res.status(400).send({
          error: true,
          message: "L'utilisateur n'existe pas.",
        })
      }

      // Validate email
      const validation = await validateEtablissementEmail(id)

      if (!validation) {
        return res.status(400).send({
          error: true,
          message: "La validation de l'adresse mail à échoué. Merci de contacter le support La bonne alternance.",
        })
      }

      const user = await getUser({ _id: req.body.id })

      if (!user) return

      const isUserAwaiting = getUserStatus(user.status) === ETAT_UTILISATEUR.ATTENTE

      if (isUserAwaiting) {
        return res.status(200).send({ isUserAwaiting: true })
      }
      await sendWelcomeEmailToUserRecruteur(user)
      await registerUser(user.email)

      // Log the user in directly
      return res.status(200).send({ token: createUserRecruteurToken(user) })
    }
  )
}
