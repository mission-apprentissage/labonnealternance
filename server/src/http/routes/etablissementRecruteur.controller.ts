import express, { Request } from "express"
import joi from "joi"
import { createFormulaire, getFormulaire } from "../../services/formulaire.service.js"
import { mailTemplate } from "../../assets/index.js"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR, OPCOS, VALIDATION_UTILISATEUR } from "../../services/constant.service.js"
import { createMagicLinkToken, createUserRecruteurToken } from "../../common/utils/jwtUtils.js"
import { checkIfUserEmailIsPrivate, checkIfUserMailExistInReferentiel, getAllDomainsFromEmailList } from "../../common/utils/mailUtils.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"
import config from "../../config.js"
import { getNearEtablissementsFromRomes } from "../../services/catalogue.service.js"
import {
  etablissementUnsubscribeDemandeDelegation,
  formatEntrepriseData,
  formatReferentielData,
  getAllEstablishmentFromBonneBoite,
  getAllEstablishmentFromBonneBoiteLegacy,
  getAllEstablishmentFromOpcoReferentiel,
  getEtablissement,
  getEtablissementFromGouv,
  getEtablissementFromReferentiel,
  getGeoCoordinates,
  getIdcc,
  getMatchingDomainFromContactList,
  getMatchingEmailFromContactList,
  getOpco,
  getOpcoByIdcc,
  getValidationUrl,
  validateEtablissementEmail,
} from "../../services/etablissement.service.js"
import { ICFADock } from "../../services/etablissement.service.types.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { validationOrganisation } from "../../services/bal.service.js"
import { IUserRecruteur } from "../../common/model/schema/userRecruteur/userRecruteur.types.js"
import { IRecruiter } from "../../common/model/schema/recruiter/recruiter.types.js"
import { updateUserValidationHistory, getUser, createUser, updateUser, getUserValidationState, registerUser } from "../../services/userRecruteur.service.js"
import { sentryCaptureException } from "../../common/utils/sentryUtils.js"

const getCfaRomeSchema = joi.object({
  latitude: joi.number().required(),
  longitude: joi.number().required(),
  rome: joi.array().items(joi.string()).required(),
})

export default ({ mailer }) => {
  const router = express.Router()

  const autoValidateUser = async (userId) =>
    await updateUserValidationHistory(userId, {
      validation_type: VALIDATION_UTILISATEUR.AUTO,
      user: "SERVEUR",
      status: ETAT_UTILISATEUR.VALIDE,
    })

  const setManualValidation = async (userId) =>
    await updateUserValidationHistory(userId, {
      validation_type: VALIDATION_UTILISATEUR.MANUAL,
      user: "SERVEUR",
      status: ETAT_UTILISATEUR.ATTENTE,
    })

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
      if (!req.params.siret) {
        return res.status(400).json({ error: true, message: "Le numéro siret est obligatoire." })
      }
      try {
        const result = await getEtablissementFromGouv(req.params.siret)

        if (!result) {
          return res.status(400).json({ error: true, message: "Le numéro siret est invalide." })
        }

        if (result.data.etat_administratif === "F") {
          return res.status(400).json({ error: true, message: "Cette entreprise est considérée comme fermée." })
        }

        // Check if a CFA already has the company as partenaire
        if (req.query.fromDashboardCfa) {
          const exist = await getFormulaire({
            establishment_siret: req.params.siret,
            cfa_delegated_siret: req.query.cfa_delegated_siret,
            status: "Actif",
          })

          if (exist) {
            return res.status(400).json({
              error: true,
              message: "L'entreprise est déjà référencée comme partenaire.",
            })
          }
        }

        // Allow cfa to add themselves as a company
        if (!req.query.fromDashboardCfa) {
          if (result.data.activite_principale.code.startsWith("85")) {
            return res.status(400).json({
              error: true,
              message: "Le numéro siret n'est pas référencé comme une entreprise.",
              isCfa: true,
            })
          }
        }

        const entrepriseData = formatEntrepriseData(result.data)
        const geo_coordinates = await getGeoCoordinates(`${entrepriseData.address_detail.acheminement_postal.l4}, ${entrepriseData.address_detail.acheminement_postal.l6}`)

        const opcoResult: ICFADock | null = await getOpco(req.params.siret)
        const opcoData: { opco?: string; idcc?: string | number } = {}

        switch (opcoResult?.searchStatus) {
          case "OK": {
            opcoData.opco = opcoResult.opcoName
            opcoData.idcc = opcoResult.idcc
            break
          }
          case "MULTIPLE_OPCO": {
            opcoData.opco = "Opco multiple"
            opcoData.idcc = "Opco multiple, IDCC non défini"
            break
          }
          case null:
          case "NOT_FOUND": {
            const idccResult = await getIdcc(req.params.siret)
            if (idccResult[0].conventions.length) {
              const { num } = opcoResult[0]?.conventions[0]
              const opcoByIdccResult = await getOpcoByIdcc(num)
              if (opcoByIdccResult) {
                opcoData.opco = opcoByIdccResult.opcoName
                opcoData.idcc = opcoByIdccResult.idcc
              }
            }
            break
          }
        }

        res.json({ ...entrepriseData, ...opcoData, geo_coordinates })
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
      const exist = await getUser({ email: req.body.email })

      if (exist) {
        return res.status(403).json({ error: true, message: "L'adresse mail est déjà associée à un compte La bonne alternance." })
      }

      switch (req.body.type) {
        case ENTREPRISE: {
          const siren = req.body.establishment_siret.slice(0, 9)
          const formulaireInfo = await createFormulaire(req.body)
          let newEntreprise: IUserRecruteur = await createUser({ ...req.body, establishment_id: formulaireInfo.establishment_id })

          // Get all corresponding records using the SIREN number in BonneBoiteLegacy collection
          const [bonneBoiteLegacyList, bonneBoiteList, referentielOpcoList] = await Promise.all([
            getAllEstablishmentFromBonneBoiteLegacy({ siret: { $regex: siren }, email: { $nin: ["", undefined] } }),
            getAllEstablishmentFromBonneBoite({ siret: { $regex: siren }, email: { $nin: ["", undefined] } }),
            getAllEstablishmentFromOpcoReferentiel({ siret_code: { $regex: siren } }),
          ])

          // Format arrays to get only the emails
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
          const balControl = await validationOrganisation(req.body.establishment_siret, req.body.email)

          if (balControl.is_valid) {
            newEntreprise = await autoValidateUser(newEntreprise._id)
          } else {
            if (emailListUnique.length) {
              if (getMatchingEmailFromContactList(newEntreprise.email, emailListUnique)) {
                newEntreprise = await autoValidateUser(newEntreprise._id)
              } else if (checkIfUserEmailIsPrivate(newEntreprise.email) && getMatchingDomainFromContactList(newEntreprise.email, emailListUnique)) {
                newEntreprise = await autoValidateUser(newEntreprise._id)
              } else {
                newEntreprise = await setManualValidation(newEntreprise._id)
              }
            } else {
              newEntreprise = await setManualValidation(newEntreprise._id)
            }
          }

          // Dépot simplifié : retourner les informations nécessaire à la suite du parcours
          return res.json({ formulaire: formulaireInfo, user: newEntreprise })
        }
        case CFA: {
          // Contrôle du mail avec le référentiel :
          const referentiel = await getEtablissementFromReferentiel(req.body.establishment_siret)
          // Creation de l'utilisateur en base de données
          let newCfa: IUserRecruteur = await createUser(req.body)

          if (!referentiel.contacts.length) {
            // Validation manuelle de l'utilisateur à effectuer pas un administrateur
            newCfa = await setManualValidation(newCfa._id)

            await notifyToSlack({
              subject: "RECRUTEUR",
              message: `Nouvel OF en attente de validation - ${newCfa.email} - https://referentiel.apprentissage.beta.gouv.fr/organismes/${newCfa.establishment_siret}`,
            })

            return res.json({ user: newCfa })
          }

          if (checkIfUserMailExistInReferentiel(referentiel.contacts, req.body.email)) {
            // Validation automatique de l'utilisateur
            newCfa = await autoValidateUser(newCfa._id)

            const { email, _id, last_name, first_name } = newCfa

            const url = getValidationUrl(_id)

            await mailer.sendEmail({
              to: email,
              subject: "La bonne alternance — Confirmer votre adresse mail",
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

          if (checkIfUserEmailIsPrivate(req.body.email)) {
            // Récupération des noms de domain
            const domains = getAllDomainsFromEmailList(referentiel.contacts)
            const userEmailDomain = req.body.email.split("@")[1]

            if (domains.includes(userEmailDomain)) {
              // Validation automatique de l'utilisateur
              newCfa = await autoValidateUser(newCfa._id)

              const { email, _id, last_name, first_name } = newCfa

              const url = getValidationUrl(_id)

              await mailer.sendEmail({
                to: email,
                subject: "La bonne alternance — Confirmer votre adresse mail",
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
          newCfa = await setManualValidation(newCfa._id)

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

      const magiclink = `${config.publicUrlEspacePro}/authentification/verification?token=${createMagicLinkToken(user.email)}`

      const { email, first_name, last_name, establishment_raison_sociale, type } = user

      await mailer.sendEmail({
        to: email,
        subject: "Bienvenue sur La bonne alternance",
        template: mailTemplate["mail-bienvenue"],
        data: {
          images: {
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
          },
          establishment_raison_sociale,
          last_name,
          first_name,
          email,
          is_delegated: type === CFA,
          url: magiclink,
        },
      })

      await registerUser(email)

      // Log the user in directly
      return res.json({ token: createUserRecruteurToken(user) })
    })
  )

  return router
}
