import { badRequest, forbidden, internal, notFound } from "@hapi/boom"
import { assertUnreachable, IEntreprise, toPublicUser, TrafficType, zRoutes } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { CFA, ENTREPRISE } from "shared/constants/index"
import { OPCOS_LABEL, RECRUITER_STATUS } from "shared/constants/recruteur"
import { EntrepriseEngagementSources } from "shared/models/referentielEngagementEntreprise.model"

import { getSourceFromCookies } from "@/common/utils/httpUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { startSession } from "@/common/utils/session.service"
import config from "@/config"
import { userWithAccountToUserForToken } from "@/security/accessTokenService"
import { getUserFromRequest } from "@/security/authenticationService"
import { generateCfaCreationToken, generateDepotSimplifieToken } from "@/services/appLinks.service"
import {
  entrepriseOnboardingWorkflow,
  etablissementUnsubscribeDemandeDelegation,
  getCfaSiretInfos,
  getEntrepriseDataFromSiret,
  getOpcoData,
  isCfaCreationValid,
  sendUserConfirmationEmail,
  validateCreationEntrepriseFromCfa,
  validateEligibiliteCfa,
} from "@/services/etablissement.service"
import { Organization, upsertEntrepriseData, UserAndOrganization } from "@/services/organization.service"
import { getEntrepriseHandiEngagement } from "@/services/referentielEngagementEntreprise.service"
import { getMainRoleManagement, getPublicUserRecruteurPropsOrError, isGrantedAndAutoValidatedRole } from "@/services/roleManagement.service"
import { saveUserTrafficSourceIfAny } from "@/services/trafficSource.service"
import {
  autoValidateUser,
  createOrganizationUser,
  sendWelcomeEmailToUserRecruteur,
  setUserHasToBeManuallyValidated,
  updateLastConnectionDate,
} from "@/services/userRecruteur.service"
import { getUserWithAccountByEmail, isUserDisabled, isUserEmailChecked, validateUserWithAccountEmail } from "@/services/userWithAccount.service"

import { getAllDomainsFromEmailList, getEmailDomain, isEmailFromPrivateCompany, isUserMailExistInReferentiel } from "../../common/utils/mailUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"
import { getNearEtablissementsFromRomes } from "../../services/catalogue.service"
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
      const { latitude, longitude, rome, limit } = req.query
      const etablissements = await getNearEtablissementsFromRomes({ rome: [rome], origin: { latitude: latitude, longitude: longitude }, limit })
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
      const { siret } = req.params
      const cfa_delegated_siret: string | undefined = req.query.cfa_delegated_siret
      const skipUpdate: boolean = req.query.skipUpdate === "true"

      let entrepriseOpt: IEntreprise | null = null
      if (skipUpdate) {
        entrepriseOpt = await getDbCollection("entreprises").findOne({ siret })
      }
      if (!entrepriseOpt) {
        const siretResponse = await getEntrepriseDataFromSiret({ siret, type: cfa_delegated_siret ? CFA : ENTREPRISE })
        entrepriseOpt = await upsertEntrepriseData(siret, "création de compte entreprise", siretResponse, false)
        if ("error" in siretResponse) {
          throw badRequest(siretResponse.message, siretResponse)
        }
      }

      const cfaVerification = await validateCreationEntrepriseFromCfa({ siret, cfa_delegated_siret, nafCode: entrepriseOpt.naf_code ?? undefined })
      if (cfaVerification) {
        throw badRequest(cfaVerification.message)
      }

      const engagementHandicap = await getEntrepriseHandiEngagement(siret)

      return res.status(200).send({
        ...entrepriseOpt,
        engagementHandicapOrigin: engagementHandicap?.sources?.includes(EntrepriseEngagementSources.FRANCE_TRAVAIL)
          ? EntrepriseEngagementSources.FRANCE_TRAVAIL
          : engagementHandicap?.sources?.[0],
      })
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
        throw badRequest("Le numéro siret est obligatoire.")
      }
      const result = await getOpcoData(siret)
      if (!result) {
        throw notFound("aucune données OPCO trouvées")
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
        throw badRequest("Le numéro siret est obligatoire.")
      }
      const { address, address_detail, geo_coordinates, raison_sociale, enseigne } = await getCfaSiretInfos(siret)
      return res.status(200).send({ address, address_detail, geo_coordinates, raison_sociale, enseigne, siret })
    }
  )

  /**
   * Récupération des informations d'un cfa à l'aide des tables de correspondances et du référentiel
   */
  server.get(
    "/etablissement/cfa/:siret/validate-creation",
    {
      schema: zRoutes.get["/etablissement/cfa/:siret/validate-creation"],
    },
    async (req, res) => {
      const { siret } = req.params
      if (!siret) {
        throw badRequest("Le numéro siret est obligatoire.")
      }
      const isValid = await isCfaCreationValid(siret)
      if (!isValid) {
        throw forbidden("Ce numéro siret est déjà associé à un compte utilisateur.", { reason: BusinessErrorCodes.ALREADY_EXISTS })
      }
      await validateEligibiliteCfa(siret)
      return res.status(200).send({})
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
      const cfa = await getDbCollection("cfas").findOne({ _id: cfaId })
      if (!cfa) {
        throw notFound(`Aucun CFA ayant pour id ${cfaId.toString()}`)
      }
      const cfa_delegated_siret = cfa.siret
      if (!cfa_delegated_siret) {
        throw internal(`inattendu : le cfa n'a pas de champ cfa_delegated_siret`)
      }
      const entreprises = await getDbCollection("recruiters")
        .find({ status: { $in: [RECRUITER_STATUS.ACTIF, RECRUITER_STATUS.EN_ATTENTE_VALIDATION] }, cfa_delegated_siret })
        .toArray()
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
          const opco = (req.body.opco as OPCOS_LABEL) || OPCOS_LABEL.UNKNOWN_OPCO
          const result = await entrepriseOnboardingWorkflow.create({ ...req.body, opco, siret, source: getSourceFromCookies(req) })
          if ("error" in result) {
            if (result.errorCode === BusinessErrorCodes.ALREADY_EXISTS) throw forbidden(result.message, result)
            else throw badRequest(result.message, result)
          }
          const token = generateDepotSimplifieToken(userWithAccountToUserForToken(result.user), result.formulaire.establishment_id)
          return res.status(200).send({ formulaire: result.formulaire, user: result.user, token, validated: result.validated })
        }
        case CFA: {
          const { email, establishment_siret, first_name, last_name, phone } = req.body
          const origin = req.body.origin ?? "formulaire public de création"
          const formatedEmail = email.toLocaleLowerCase()
          // check if user already exist
          if (await getUserWithAccountByEmail(formatedEmail)) {
            throw forbidden("L'adresse mail est déjà associée à un compte La bonne alternance.")
          }

          const isValid = await isCfaCreationValid(establishment_siret)
          if (!isValid) {
            throw forbidden("Ce numéro siret est déjà associé à un compte utilisateur.", { reason: BusinessErrorCodes.ALREADY_EXISTS })
          }

          const {
            referentiel: { contacts },
            cfa,
          } = await validateEligibiliteCfa(establishment_siret, origin)

          const organization: Organization = { type: CFA, cfa }
          const { user: userCfa } = await createOrganizationUser({
            userFields: {
              first_name,
              last_name,
              phone,
              email: formatedEmail,
              origin,
            },
            is_email_checked: false,
            organization: { type: CFA, cfa },
          })
          await saveUserTrafficSourceIfAny({ user_id: userCfa._id, type: TrafficType.CFA, source: getSourceFromCookies(req) })

          const slackNotification = {
            subject: "RECRUTEUR",
            message: `Nouvel OF en attente de validation - ${config.publicUrl}/espace-pro/administration/users/${userCfa._id}`,
          }
          const token = generateCfaCreationToken(userWithAccountToUserForToken(userCfa))
          const userAndOrganization: UserAndOrganization = { user: userCfa, organization }
          if (!contacts.length) {
            // Validation manuelle de l'utilisateur à effectuer pas un administrateur
            await setUserHasToBeManuallyValidated(userAndOrganization, origin)
            await notifyToSlack(slackNotification)
            return res.status(200).send({ user: userCfa, validated: false, token })
          }
          if (isUserMailExistInReferentiel(contacts, email)) {
            // Validation automatique de l'utilisateur
            await autoValidateUser(userAndOrganization, origin, "l'email correspond à un contact")
            await sendUserConfirmationEmail(userCfa)
            // Keep the same structure as ENTREPRISE
            return res.status(200).send({ user: userCfa, validated: true, token })
          }
          if (isEmailFromPrivateCompany(formatedEmail)) {
            const domains = getAllDomainsFromEmailList(contacts.map(({ email }) => email))
            const userEmailDomain = getEmailDomain(formatedEmail)
            if (userEmailDomain && domains.includes(userEmailDomain)) {
              // Validation automatique de l'utilisateur
              await autoValidateUser(userAndOrganization, origin, "le nom de domaine de l'email correspond à celui d'un contact")
              await sendUserConfirmationEmail(userCfa)
              // Keep the same structure as ENTREPRISE
              return res.status(200).send({ user: userCfa, validated: true, token })
            }
          }
          // Validation manuelle de l'utilisateur à effectuer pas un administrateur
          await setUserHasToBeManuallyValidated(userAndOrganization, origin)
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
        throw badRequest("La validation de l'adresse mail a échoué. Merci de contacter le support La bonne alternance.")
      }
      if (isUserDisabled(user)) {
        throw forbidden("Votre compte est désactivé. Merci de contacter le support La bonne alternance.")
      }
      if (!isUserEmailChecked(user)) {
        await validateUserWithAccountEmail(user._id)

        const mainRole = await getMainRoleManagement(user._id, true)
        if (mainRole && isGrantedAndAutoValidatedRole(mainRole)) {
          await sendWelcomeEmailToUserRecruteur(user)
        }
      }

      await updateLastConnectionDate(email)
      await startSession(email, res)
      return res.status(200).send(toPublicUser(user, await getPublicUserRecruteurPropsOrError(user._id, true)))
    }
  )
}
