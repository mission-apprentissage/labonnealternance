/* eslint-disable */
import express from "express"
import joi from "joi"
import { createFormulaire, getFormulaire } from "../../services/formulaire.service.js"
import { mailTemplate } from "../../assets/index.js"
import { CFA, ENTREPRISE, etat_utilisateur, OPCOS, validation_utilisateur } from "../../common/constants.js"
import { createMagicLinkToken, createUserRecruteurToken } from "../../common/utils/jwtUtils.js"
import { checkIfUserEmailIsPrivate, checkIfUserMailExistInReferentiel, getAllDomainsFromEmailList } from "../../common/utils/mailUtils.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"
import config from "../../config.js"
import { getNearEtablissementsFromRomes } from "../../services/catalogue.service.js"
import {
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
import { ICFADock, ISIRET2IDCC } from "../../services/etablissement.service.types.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { validationOrganisation } from "../../common/bal.js"
import Joi from "joi"
import { siretSchema } from "../utils/validators.js"

const getCfaRomeSchema = joi.object({
  latitude: joi.number().required(),
  longitude: joi.number().required(),
  rome: joi.array().items(joi.string()).required(),
})

let token = {}

export default ({ usersRecruteur, mailer }) => {
  const router = express.Router()

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

        if (result.etablissement.etat_administratif.value === "F") {
          return res.status(400).json({ error: true, message: "Cette entreprise est considérée comme fermée." })
        }

        // Check if a CFA already has the company as partenaire
        if (req.query.fromDashboardCfa) {
          const exist = await getFormulaire({
            siret: req.params.siret,
            gestionnaire: req.query.gestionnaire,
            statut: "Actif",
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
          if (result.etablissement.naf.startsWith("85")) {
            return res.status(400).json({
              error: true,
              message: "Le numéro siret n'est pas référencé comme une entreprise.",
              isCfa: true,
            })
          }
        }

        const entrepriseData = formatEntrepriseData(result.etablissement)
        const geo_coordonnees = await getGeoCoordinates(`${entrepriseData.rue}, ${entrepriseData.code_postal}, ${entrepriseData.commune}`)

        let opcoResult: ICFADock | ISIRET2IDCC = await getOpco(req.params.siret)
        let opcoData = { opco: undefined, idcc: undefined }

        switch (opcoResult?.searchStatus) {
          case "OK":
            opcoData.opco = opcoResult.opcoName
            opcoData.idcc = opcoResult.idcc
            break

          case "MULTIPLE_OPCO":
            opcoData.opco = "Opco multiple"
            opcoData.idcc = "Opco multiple, IDCC non défini"
            break

          case "NOT_FOUND":
            opcoResult = await getIdcc(req.params.siret)
            console.log(opcoResult)
            if (opcoResult[0].conventions.length) {
              const { num } = opcoResult[0]?.conventions[0]
              opcoResult = await getOpcoByIdcc(num)

              opcoData.opco = opcoResult.opcoName
              opcoData.idcc = opcoResult.idcc
            }
            break

          default:
            break
        }

        res.json({ ...entrepriseData, ...opcoData, geo_coordonnees })
      } catch (error) {
        console.log({ error })
        res.status(400).json({ error: true, message: "Le service est momentanément indisponible." })
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

      const exist = await getEtablissement({ siret: req.params.siret, type: CFA })

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
    tryCatch(async (req, res) => {
      let body = await Joi.object({
        email: Joi.string().email().required(),
        type: Joi.string().allow(ENTREPRISE, CFA).required(),
        siret: siretSchema().required(),
      })
        .unknown()
        .validateAsync(req.body, { abortEarly: false })
      const { email, type, siret } = body

      const exist = await usersRecruteur.getUser({ email })
      let formulaireInfo, partenaire

      if (exist) {
        return res.status(403).json({ error: true, message: "L'adresse mail est déjà associée à un compte La bonne alternance." })
      }

      switch (type) {
        case ENTREPRISE:
          const siren = siret.substr(0, 9)
          formulaireInfo = await createFormulaire(body)
          partenaire = await usersRecruteur.createUser({ ...body, id_form: formulaireInfo.id_form })

          // Get all corresponding records using the SIREN number in BonneBoiteLegacy collection
          const [bonneBoiteLegacyList, bonneBoiteList] = await Promise.all([
            getAllEstablishmentFromBonneBoiteLegacy({ siret: { $regex: siren }, email: { $nin: ["", undefined] } }),
            getAllEstablishmentFromBonneBoite({ siret: { $regex: siren }, email: { $nin: ["", undefined] } }),
          ])
          // Create a single array with all emails
          const bonneBoiteLegacyEmailList: string[] = bonneBoiteLegacyList.map(({ email }) => email)
          const bonneBoiteEmailList: string[] = bonneBoiteList.map(({ email }) => email)

          const bonneBoiteFullList: string[] = [...new Set([...bonneBoiteLegacyEmailList, ...bonneBoiteEmailList])]

          let userValidationType = validation_utilisateur.MANUAL

          // Check BAL API for validation
          const balControl = await validationOrganisation(siret, email)

          /**
           * Check if siret is amoung the opco verified establishment
           */
          switch (body.opco) {
            case OPCOS.AKTO:
              if (balControl.is_valid) {
                userValidationType = validation_utilisateur.AUTO
              } else if (bonneBoiteFullList.length) {
                if (getMatchingEmailFromContactList(partenaire.email, bonneBoiteFullList)) {
                  userValidationType = validation_utilisateur.AUTO
                } else if (checkIfUserEmailIsPrivate(partenaire.email) && getMatchingDomainFromContactList(partenaire.email, bonneBoiteFullList)) {
                  userValidationType = validation_utilisateur.AUTO
                }
              }

              break

            default:
              // Get all corresponding records using the SIREN number
              const referentielOpcoList = await getAllEstablishmentFromOpcoReferentiel({ siret_code: { $regex: siren } })

              // Create a single array with all emails
              const referentielOpcoEmailList: string[] = referentielOpcoList.reduce((acc: string[], item) => {
                item.emails.map((x) => acc.push(x))
                return acc
              }, [])

              // Duplicate free email list
              const emailListUnique = [...new Set([...referentielOpcoEmailList, ...bonneBoiteFullList])]

              if (balControl.is_valid) {
                userValidationType = validation_utilisateur.AUTO
              } else if (emailListUnique.length) {
                if (getMatchingEmailFromContactList(partenaire.email, emailListUnique)) {
                  userValidationType = validation_utilisateur.AUTO
                } else if (checkIfUserEmailIsPrivate(partenaire.email) && getMatchingDomainFromContactList(partenaire.email, emailListUnique)) {
                  userValidationType = validation_utilisateur.AUTO
                }
              }

              break
          }

          if (userValidationType === validation_utilisateur.AUTO) {
            partenaire = await autoValidateUser(partenaire._id)
          } else {
            partenaire = await setManualValidation(partenaire._id)
          }

          // Dépot simplifié : retourner les informations nécessaire à la suite du parcours
          return res.json({ formulaire: formulaireInfo, user: partenaire })
        case CFA:
          // Contrôle du mail avec le référentiel :
          let referentiel = await getEtablissementFromReferentiel(siret)
          // Creation de l'utilisateur en base de données
          partenaire = await usersRecruteur.createUser(body)

          if (!referentiel.contacts.length) {
            // Validation manuelle de l'utilisateur à effectuer pas un administrateur
            partenaire = await setManualValidation(partenaire._id)

            await notifyToSlack({
              subject: "RECRUTEUR",
              message: `Nouvel OF en attente de validation - ${partenaire.email} - https://referentiel.apprentissage.beta.gouv.fr/organismes/${partenaire.siret}`,
            })

            return res.json({ user: partenaire })
          }

          if (checkIfUserMailExistInReferentiel(referentiel.contacts, email)) {
            // Validation automatique de l'utilisateur
            partenaire = await autoValidateUser(partenaire._id)

            let { email, _id, nom, prenom } = partenaire

            const url = getValidationUrl(_id)

            await mailer.sendEmail({
              to: email,
              subject: "La bonne alternance — Confirmer votre adresse mail",
              template: mailTemplate["mail-confirmation-email"],
              data: {
                images: {
                  logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
                },
                prenom,
                nom,
                confirmation_url: url,
              },
            })

            // Keep the same structure as ENTREPRISE
            return res.json({ user: partenaire })
          }

          if (checkIfUserEmailIsPrivate(email)) {
            // Récupération des noms de domain
            const domains = getAllDomainsFromEmailList(referentiel.contacts)
            const userEmailDomain = email.split("@")[1]

            if (domains.includes(userEmailDomain)) {
              // Validation automatique de l'utilisateur
              partenaire = await autoValidateUser(partenaire._id)

              let { email, _id, nom, prenom } = partenaire

              const url = getValidationUrl(_id)

              await mailer.sendEmail({
                to: email,
                subject: "La bonne alternance — Confirmer votre adresse mail",
                template: mailTemplate["mail-confirmation-email"],
                data: {
                  images: {
                    logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
                  },
                  prenom,
                  nom,
                  confirmation_url: url,
                },
              })

              // Keep the same structure as ENTREPRISE
              return res.json({ user: partenaire })
            }
          }

          // Validation manuelle de l'utilisateur à effectuer pas un administrateur
          partenaire = await setManualValidation(partenaire._id)

          await notifyToSlack({
            subject: "RECRUTEUR",
            message: `Nouvel OF en attente de validation - ${partenaire.email} - https://referentiel.apprentissage.beta.gouv.fr/organismes/${partenaire.siret}`,
          })

          // Keep the same structure as ENTREPRISE
          return res.json({ user: partenaire })
      }
    })
  )

  /**
   * Récupérer les informations d'un partenaire
   */

  router.get(
    "/:siret",
    tryCatch(async (req, res) => {
      const partenaire = await usersRecruteur.getUser({ siret: req.params.siret })
      res.json(partenaire)
    })
  )
  /**
   * Mise à jour d'un partenaire
   */

  router.put(
    "/:id",
    tryCatch(async (req, res) => {
      let result = await usersRecruteur.updateUser(req.params.id, req.body)
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

      const user = await usersRecruteur.getUser({ _id: req.body.id })
      const isUserAwaiting = usersRecruteur.getUserValidationState(user.etat_utilisateur) === etat_utilisateur.ATTENTE

      if (isUserAwaiting) {
        return res.json({ isUserAwaiting: true })
      }

      const magiclink = `${config.publicUrlEspacePro}/authentification/verification?token=${createMagicLinkToken(user.email)}`

      await mailer.sendEmail({
        to: user.email,
        subject: "Bienvenue sur La bonne alternance",
        template: mailTemplate["mail-bienvenue"],
        data: {
          images: {
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
          },
          raison_sociale: user.raison_sociale,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          mandataire: user.type === CFA,
          url: magiclink,
        },
      })

      await usersRecruteur.registerUser(user.email)

      // Log the user in directly
      return res.json({ token: createUserRecruteurToken(user) })
    })
  )

  return router
}
