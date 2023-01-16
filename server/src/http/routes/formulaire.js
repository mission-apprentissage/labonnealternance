import express from "express"
import { mailTemplate } from "../../assets/index.js"
import { getCatalogueEtablissements, getCatalogueFormations } from "../../common/catalogue.js"
import dayjs from "../../common/dayjs.js"
import { getElasticInstance } from "../../common/esClient/index.js"
import { Formulaire, UserRecruteur } from "../../common/model/index.js"
import config from "../../config.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

const esClient = getElasticInstance()

export default ({ formulaire, mailer, etablissementsRecruteur, application, usersRecruteur }) => {
  const router = express.Router()

  /**
   * Query search endpoint
   */
  router.get(
    "/",
    tryCatch(async (req, res) => {
      let query = JSON.parse(req.query.query)
      const results = await Formulaire.find(query).lean()

      return res.json(results)
    })
  )

  /**
   * Get form from id
   *
   */
  router.get(
    "/:id_form",
    tryCatch(async (req, res) => {
      let result = await formulaire.getFormulaire({ id_form: req.params.id_form })

      if (!result) {
        return res.sendStatus(401)
      }

      await Promise.all(
        result.offres.map(async (offre) => {
          let candidatures = await application.getApplication(offre._id)

          if (candidatures) {
            offre.candidatures = candidatures.length > 0 ? candidatures.length : undefined
          }

          return offre
        })
      )

      return res.json(result)
    })
  )

  /**
   * Post form
   */
  router.post(
    "/",
    tryCatch(async (req, res) => {
      const response = await formulaire.createFormulaire(req.body)

      /**
       * HOTFIX 18/02 : dans le modèle précédent du widget, les utilisateurs n'était pas créé dans la collection UserRecruteur.
       */
      if (req.body.origine === "akto") {
        let exist = await usersRecruteur.getUser({ email: req.body.email })

        if (!exist) {
          await usersRecruteur.createUser({
            ...req.body,
            type: "ENTREPRISE",
            id_form: response.id_form,
            email_valide: true,
          })
        }
      }

      return res.json(response)
    })
  )

  /**
   * Put form
   */
  router.put(
    "/:id_form",
    tryCatch(async (req, res) => {
      const result = await formulaire.updateFormulaire(req.params.id_form, req.body)
      return res.json(result)
    })
  )

  router.delete(
    "/:id_form",
    tryCatch(async (req, res) => {
      await formulaire.archiveFormulaire(req.params.id_form)
      return res.sendStatus(200)
    })
  )

  /**
   * TEMP : get offer from id for front
   * TO BE REPLACE
   */
  router.get(
    "/offre/f/:id_offre",
    tryCatch(async (req, res) => {
      const result = await formulaire.getOffre(req.params.id_offre)
      const offre = result.offres.filter((x) => x._id == req.params.id_offre)

      res.json(offre)
    })
  )

  /**
   * LBA ENDPOINT : get offer from id
   *
   * 25/04/2022 : to export to specific route file with auth for LBA endpoint
   */
  router.get(
    "/offre/:id_offre",
    tryCatch(async (req, res) => {
      const result = await formulaire.getOffre(req.params.id_offre)

      if (!result) {
        return res.status(400).json({ error: true, message: "Not found" })
      }

      result.offres = result.offres.filter((x) => x._id == req.params.id_offre)

      if (result.mandataire === true) {
        const [entreprise_localite] = result.adresse.match(/([0-9]{5})[ ,] ?([A-zÀ-ÿ]*)/) ?? [""]
        const cfa = await etablissementsRecruteur.getEtablissement({ siret: result.gestionnaire })

        result.telephone = cfa.telephone
        result.email = cfa.email
        result.nom = cfa.nom
        result.prenom = cfa.prenom
        result.raison_sociale = cfa.raison_sociale
        result.adresse = cfa.adresse
        result.entreprise_localite = entreprise_localite
      }

      result.events = undefined
      result.mailing = undefined

      return res.json(result)
    })
  )

  /**
   * Create new offer
   */

  router.post(
    "/:id_form/offre",
    tryCatch(async (req, res) => {
      const result = await formulaire.createOffre(req.params.id_form, req.body)

      let { email, raison_sociale, prenom, nom, mandataire, gestionnaire, offres } = result
      let offre = req.body
      let contactCFA

      offre._id = result.offres.filter((x) => x.libelle === offre.libelle)[0]._id

      offre.supprimer = `${config.publicUrlEspacePro}/offre/${offre._id}/cancel`
      offre.pourvue = `${config.publicUrlEspacePro}/offre/${offre._id}/provided`

      // if first offer creation for an Entreprise, send specific mail
      if (offres.length === 1 && mandataire === false) {
        // Get user account
        const user = await usersRecruteur.getUser({ email })
        // Get user account validation link
        const url = etablissementsRecruteur.getValidationUrl(user._id)

        await mailer.sendEmail({
          to: email,
          subject: "La bonne alternance - Merci de valider votre adresse mail pour diffuser votre offre",
          template: mailTemplate["mail-nouvelle-offre-depot-simplifie"],
          data: {
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            confirmation_url: url,
            offres: [offre],
          },
        })

        return res.json(result)
      }

      // get CFA informations if formulaire is handled by a CFA
      if (result.mandataire) {
        contactCFA = await UserRecruteur.findOne({ siret: gestionnaire })
      }

      // Send mail with action links to manage offers
      await mailer.sendEmail({
        to: mandataire ? contactCFA.email : email,
        subject: mandataire
          ? `La bonne alternance - Votre offre d'alternance pour ${raison_sociale} a bien été publiée`
          : `La bonne alternance - Votre offre d'alternance a bien été publiée`,
        template: mailTemplate["mail-nouvelle-offre"],
        data: {
          nom: mandataire ? contactCFA.nom : nom,
          prenom: mandataire ? contactCFA.prenom : prenom,
          raison_sociale,
          mandataire: result.mandataire,
          offres: [offre],
          lba_url:
            config.env !== "recette"
              ? `https://labonnealternance.apprentissage.beta.gouv.fr/recherche-apprentissage?&display=list&page=fiche&type=matcha&itemId=${offre._id}`
              : `https://labonnealternance-recette.apprentissage.beta.gouv.fr/recherche-apprentissage?&display=list&page=fiche&type=matcha&itemId=${offre._id}`,
        },
      })

      return res.json(result)
    })
  )

  /**
   * Create offer delegations
   */
  router.post(
    "/offre/:idOffre/delegation",
    tryCatch(async (req, res) => {
      const { etablissementCatalogueIds } = req.body
      const { idOffre } = req.params

      const offreDocument = await formulaire.getOffre(idOffre)
      const offre = offreDocument.offres.find((offre) => offre._id.toString() === idOffre)

      const { etablissements } = await getCatalogueEtablissements({ _id: { $in: etablissementCatalogueIds } })

      const promises = etablissements.map(async (etablissement) => {
        const { formations } = await getCatalogueFormations(
          {
            $or: [
              {
                etablissement_gestionnaire_id: etablissement._id,
              },
              {
                etablissement_formateur_id: etablissement._id,
              },
            ],
            etablissement_gestionnaire_courriel: { $nin: [null, ""] },
            catalogue_published: true,
          },
          { etablissement_gestionnaire_courriel: 1 }
        )

        await mailer.sendEmail({
          to: formations[0].etablissement_gestionnaire_courriel,
          subject: `Une entreprise recrute dans votre domaine`,
          template: mailTemplate["mail-cfa-delegation"],
          data: {
            enterpriseName: offreDocument.raison_sociale,
            jobName: offre.rome_appellation_label,
            contractType: offre.type[0],
            trainingLevel: offre.niveau,
            startDate: dayjs(offre.date_debut_apprentissage).format("DD/MM/YYYY"),
            duration: offre.duree_contrat,
            rhythm: offre.rythme_alternance,
            offerButton: `${config.publicUrlEspacePro}/proposition/formulaire/${offreDocument.id_form}/offre/${offre._id}`,
            createAccountButton: `${config.publicUrlEspacePro}/creation/cfa`,
          },
        })
      })

      await Promise.all(promises)

      return res.json(offre)
    })
  )

  /**
   * Put existing offer from id
   */
  router.put(
    "/offre/:id_offre",
    tryCatch(async (req, res) => {
      const result = await formulaire.updateOffre(req.params.id_offre, req.body)
      return res.json(result)
    })
  )

  /**
   * Permet de passer une offre en statut ANNULER (mail transactionnel)
   */
  router.put(
    "/offre/:offreId/cancel",
    tryCatch(async (req, res) => {
      const exist = formulaire.getOffre(req.params.offreId)

      if (!exist) {
        return res.status(400).json({ status: "INVALID_RESSOURCE", message: "Offre does not exist" })
      }

      await formulaire.cancelOffre(req.params.offreId)

      return res.sendStatus(200)
    })
  )

  /**
   * Permet de passer une offre en statut POURVUE (mail transactionnel)
   */
  router.put(
    "/offre/:offreId/provided",
    tryCatch(async (req, res) => {
      const exist = formulaire.getOffre(req.params.offreId)

      if (!exist) {
        return res.status(400).json({ status: "INVALID_RESSOURCE", message: "Offre does not exist" })
      }

      await formulaire.provideOffre(req.params.offreId)

      return res.sendStatus(200)
    })
  )

  /**
   * LBA ENDPOINT
   */
  router.post(
    "/search",
    tryCatch(async (req, res) => {
      const { distance, lat, lon, romes, niveau } = req.body
      const filter = [
        {
          geo_distance: {
            distance: `${distance}km`,
            geo_coordonnees: {
              lat,
              lon,
            },
          },
        },
      ]

      if (!distance || !lat || !lon || !romes) {
        return res.status(400).json({ error: "Argument is missing (distance, lat, lon, romes)" })
      }

      if (niveau && niveau !== "Indifférent") {
        filter.push({
          nested: {
            path: "offres",
            query: {
              bool: {
                must: [
                  {
                    match: {
                      "offres.niveau": {
                        query: niveau,
                        fuzziness: 0,
                        operator: "AND",
                      },
                    },
                  },
                ],
              },
            },
          },
        })
      }

      let body = {
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: "offres",
                  query: {
                    bool: {
                      must: [
                        {
                          match: {
                            "offres.romes": romes.join(" "),
                          },
                        },
                        {
                          match: {
                            "offres.statut": "Active",
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
            filter: filter,
          },
        },
        sort: [
          {
            _geo_distance: {
              geo_coordonnees: {
                lat,
                lon,
              },
              order: "asc",
              unit: "km",
              mode: "min",
              distance_type: "arc",
              ignore_unmapped: true,
            },
          },
        ],
      }

      const result = await esClient.search({ index: "formulaires", body })

      const filtered = await Promise.all(
        result.body.hits.hits.map(async (x) => {
          let offres = []
          let cfa = {}

          if (x._source.offres.length === 0) {
            return
          }

          x._source.mailing = undefined
          x._source.events = undefined

          if (x._source.mandataire === true) {
            const [entreprise_localite] = x._source.adresse.match(/([0-9]{5})[ ,] ?([a-zA-Z-]*)/) ?? [""]
            cfa = await etablissementsRecruteur.getEtablissement({ siret: x._source.gestionnaire })

            x._source.telephone = cfa.telephone
            x._source.email = cfa.email
            x._source.nom = cfa.nom
            x._source.prenom = cfa.prenom
            x._source.raison_sociale = cfa.raison_sociale
            x._source.adresse = cfa.adresse
            x._source.entreprise_localite = entreprise_localite
          }

          x._source.offres.forEach((o) => {
            if (romes.some((item) => o.romes.includes(item)) && o.statut === "Active") {
              o.libelle = o.rome_appellation_label ?? o.libelle
              offres.push(o)
            }
          })

          x._source.offres = offres
          return x
        })
      )

      return res.json(filtered)
    })
  )

  return router
}
