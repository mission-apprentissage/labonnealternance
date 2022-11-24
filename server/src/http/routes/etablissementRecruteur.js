/* eslint-disable */
import express from "express"
import joi from "joi"
import { mailTemplate } from "../../assets/index.js"
import { getAktoEstablishmentVerification } from "../../common/akto.js"
import { getNearEtablissementsFromRomes } from "../../common/catalogue.js"
import { CFA, etat_utilisateur, OPCOS, validation_utilisateur } from "../../common/constants.js"
import { createUserToken } from "../../common/utils/jwtUtils.js"
import { checkIfUserEmailIsPrivate, checkIfUserMailExistInReferentiel, getAllDomainsFromEmailList } from "../../common/utils/mailUtils.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"
import config from "../../config.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

const getCfaRomeSchema = joi.object({
  latitude: joi.number().required(),
  longitude: joi.number().required(),
  rome: joi.array().items(joi.string()).required(),
})

let token = {}

export default ({ etablissementsRecruteur, usersRecruteur, formulaire, mailer }) => {
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
      if (!req.params.siret) {
        return res.status(400).json({ error: true, message: "Le numéro siret est obligatoire." })
      }

      const result = await etablissementsRecruteur.getEtablissementFromGouv(req.params.siret)

      if (result?.error === true) {
        return res.status(400).json({ error: true, message: "Le service est momentanément indisponible." })
      }

      if (!result) {
        return res.status(400).json({ error: true, message: "Le numéro siret est invalide." })
      }

      if (result.data?.etablissement.etat_administratif.value === "F") {
        return res.status(400).json({ error: true, message: "Cette entreprise est considérée comme fermée." })
      }

      // Check if a CFA already has the company as partenaire
      if (req.query.fromDashboardCfa) {
        const exist = await formulaire.getFormulaire({
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
        if (result.data?.etablissement.naf.startsWith("85")) {
          return res.status(400).json({
            error: true,
            message: "Le numéro siret n'est pas référencé comme une entreprise.",
            isCfa: true,
          })
        }
      }

      let response = etablissementsRecruteur.formatEntrepriseData(result.data.etablissement)
      let opcoResult

      opcoResult = await etablissementsRecruteur.getOpco(req.params.siret)

      if (opcoResult.data?.searchStatus === "NOT_FOUND") {
        opcoResult = await etablissementsRecruteur.getIdcc(req.params.siret)

        if (opcoResult.data[0].conventions?.length !== 0) {
          const { num } = opcoResult.data[0]?.conventions[0]
          opcoResult = await etablissementsRecruteur.getOpcoByIdcc(num)
        }
      }

      response.opco = opcoResult.data?.opcoName ?? undefined
      response.idcc = opcoResult.data?.idcc ?? undefined
      response.geo_coordonnees = await etablissementsRecruteur.getGeoCoordinates(`${response.rue}, ${response.code_postal}, ${response.commune}`)

      return res.json(response)
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

      const exist = await etablissementsRecruteur.getEtablissement({ siret: req.params.siret, type: CFA })

      if (exist) {
        return res.status(403).json({
          error: true,
          reason: "EXIST",
        })
      }

      const referentiel = await etablissementsRecruteur.getEtablissementFromReferentiel(req.params.siret)

      if (!referentiel) {
        return res.status(400).json({
          error: true,
          reason: "UNKNOWN",
        })
      }

      if (referentiel?.data?.etat_administratif === "fermé") {
        return res.status(400).json({
          error: true,
          reason: "CLOSED",
        })
      }

      if (!referentiel?.data?.qualiopi) {
        return res.status(400).json({
          data: { ...etablissementsRecruteur.formatReferentielData(referentiel.data) },
          error: true,
          reason: "QUALIOPI",
        })
      }

      return res.json({ ...etablissementsRecruteur.formatReferentielData(referentiel.data) })
    })
  )

  /**
   * Enregistrement d'un partenaire
   */

  router.post(
    "/creation",
    tryCatch(async (req, res) => {
      const exist = await usersRecruteur.getUser({ email: req.body.email })
      const ENTREPRISE = req.body.type === "ENTREPRISE"
      let formulaireInfo, partenaire

      if (exist) {
        return res.status(403).json({ error: true, message: "L'adresse mail est déjà associée à un compte Matcha." })
      }

      if (ENTREPRISE) {
        formulaireInfo = await formulaire.createFormulaire(req.body)
        partenaire = await usersRecruteur.createUser({ ...req.body, id_form: formulaireInfo.id_form })

        /**
         * Check if siret is amoung the opco verified establishment
         */

        switch (req.body.opco) {
          case OPCOS.AKTO:
            const siren = req.body.siret.substr(0, 9)
            const isValid = await getAktoEstablishmentVerification(siren, req.body.email, token)

            if (isValid) {
              partenaire = await usersRecruteur.updateUserValidationHistory(partenaire._id, {
                validation_type: validation_utilisateur.AUTO,
                user: "SERVEUR",
                statut: etat_utilisateur.VALIDE,
              })
            } else {
              partenaire = await usersRecruteur.updateUserValidationHistory(partenaire._id, {
                validation_type: validation_utilisateur.MANUAL,
                user: "SERVEUR",
                statut: etat_utilisateur.ATTENTE,
              })
            }

            break

          case OPCOS.CONSTRUCTYS:
          case OPCOS.OCAPIAT:
            const existInOpcoReferentiel = await etablissementsRecruteur.getEstablishmentFromOpcoReferentiel(req.body.opco, req.body.siret, req.body.email)

            if (!existInOpcoReferentiel) {
              partenaire = await usersRecruteur.updateUserValidationHistory(partenaire._id, {
                validation_type: validation_utilisateur.MANUAL,
                user: "SERVEUR",
                statut: etat_utilisateur.ATTENTE,
              })
            } else {
              partenaire = await usersRecruteur.updateUserValidationHistory(partenaire._id, {
                validation_type: validation_utilisateur.AUTO,
                user: "SERVEUR",
                statut: etat_utilisateur.VALIDE,
              })
            }

            break

          default:
            partenaire = await usersRecruteur.updateUserValidationHistory(partenaire._id, {
              validation_type: validation_utilisateur.MANUAL,
              user: "SERVEUR",
              statut: etat_utilisateur.ATTENTE,
            })
            break
        }

        // Dépot simplifié : retourner les informations nécessaire à la suite du parcours
        return res.json({ formulaire: formulaireInfo, user: partenaire })
      } else {
        /**
         * Contrôle du mail avec le référentiel :
         */

        let referentiel = await etablissementsRecruteur.getEtablissementFromReferentiel(req.body.siret)

        // Creation de l'utilisateur en base de données
        partenaire = await usersRecruteur.createUser(req.body)

        if (referentiel.data.contacts.length) {
          const userMailExist = checkIfUserMailExistInReferentiel(referentiel.data.contacts, req.body.email)
          const userMailisPrivate = checkIfUserEmailIsPrivate(req.body.email)

          if (userMailExist) {
            // Validation automatique de l'utilisateur
            partenaire = await usersRecruteur.updateUserValidationHistory(partenaire._id, {
              validation_type: validation_utilisateur.AUTO,
              user: "SERVEUR",
              statut: etat_utilisateur.VALIDE,
            })

            let { email, _id, nom, prenom } = partenaire

            const url = etablissement.getValidationUrl(_id)

            await mailer.sendEmail({
              to: email,
              subject: "La bonne alternance — Confirmer votre adresse mail",
              template: mailTemplate["mail-confirmation-email"],
              data: {
                prenom,
                nom,
                confirmation_url: url,
              },
            })

            // Keep the same structure as ENTREPRISE
            return res.json({ user: partenaire })
          }

          if (userMailisPrivate && !userMailExist) {
            // Récupération des noms de domain
            const domains = getAllDomainsFromEmailList(referentiel.data.contacts)
            const userEmailDomain = req.body.email.split("@")[1]

            if (domains.includes(userEmailDomain)) {
              // Validation automatique de l'utilisateur
              partenaire = await usersRecruteur.updateUserValidationHistory(partenaire._id, {
                validation_type: validation_utilisateur.AUTO,
                user: "SERVEUR",
                statut: etat_utilisateur.VALIDE,
              })

              let { email, _id, nom, prenom } = partenaire

              const url = etablissement.getValidationUrl(_id)

              await mailer.sendEmail({
                to: email,
                subject: "La bonne alternance — Confirmer votre adresse mail",
                template: mailTemplate["mail-confirmation-email"],
                data: {
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
          partenaire = await usersRecruteur.updateUserValidationHistory(partenaire._id, {
            validation_type: validation_utilisateur.MANUAL,
            user: "SERVEUR",
            statut: etat_utilisateur.ATTENTE,
          })

          notifyToSlack("NOUVEAU CFA", `en attente de validation - ${partenaire.email} - https://referentiel.apprentissage.beta.gouv.fr/organismes/${partenaire.siret}`)

          return res.json({ user: partenaire })
        } else {
          // Validation manuelle de l'utilisateur à effectuer pas un administrateur
          partenaire = await usersRecruteur.updateUserValidationHistory(partenaire._id, {
            validation_type: validation_utilisateur.MANUAL,
            user: "SERVEUR",
            statut: etat_utilisateur.ATTENTE,
          })

          notifyToSlack("NOUVEAU CFA", `en attente de validation - ${partenaire.email} - https://referentiel.apprentissage.beta.gouv.fr/organismes/${partenaire.siret}`)

          return res.json({ user: partenaire })
        }
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

      // Validate email
      const validation = await etablissementsRecruteur.validateEtablissementEmail(id)

      if (!validation) {
        return res.status(400).json({
          error: true,
          message: "La validation de l'adresse mail à échoué. Merci de contacter le support Matcha.",
        })
      }

      const user = await usersRecruteur.getUser({ _id: req.body.id })

      await mailer.sendEmail({
        to: user.email,
        subject: "Bienvenue sur La bonne alternance",
        template: mailTemplate["mail-bienvenue"],
        data: {
          raison_sociale: user.raison_sociale,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          mandataire: user.type === CFA,
          url: `${config.publicUrlEspacePro}/authentification`,
        },
      })

      await usersRecruteur.registerUser(user.email)

      // Log the user in directly
      return res.json({ token: createUserToken(user) })
    })
  )

  return router
}
