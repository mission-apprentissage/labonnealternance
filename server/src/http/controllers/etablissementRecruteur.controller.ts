import Boom from "boom"
import { IUserRecruteur, toPublicUser, zRoutes } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { ETAT_UTILISATEUR, RECRUITER_STATUS } from "shared/constants/recruteur"

import { Recruiter, UserRecruteur } from "@/common/model"
import { startSession } from "@/common/utils/session.service"
import config from "@/config"
import { getUserFromRequest } from "@/security/authenticationService"

import { getAllDomainsFromEmailList, getEmailDomain, isEmailFromPrivateCompany, isUserMailExistInReferentiel } from "../../common/utils/mailUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"
import { getNearEtablissementsFromRomes } from "../../services/catalogue.service"
import { CFA, ENTREPRISE } from "../../services/constant.service"
import {
  entrepriseOnboardingWorkflow,
  etablissementUnsubscribeDemandeDelegation,
  getEntrepriseDataFromSiret,
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
  sendWelcomeEmailToUserRecruteur,
  setUserHasToBeManuallyValidated,
  updateLastConnectionDate,
  updateUser,
} from "../../services/userRecruteur.service"
import { Server } from "../server"

export default (server: Server) => {
  /**
   * Retourne la liste de tous les CFA ayant une formation avec les ROME passés..
   * Resultats triés par proximité (km).
   */
  server.get(
    "/etablissement/cfas-proches",
    {
      schema: zRoutes.get["/etablissement/cfas-proches"],
    },
    async (req, res) => {
      const { latitude, longitude, rome } = req.query
      const etablissements = await getNearEtablissementsFromRomes({ rome: [rome], origin: { latitude: latitude, longitude: longitude } })
      res.send(etablissements)
    }
  )

  /**
   * Récupérer les informations d'une entreprise à l'aide de l'API du gouvernement
   */
  server.get(
    "/etablissement/entreprise/:siret",
    {
      schema: zRoutes.get["/etablissement/entreprise/:siret"],
    },
    async (req, res) => {
      const siret: string | undefined = req.params.siret
      const cfa_delegated_siret: string | undefined = req.query.cfa_delegated_siret
      if (!siret) {
        throw Boom.badRequest("Le numéro siret est obligatoire.")
      }

      const cfaVerification = await validateCreationEntrepriseFromCfa({ siret, cfa_delegated_siret })
      if (cfaVerification) {
        throw Boom.badRequest(cfaVerification.message)
      }

      const result = await getEntrepriseDataFromSiret({ siret, cfa_delegated_siret })

      if ("error" in result) {
        throw Boom.badRequest(result.message, result)
      } else {
        return res.status(200).send(result)
      }
    }
  )

  /**
   * Récupérer l'OPCO d'une entreprise à l'aide des données en base ou de l'API CFA DOCK
   */
  server.get(
    "/etablissement/entreprise/:siret/opco",
    {
      schema: zRoutes.get["/etablissement/entreprise/:siret/opco"],
    },
    async (req, res) => {
      const siret = req.params.siret
      if (!siret) {
        throw Boom.badRequest("Le numéro siret est obligatoire.")
      }
      const result = await getOpcoData(siret)
      if (!result) {
        throw Boom.notFound("aucune données OPCO trouvées")
      }
      return res.status(200).send(result)
    }
  )

  /**
   * Récupération des informations d'un cfa à l'aide des tables de correspondances et du référentiel
   */
  server.get(
    "/etablissement/cfa/:siret",
    {
      schema: zRoutes.get["/etablissement/cfa/:siret"],
    },
    async (req, res) => {
      const { siret } = req.params
      if (!siret) {
        throw Boom.badRequest("Le numéro siret est obligatoire.")
      }
      const response = await getOrganismeDeFormationDataFromSiret(siret)
      return res.status(200).send(response)
    }
  )

  /**
   * Retourne les entreprises gérées par un CFA
   */
  server.get(
    "/etablissement/cfa/:userRecruteurId/entreprises",
    {
      schema: zRoutes.get["/etablissement/cfa/:userRecruteurId/entreprises"],
      onRequest: [server.auth(zRoutes.get["/etablissement/cfa/:userRecruteurId/entreprises"])],
    },
    async (req, res) => {
      const { userRecruteurId } = req.params
      const cfa = await UserRecruteur.findOne({ _id: userRecruteurId }).lean()
      if (!cfa) {
        throw Boom.notFound(`Aucun CFA ayant pour id ${userRecruteurId.toString()}`)
      }
      const cfa_delegated_siret = cfa.establishment_siret
      if (!cfa_delegated_siret) {
        throw Boom.internal(`inattendu : le cfa n'a pas de champ cfa_delegated_siret`)
      }
      const entreprises = await Recruiter.find({ status: { $in: [RECRUITER_STATUS.ACTIF, RECRUITER_STATUS.EN_ATTENTE_VALIDATION] }, cfa_delegated_siret }).lean()
      return res.status(200).send(entreprises)
    }
  )

  /**
   * Enregistrement d'un partenaire
   */
  server.post(
    "/etablissement/creation",
    {
      schema: zRoutes.post["/etablissement/creation"],
    },
    async (req, res) => {
      switch (req.body.type) {
        case ENTREPRISE: {
          const siret = req.body.establishment_siret
          const cfa_delegated_siret = req.body.cfa_delegated_siret ?? undefined
          const result = await entrepriseOnboardingWorkflow.create({ ...req.body, siret, cfa_delegated_siret })
          if ("error" in result) {
            if (result.errorCode === BusinessErrorCodes.ALREADY_EXISTS) throw Boom.forbidden(result.message, result)
            else throw Boom.badRequest(result.message, result)
          }
          await startSession(req.body.email, res)
          return res.status(200).send(result)
        }
        case CFA: {
          const { email, establishment_siret } = req.body
          const formatedEmail = email.toLocaleLowerCase()
          // check if user already exist
          const userRecruteurOpt = await getUser({ email: formatedEmail })
          if (userRecruteurOpt) {
            throw Boom.forbidden("L'adresse mail est déjà associée à un compte La bonne alternance.")
          }

          const siretInfos = await getOrganismeDeFormationDataFromSiret(establishment_siret)
          const { contacts } = siretInfos

          // Creation de l'utilisateur en base de données
          let newCfa: IUserRecruteur = await createUser({ ...req.body, ...siretInfos, is_email_checked: false })

          const slackNotification = {
            subject: "RECRUTEUR",
            message: `Nouvel OF en attente de validation - ${config.publicUrl}/espace-pro/administration/users/${newCfa._id}`,
          }
          if (!contacts.length) {
            // Validation manuelle de l'utilisateur à effectuer pas un administrateur
            newCfa = await setUserHasToBeManuallyValidated(newCfa._id)
            await notifyToSlack(slackNotification)
            return res.status(200).send({ user: newCfa })
          }
          if (isUserMailExistInReferentiel(contacts, email)) {
            // Validation automatique de l'utilisateur
            newCfa = await autoValidateUser(newCfa._id)
            await sendUserConfirmationEmail(newCfa)
            // Keep the same structure as ENTREPRISE
            return res.status(200).send({ user: newCfa })
          }
          if (isEmailFromPrivateCompany(formatedEmail)) {
            const domains = getAllDomainsFromEmailList(contacts.map(({ email }) => email))
            const userEmailDomain = getEmailDomain(formatedEmail)
            if (userEmailDomain && domains.includes(userEmailDomain)) {
              // Validation automatique de l'utilisateur
              newCfa = await autoValidateUser(newCfa._id)
              await sendUserConfirmationEmail(newCfa)
              // Keep the same structure as ENTREPRISE
              return res.status(200).send({ user: newCfa })
            }
          }
          // Validation manuelle de l'utilisateur à effectuer pas un administrateur
          newCfa = await setUserHasToBeManuallyValidated(newCfa._id)
          await notifyToSlack(slackNotification)
          // Keep the same structure as ENTREPRISE
          return res.status(200).send({ user: newCfa })
        }
        default: {
          throw Boom.badRequest("unsupported type")
        }
      }
    }
  )

  /**
   * Désactiver les mises en relations avec les entreprises
   */

  server.post(
    "/etablissement/:establishment_siret/proposition/unsubscribe",
    {
      schema: zRoutes.post["/etablissement/:establishment_siret/proposition/unsubscribe"],
      onRequest: [server.auth(zRoutes.post["/etablissement/:establishment_siret/proposition/unsubscribe"])],
    },
    async (req, res) => {
      await etablissementUnsubscribeDemandeDelegation(req.params.establishment_siret)
      return res.status(200).send({ ok: true })
    }
  )

  /**
   * Mise à jour d'un partenaire
   */

  server.put(
    "/etablissement/:id",
    {
      schema: zRoutes.put["/etablissement/:id"],
      onRequest: [server.auth(zRoutes.put["/etablissement/:id"])],
    },
    async (req, res) => {
      const { _id, ...rest } = req.body
      const exists = await UserRecruteur.findOne({ email: req.body.email?.toLocaleLowerCase(), _id: { $ne: _id } })
      if (exists) {
        throw Boom.badRequest("L'adresse mail est déjà associée à un compte La bonne alternance.")
      }
      await updateUser({ _id: req.params.id }, rest)
      return res.status(200).send({ ok: true })
    }
  )

  server.post(
    "/etablissement/validation",
    {
      schema: zRoutes.post["/etablissement/validation"],
      onRequest: [server.auth(zRoutes.post["/etablissement/validation"])],
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.post["/etablissement/validation"]).value

      // Validate email
      const userRecruteur = await validateEtablissementEmail(user.identity.email)

      if (!userRecruteur) {
        throw Boom.badRequest("La validation de l'adresse mail à échoué. Merci de contacter le support La bonne alternance.")
      }

      const isUserAwaiting = getUserStatus(userRecruteur.status) === ETAT_UTILISATEUR.ATTENTE

      if (!isUserAwaiting) {
        await sendWelcomeEmailToUserRecruteur(userRecruteur)
      }

      const connectedUser = await updateLastConnectionDate(userRecruteur.email)

      if (!connectedUser) {
        throw Boom.forbidden()
      }

      await startSession(userRecruteur.email, res)

      return res.status(200).send(toPublicUser(connectedUser))
    }
  )
}
