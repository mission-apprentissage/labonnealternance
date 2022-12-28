import axios from "axios"
import express from "express"
import Joi from "joi"
import { CFA, ENTREPRISE, REGEX } from "../../common/constants.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

export default ({ formulaire, etablissementsRecruteur, usersRecruteur }) => {
  const router = express.Router()

  const searchValidationSchema = Joi.object({
    raison_sociale: Joi.string(),
    siret: Joi.string().pattern(REGEX.SIRET),
    adresse: Joi.string(),
    nom: Joi.string(),
    prenom: Joi.string(),
    email: Joi.string().email(),
  })

  const formulaireCreationValidationSchema = Joi.object({
    nom: Joi.string().required(),
    prenom: Joi.string().required(),
    email: Joi.string().email().required(),
    telephone: Joi.string().regex(REGEX.TELEPHONE).required(),
    siret: Joi.string().pattern(REGEX.SIRET).required(),
  })

  const formulaireEditionValidationSchema = Joi.object({
    nom: Joi.string().required(),
    prenom: Joi.string().required(),
    email: Joi.string().email().required(),
    telephone: Joi.string().regex(REGEX.TELEPHONE).required(),
  })

  const offreValidationSchema = Joi.object({
    libelle: Joi.string().required(),
    niveau: Joi.string()
      .valid(
        "Cap, autres formations niveau (Infrabac)",
        "BP, Bac, autres formations niveau (Bac)",
        "BTS, DEUST, autres formations niveau (Bac+2)",
        "Licence, autres formations niveau (Bac+3)",
        "Master, titre ingénieur, autres formations niveau (Bac+5)"
      )
      .required(),
    date_debut_apprentissage: Joi.date().required(),
    romes: Joi.array().items(Joi.string()).required(),
    description: Joi.string(),
    type: Joi.string().valid("Apprentissage", "Professionnalisation").required(),
    multi_diffuser: Joi.boolean().default(null),
    delegate: Joi.boolean(),
    elligible_handicap: Joi.boolean(),
    quantite: Joi.number().max(10).default(1),
    duree_contrat: Joi.number().max(4).default(1),
    rythme_alternance: Joi.string().valid("2 jours / 3 jours", "1 semaine / 1 semaine", "2 semaines / 3 semaines", "6 semaines / 6 semaines"),
  })

  const userValidationSchema = Joi.object({
    nom: Joi.string().required(),
    prenom: Joi.string().required(),
    email: Joi.string().email().required(),
    telephone: Joi.string().regex(REGEX.TELEPHONE).required(),
    siret: Joi.string().pattern(REGEX.SIRET).required(),
  })

  /**
   * @swagger
   * "/formulaire":
   *  get:
   *    summary: Permet de récupérer les données concernant les entreprises à partir d'une requête mongoDB
   *    tags:
   *     - Formulaire
   *    description:
   *       Permet de récupérer les entreprises correspondant aux critères de filtrage <br/><br/>
   *       Le champ Query est une query Mongo stringify<br/><br/>
   *       **Pour définir vos critères de recherche, veuillez regarder le schéma de la collection formulaire (en bas de cette page)**
   *    parameters:
   *       - in: query
   *         name: payload
   *         required: false
   *         schema:
   *           type: object
   *           required:
   *             - query
   *           properties:
   *             query:
   *               type: string
   *               example: '"{\"siret\": \"40022106235476\"}"'
   *    responses:
   *      200:
   *        description: une tableau contenant l'ensemble des formulaires
   *        content:
   *          application/json:
   *            schema:
   *              $ref: "#/components/schemas/entreprise"
   */

  router.get(
    "/formulaire",
    tryCatch(async (req, res) => {
      const { error } = searchValidationSchema.validate(req.query, { abortEarly: false })

      if (error) {
        return res.status(400).json({ status: "INPUT_VALIDATION_ERROR", message: error.message })
      }

      let qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}
      const page = qs && qs.page ? qs.page : 1
      const limit = qs && qs.limit ? parseInt(qs.limit, 10) : 100

      const response = await formulaire.getFormulaires(query, { page, limit })

      return res.json(response)
    })
  )

  /**
   * @swagger
   * "/formulaire/:formulaireId":
   *  get:
   *    summary: Permet de récupérer une entreprise à partir de son identifiant
   *    tags:
   *     - Formulaire
   *    parameters:
   *       - in: id_form
   *         name: formulaireId
   *         required: true
   *         schema:
   *           type: string
   *           required:
   *             - id_form
   *           properties:
   *             id_form:
   *               type: string
   *               example: '40022106235476'
   *    responses:
   *      200:
   *        description: un objet contenant le formulaire
   *        content:
   *          application/json:
   *            schema:
   *              $ref: "#/components/schemas/entreprise"
   */
  router.get(
    "/formulaire/:formulaireId",
    tryCatch(async (req, res) => {
      const response = await formulaire.getFormulaire({ id_form: req.params.formulaireId })
      return res.json(response)
    })
  )

  /**
   * @swagger\
   * "/offre/:offreId":
   *  get:
   *    summary: Permet de récupérer l'entreprise contant l'offre recherché à partir de son identifiant mongoDB
   *    tags:
   *     - Offre
   *    parameters:
   *       - in: _id
   *         name: offreId
   *         required: true
   *         schema:
   *           type: string
   *           required:
   *             - id
   *           properties:
   *             id:
   *               type: string
   *               example: '60646425184afd00e017c188'
   *    responses:
   *      200:
   *        description: un objet contenant l'entreprise dont l'offre est recherché
   *        content:
   *          application/json:
   *            schema:
   *              $ref: "#/components/schemas/entreprise"
   */
  router.get(
    "/offre/:offreId",
    tryCatch(async (req, res) => {
      const response = await formulaire.getOffre(req.params.offreId)
      return res.json(response)
    })
  )

  /**
   * @swagger/
   * "/formulaire/:userId":
   *  post:
   *    summary: Permet de créer une entreprise mandaté pour un utilisateur donné
   *    tags:
   *     - Formulaire
   *    parameters:
   *       - in: _id
   *         name: userId
   *         required: true
   *    requestBody:
   *       description: L'objet JSON de l'entreprise
   *       required: true
   *       content:
   *         application/json:
   *          schema:
   *            type: object
   *            properties:
   *              siret:
   *                type: string
   *              nom:
   *                type: string
   *              prenom:
   *                type: string
   *              email:
   *                type: string
   *              telephone:
   *                type: string
   *              offres:
   *                type: array
   *                items:
   *                  type: object
   *            required:
   *              - nom
   *              - prenom
   *              - telephone
   *              - email
   *              - siret
   *    responses:
   *      200:
   *        description: un objet contenant l'entreprise créé
   *        content:
   *          application/json:
   *            schema:
   *              $ref: "#/components/schemas/entreprise"
   */
  router.post(
    "/formulaire/:userId",
    tryCatch(async (req, res) => {
      // update validation info
      const { error } = formulaireCreationValidationSchema.validate(req.body, { abortEarly: false })

      if (error) {
        return res.status(400).json({ status: "INPUT_VALIDATION_ERROR", message: error.message, error: true })
      }

      const userExist = await usersRecruteur.getUser({ _id: req.params.userId })

      if (!userExist) {
        return res.status(400).json({ status: "NOT_FOUND", error: true, message: "L'utilisateur mentionné n'a pas été trouvé" })
      }

      const siretInfo = await etablissementsRecruteur.getEtablissementFromGouv(req.body.siret)

      if (siretInfo.data?.etablissement.etat_administratif.value === "F") {
        return res.status(400).json({ status: "CLOSED", error: true, message: "Cette entreprise est considérée comme fermée." })
      }

      if (siretInfo.data?.etablissement.naf.startsWith("85")) {
        return res.status(400).json({
          status: "UNAUTHORIZED",
          error: true,
          message: "Le numéro siret n'est pas référencé comme une entreprise.",
        })
      }

      let formattedSiretInfo = etablissementsRecruteur.formatEntrepriseData(siretInfo.data.etablissement)

      let opcoResult = await etablissementsRecruteur.getOpco(req.params.siret)
      let geo_coordonnees = await etablissementsRecruteur.getGeoCoordinates(`${formattedSiretInfo.adresse}, ${formattedSiretInfo.code_postal}, ${formattedSiretInfo.commune}`)

      const response = await formulaire.updateFormulaire({
        gestionnaire: userExist.siret,
        mandataire: true,
        opco: opcoResult.data?.opcoName ?? undefined,
        geo_coordonnees,
        ...req.body,
      })

      return res.json(response)
    })
  )

  /**
   * @swagger
   * "/offre/:formulaireId":
   *  post:
   *    summary: Permet de créer une offre pour une entreprise donnée
   *    tags:
   *     - Offre
   *    parameters:
   *       - in: id_form
   *         name: formulaireId
   *         required: true
   *    requestBody:
   *       description: L'objet JSON de l'offre
   *       required: true
   *       content:
   *         application/json:
   *          schema:
   *           $ref: "#/components/schemas/offre"
   *    responses:
   *      200:
   *        description: un objet contenant l'entreprise dont l'offre a été créé
   *        content:
   *          application/json:
   *            schema:
   *              $ref: "#/components/schemas/entreprise"
   */
  router.post(
    "/offre/:formulaireId",
    tryCatch(async (req, res) => {
      const exist = await formulaire.getFormulaire({ id_form: req.params.formulaireId })

      if (!exist) {
        return res.status(400).json({ status: "INVALID_RESSOURCE", message: "Form does not exist" })
      }

      const { error } = offreValidationSchema.validate(req.body, { abortEarly: false })

      if (error) {
        return res.status(400).json({ status: "INPUT_VALIDATION_ERROR", message: error.message })
      }

      const response = await formulaire.createOffre(req.params.formulaireId, req.body)

      return res.json(response)
    })
  )

  /**
   * @swagger
   * "/formulaire/:formulaireId":
   *  put:
   *    summary: Permet de modifier les informations de l'entreprise
   *    tags:
   *     - Formulaire
   *    parameters:
   *       - in: id_form
   *         name: formulaireId
   *         required: true
   *    requestBody:
   *       description: L'objet JSON de l'entreprise
   *       required: true
   *       content:
   *         application/json:
   *          schema:
   *            type: object
   *            properties:
   *              nom:
   *                type: string
   *              prenom:
   *                type: string
   *              email:
   *                type: string
   *              telephone:
   *                type: string
   *              offres:
   *                type: array
   *                items:
   *                  type: object
   *    responses:
   *      200:
   *        description: un objet contenant le formulaire modifié
   *        content:
   *          application/json:
   *            schema:
   *              $ref: "#/components/schemas/entreprise"
   */
  router.put(
    "/formulaire/:formulaireId",
    tryCatch(async (req, res) => {
      const exist = await formulaire.getFormulaire({ id_form: req.params.formulaireId })

      if (!exist) {
        return res.status(400).json({ status: "INVALID_RESSOURCE", message: "Formulaire does not exist" })
      }

      const { error } = formulaireEditionValidationSchema.validate(req.body, { abortEarly: false })

      if (error) {
        return res.status(400).json({ status: "INPUT_VALIDATION_ERROR", message: error.message })
      }

      const response = formulaire.updateFormulaire(req.params.formulaireId, req.body)

      return res.json(response)
    })
  )

  /**
   * @swagger\
   * "/rome/search":
   *  get:
   *    summary: Permet de rechercher le code ROME associé à un libellé métier.
   *    tags:
   *     - Rome
   *    description:
   *       Le code ROME ainsi que l'intitulé sont obligatoires pour créer une offre. </br><br/>
   *       Cette méthode permet de récupérer le code ROME à partir d'une recherche textuelle.
   *    parameters:
   *       - in: query
   *         name: payload
   *         required: false
   *         schema:
   *           type: object
   *           required:
   *             - query
   *           properties:
   *             query:
   *               type: string
   *               example: '"{\"search\": \"développeur\"}"'
   *    responses:
   *      200:
   *        description: un tableau contenant les couples intitulé/code ROME pour le métier recherché
   *        content:
   *          application/json:
   *            schema:
   *              type: array
   *            properties:
   *              coupleIntituleRome:
   *                type: object
   *              example:
   *                codeRome: D1202
   *                intitule: Coiffure
   */
  router.get(
    "/rome/search",
    tryCatch(async (req, res) => {
      const result = await axios.get(`https://labonnealternance-recette.apprentissage.beta.gouv.fr/api/metiers/intitule?label=${req.query.search}`)
      return res.json({ coupleIntituleRome: result.data.coupleIntituleRome })
    })
  )

  /**
   * @swagger
   * "/offre/:offreId":
   *  put:
   *    summary: Permet de modifier une offre
   *    tags:
   *     - Offre
   *    parameters:
   *       - in: _id
   *         name: offreId
   *         required: true
   *    requestBody:
   *      description: L'objet JSON de l'offre
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            properties:
   *              libelle:
   *                type: string
   *              niveau:
   *                type: string
   *              type:
   *                type: string
   *              date_debut_apprentissage:
   *                type: string
   *                format: date
   *              multi_diffuse:
   *                type: boolean
   *    responses:
   *      200:
   *        description: un objet contenant l'entreprise dont l'offre a été modifié
   *        content:
   *          application/json:
   *            schema:
   *              $ref: "#/components/schemas/entreprise"
   */
  router.put(
    "/offre/:offreId",
    tryCatch(async (req, res) => {
      const checkFormulaire = await formulaire.getFormulaire({ id_form: req.params.formulaireId })

      if (!checkFormulaire) {
        return res.status(400).json({ status: "INVALID_RESSOURCE", message: "Form does not exist" })
      }

      const checkOffre = await formulaire.getOffre(req.params.offreId)

      if (!checkOffre) {
        return res.status(400).json({ status: "INVALID_RESSOURCE", message: "Offer does not exist" })
      }

      const { error } = offreValidationSchema.validate(req.body, { abortEarly: false })

      if (error) {
        return res.status(400).json({ status: "INPUT_VALIDATION_ERROR", message: error.message })
      }

      const response = formulaire.updateOffre(req.params.offreId, req.body)

      return res.json(response)
    })
  )

  /**
   * @swagger
   * "/offre/:offreId/cancel":
   *  put:
   *    summary: Permet de mettre à jour une offre au statut **Annulée**
   *    tags:
   *     - Offre
   *    parameters:
   *       - in: _id
   *         name: offreId
   *         required: true
   *    responses:
   *      200:
   *        description: le statut 200 (Success)
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
   * @swagger
   * "/offre/:offreId/provided":
   *  put:
   *    summary: Permet de mettre à jour une offre au statut **Pourvue**
   *    tags:
   *     - Offre
   *    parameters:
   *       - in: _id
   *         name: offreId
   *         required: true
   *    responses:
   *      200:
   *        description: le statut 200 (Success)
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
   * @swagger
   * "/offre/:offreId/extend":
   *  put:
   *    summary: Permet de prolonger la visibilité d'une offre d'un mois
   *    tags:
   *     - Offre
   *    parameters:
   *       - in: _id
   *         name: offreId
   *         required: true
   *    responses:
   *      200:
   *        description: le statut 200 (Success)
   */
  router.put(
    "/offre/:offreId/extend",
    tryCatch(async (req, res) => {
      const offre = formulaire.getOffre(req.params.offreId)

      if (!offre) {
        return res.status(400).json({ status: "INVALID_RESSOURCE", message: "Offre does not exist" })
      }

      await formulaire.extendOffre(req.params.offreId)

      return res.sendStatus(200)
    })
  )

  /**
   * @swagger
   * "/user/:userId":
   *  get:
   *    summary: Permet de récupérer les informations d'un établissement à partir de son identifiant MongoDB
   *    tags:
   *     - Etablissement
   *    parameters:
   *       - in: _id
   *         name: userIf
   *         required: true
   *    responses:
   *      200:
   *        description: un objet contenant l'utilisateur
   *        content:
   *          application/json:
   *            schema:
   *              $ref: "#/components/schemas/user"
   */
  router.post(
    "/user/:id",
    tryCatch(async (req, res) => {
      const user = user.getUser(req.params.id)

      if (!user) {
        return res.status(400).json({ status: "INVALID_RESSOURCE", message: "User does not exist" })
      }

      return res.json(user)
    })
  )

  /**
   * @swagger
   * "/user":
   *  post:
   *    summary: Permet de créer un etablissement
   *    description : Le nom de l'opco doit correspondre à l'une des valeurs suivantes <br>"AFDAS",<br>"AKTO / Opco entreprises et salariés des services à forte intensité de main d'oeuvre",<br>"ATLAS",<br>"Constructys",<br>"L'Opcommerce",<br>"OCAPIAT",<br>"OPCO 2i",<br>"Opco entreprises de proximité",<br>"Opco Mobilités",<br>"Opco Santé",<br>"Uniformation, l'Opco de la Cohésion sociale",<br>
   *    tags:
   *     - Etablissement
   *    requestBody:
   *       description: L'objet JSON de l'utilisateur.
   *       required: true
   *       content:
   *         application/json:
   *          schema:
   *            type: object
   *            properties:
   *              prenom:
   *                type: string
   *              nom:
   *                type: string
   *              email:
   *                type: string
   *              telephone:
   *                type: string
   *              siret:
   *                type: string
   *              opco:
   *                type: string
   *              idcc:
   *                type: string
   *            required:
   *              - prenom
   *              - nom
   *              - email
   *              - telephone
   *              - siret
   *              - opco
   *              - idcc
   *    responses:
   *      200:
   *        description: un objet contenant l'utilisateur
   *        content:
   *          application/json:
   *            schema:
   *              $ref: "#/components/schemas/utilisateur"
   */
  router.post(
    "/user",
    tryCatch(async (req, res) => {
      const { error } = userValidationSchema.validate(req.body, { abortEarly: false })

      if (error) {
        return res.status(400).json({ status: "INPUT_VALIDATION_ERROR", message: error.message, error: true })
      }

      const userExist = await usersRecruteur.getUser({ email: req.body.email })

      if (userExist) {
        return res.status(403).json({ status: "USER_ALREADY_EXIST", error: true })
      }

      const { data } = await etablissementsRecruteur.getEtablissementFromCatalogue(req.body.siret)

      const siretInfo = data?.etablissement[0] ?? null

      if (!siretInfo) {
        return res.status(400).json({
          status: "NOT_FOUND",
          error: true,
          message: "L'organisme de formation n'a pas été trouvé parmi le catalogue des établissements",
        })
      }

      if (siretInfo.ferme === true) {
        return res.status(400).json({
          statut: "ESTABLISHMENT_CLOSED",
          error: true,
          message: "Cet établissement est considéré comme fermé.",
        })
      }

      let formattedSiretInfo = etablissementsRecruteur.formatCatalogueData(siretInfo)

      let newUser = await usersRecruteur.createUser({ type: "CFA", ...formattedSiretInfo, ...req.body })

      return res.json(newUser)
    })
  )

  /**
   * @swagger
   * "/user/:userId":
   *  put:
   *    summary: Permet de mettre à jour les informations d'un utilisateur à partir de son identifiant
   *    tags:
   *     - Etablissement
   *    parameters:
   *       - in: _id
   *         name: userId
   *         required: true
   *    requestBody:
   *       description: L'objet JSON de l'utilisateur.
   *       required: true
   *       content:
   *         application/json:
   *          schema:
   *            type: object
   *            properties:
   *              prenom:
   *                type: string
   *              nom:
   *                type: string
   *              email:
   *                type: string
   *              telephone:
   *                type: string
   *    responses:
   *      200:
   *        description: l'objet contenant l'utilisateur
   *        content:
   *          application/json:
   *            schema:
   *              $ref: "#/components/schemas/utilisateur"
   */
  router.put(
    "/user/:userId",
    tryCatch(async (req, res) => {
      if (!req.params.userId) {
        return res.status(400).json({ status: "MISSING_PARAM", message: "L'identifiant utilisateur est absent", error: true })
      }

      const exist = await usersRecruteur.getUser({ _id: req.params.userId })

      if (!exist) {
        return res.status(400).json({ statut: "NOT_FOUND", message: "L'utilisateur n'existe pas", error: true })
      }

      const updated = await usersRecruteur.updateUser(req.params.userId, req.body)

      return res.json(updated)
    })
  )

  /**
   * @swagger
   * "/user/:userId":
   *  delete:
   *    summary: Permet de supprimer un utilisateur à partir de son identifiant
   *    description: Supprime l'ensemble des données relatives à un utilisateur, y compris formulaires et offres
   *    tags:
   *     - Etablissement
   *    parameters:
   *       - in: _id
   *         name: userId
   *         required: true
   *    responses:
   *      200:
   *        description: le statut 200 (Success)
   */
  router.delete(
    "/user/:userId",
    tryCatch(async (req, res) => {
      if (!req.params.userId) {
        return res.status(400).json({ status: "MISSING_PARAM", message: "L'identifiant utilisateur est absent", error: true })
      }

      const user = await usersRecruteur.getUser({ _id: req.params.userId })

      if (!user) {
        return res.status(400).json({ statut: "NOT_FOUND", message: "L'utilisateur n'existe pas", error: true })
      }

      let { _id, siret, id_form, type } = user

      switch (type) {
        case ENTREPRISE:
          await usersRecruteur.removeUser(_id)
          await formulaire.deleteFormulare(id_form)

          break

        case CFA:
          await usersRecruteur.removeUser(_id)
          await formulaire.deleteFormulaireFromGestionnaire(siret)

          break

        default:
          return res.status(400).json({ statut: "ERREUR", message: "Une erreur est survenue", error: true })
      }

      return res.sendStatus(200)
    })
  )

  return router
}
