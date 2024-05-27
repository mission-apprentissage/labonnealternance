import Boom from "boom"
import { assertUnreachable, toPublicUser, zRoutes } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { RECRUITER_STATUS } from "shared/constants/recruteur"
import { AccessStatus } from "shared/models/roleManagement.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { Cfa, Recruiter } from "@/common/model"
import { startSession } from "@/common/utils/session.service"
import config from "@/config"
import { userWithAccountToUserForToken } from "@/security/accessTokenService"
import { getUserFromRequest } from "@/security/authenticationService"
import { generateCfaCreationToken, generateDepotSimplifieToken } from "@/services/appLinks.service"
import {
  entrepriseOnboardingWorkflow,
  etablissementUnsubscribeDemandeDelegation,
  getEntrepriseDataFromSiret,
  getOpcoData,
  getOrganismeDeFormationDataFromSiret,
  sendUserConfirmationEmail,
  validateCreationEntrepriseFromCfa,
} from "@/services/etablissement.service"
import { getMainRoleManagement, getPublicUserRecruteurPropsOrError } from "@/services/roleManagement.service"
import {
  autoValidateUser,
  createOrganizationUser,
  sendWelcomeEmailToUserRecruteur,
  setUserHasToBeManuallyValidated,
  updateLastConnectionDate,
  updateUserWithAccountFields,
} from "@/services/userRecruteur.service"
import { emailHasActiveRole, getUserWithAccountByEmail, isUserDisabled, isUserEmailChecked, validateUserWithAccountEmail } from "@/services/userWithAccount.service"

import { getAllDomainsFromEmailList, getEmailDomain, isEmailFromPrivateCompany, isUserMailExistInReferentiel } from "../../common/utils/mailUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"
import { getNearEtablissementsFromRomes } from "../../services/catalogue.service"
import { CFA, ENTREPRISE } from "../../services/constant.service"
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

      const result = await getEntrepriseDataFromSiret({ siret, type: cfa_delegated_siret ? CFA : ENTREPRISE })

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
    "/etablissement/cfa/:cfaId/entreprises",
    {
      schema: zRoutes.get["/etablissement/cfa/:cfaId/entreprises"],
      onRequest: [server.auth(zRoutes.get["/etablissement/cfa/:cfaId/entreprises"])],
    },
    async (req, res) => {
      const { cfaId } = req.params
      const cfa = await Cfa.findOne({ _id: cfaId }).lean()
      if (!cfa) {
        throw Boom.notFound(`Aucun CFA ayant pour id ${cfaId.toString()}`)
      }
      const cfa_delegated_siret = cfa.siret
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
      const { type } = req.body
      switch (type) {
        case ENTREPRISE: {
          const siret = req.body.establishment_siret
          const cfa_delegated_siret = req.body.cfa_delegated_siret ?? undefined
          const result = await entrepriseOnboardingWorkflow.create({ ...req.body, siret, cfa_delegated_siret })
          if ("error" in result) {
            if (result.errorCode === BusinessErrorCodes.ALREADY_EXISTS) throw Boom.forbidden(result.message, result)
            else throw Boom.badRequest(result.message, result)
          }
          const token = generateDepotSimplifieToken(userWithAccountToUserForToken(result.user), result.formulaire.establishment_id, siret)
          return res.status(200).send({ formulaire: result.formulaire, user: result.user, token, validated: result.validated })
        }
        case CFA: {
          const { email, establishment_siret } = req.body
          const origin = req.body.origin ?? "formulaire public de création"
          const formatedEmail = email.toLocaleLowerCase()
          // check if user already exist
          if (await emailHasActiveRole(formatedEmail)) {
            throw Boom.forbidden("L'adresse mail est déjà associée à un compte La bonne alternance.")
          }

          const siretInfos = await getOrganismeDeFormationDataFromSiret(establishment_siret)
          const { contacts } = siretInfos

          // Creation de l'utilisateur en base de données
          const creationResult = await createOrganizationUser({ ...req.body, ...siretInfos, is_email_checked: false, origin })
          const userCfa = creationResult.user

          const slackNotification = {
            subject: "RECRUTEUR",
            message: `Nouvel OF en attente de validation - ${config.publicUrl}/espace-pro/administration/users/${userCfa._id}`,
          }
          const token = generateCfaCreationToken(userWithAccountToUserForToken(userCfa), establishment_siret)
          if (!contacts.length) {
            // Validation manuelle de l'utilisateur à effectuer pas un administrateur
            await setUserHasToBeManuallyValidated(creationResult, origin)
            await notifyToSlack(slackNotification)
            return res.status(200).send({ user: userCfa, validated: false, token })
          }
          if (isUserMailExistInReferentiel(contacts, email)) {
            // Validation automatique de l'utilisateur
            await autoValidateUser(creationResult, origin, "l'email correspond à un contact")
            await sendUserConfirmationEmail(userCfa)
            // Keep the same structure as ENTREPRISE
            return res.status(200).send({ user: userCfa, validated: true, token })
          }
          if (isEmailFromPrivateCompany(formatedEmail)) {
            const domains = getAllDomainsFromEmailList(contacts.map(({ email }) => email))
            const userEmailDomain = getEmailDomain(formatedEmail)
            if (userEmailDomain && domains.includes(userEmailDomain)) {
              // Validation automatique de l'utilisateur
              await autoValidateUser(creationResult, origin, "le nom de domaine de l'email correspond à celui d'un contact")
              await sendUserConfirmationEmail(userCfa)
              // Keep the same structure as ENTREPRISE
              return res.status(200).send({ user: userCfa, validated: true, token })
            }
          }
          // Validation manuelle de l'utilisateur à effectuer pas un administrateur
          await setUserHasToBeManuallyValidated(creationResult, origin)
          await notifyToSlack(slackNotification)
          // Keep the same structure as ENTREPRISE
          return res.status(200).send({ user: userCfa, validated: false, token })
        }
        default: {
          assertUnreachable(type)
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
      const result = await updateUserWithAccountFields(req.params.id, rest)
      if ("error" in result) {
        throw Boom.badRequest("L'adresse mail est déjà associée à un compte La bonne alternance.")
      }
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
      const userFromRequest = getUserFromRequest(req, zRoutes.post["/etablissement/validation"]).value
      const email = userFromRequest.identity.email.toLocaleLowerCase()

      const user = await getUserWithAccountByEmail(email)
      if (!user) {
        throw Boom.badRequest("La validation de l'adresse mail a échoué. Merci de contacter le support La bonne alternance.")
      }
      if (isUserDisabled(user)) {
        throw Boom.forbidden("Votre compte est désactivé. Merci de contacter le support La bonne alternance.")
      }
      if (!isUserEmailChecked(user)) {
        await validateUserWithAccountEmail(user._id.toString())
      }
      const mainRole = await getMainRoleManagement(user._id, true)
      if (getLastStatusEvent(mainRole?.status)?.status === AccessStatus.GRANTED) {
        await sendWelcomeEmailToUserRecruteur(user)
      }

      await updateLastConnectionDate(email)
      await startSession(email, res)
      return res.status(200).send(toPublicUser(user, await getPublicUserRecruteurPropsOrError(user._id, true)))
    }
  )
}
