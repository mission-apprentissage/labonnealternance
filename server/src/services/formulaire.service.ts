import { pick } from "lodash-es"
import moment from "moment"
import { mailTemplate } from "../assets/index.js"
import createUserRecruteur from "../common/components/usersRecruteur.js"
import { ANNULEE, POURVUE, etat_utilisateur } from "../common/constants.js"
import dayjs from "../common/dayjs.js"
import { getElasticInstance } from "../common/esClient/index.js"
import createMailer from "../common/mailer.js"
import { Formulaire } from "../common/model/index.js"
import { IFormulaire } from "../common/model/schema/formulaire/formulaire.types.js"
import { IOffre } from "../common/model/schema/offre/offre.types.js"
import { IUserRecruteur } from "../common/model/schema/userRecruteur/userRecruteur.types.js"
import config from "../config.js"
import { getCatalogueEtablissements, getFormations } from "./catalogue.service.js"
import { getEtablissement, getValidationUrl } from "./etablissement.service.js"

const esClient = getElasticInstance()
const mailer = await createMailer()
const usersRecruteur = await createUserRecruteur()

interface IFormulaireExtended extends IFormulaire {
  entreprise_localite: string
}

interface IOffreExtended extends IOffre {
  candidatures: number
  pourvue: string
  supprimer: string
}

/**
 * @description get filtered jobs from elastic search index
 * @param {{number}} distance
 * @param {{string}} lat
 * @param {{string}} long
 * @param {{string[]}} romes
 * @param {{string}} niveau
 * @returns {Promise<IFormulaire[]>}
 */
export const getJobsFromElasticSearch = async ({
  distance,
  lat,
  lon,
  romes,
  niveau,
}: {
  distance: number
  lat: string
  lon: string
  romes: string[]
  niveau: string
}): Promise<IFormulaire[]> => {
  const filter: Array<object> = [
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

  if (niveau && niveau !== "Indifférent") {
    filter.push({
      nested: {
        path: "offres",
        query: {
          bool: {
            must: [
              {
                match_phrase: {
                  "offres.niveau": niveau,
                },
              },
            ],
          },
        },
      },
    })
  }

  const body = {
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

  const filteredJobs = await Promise.all(
    result.body.hits.hits.map(async (x) => {
      const offres = []
      let cfa = <IUserRecruteur>{}

      if (x._source.offres.length === 0) {
        return
      }

      x._source.mailing = undefined
      x._source.events = undefined

      if (x._source.mandataire === true) {
        const [entreprise_localite] = x._source.adresse.match(/([0-9]{5})[ ,] ?([a-zA-Z-]*)/) ?? [""]
        cfa = await getEtablissement({ siret: x._source.gestionnaire })

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
          if (!niveau || niveau === "Indifférent" || niveau === o.niveau) {
            offres.push(o)
          }
        }
      })

      x._source.offres = offres
      return x
    })
  )

  return filteredJobs
}

/**
 * @description get formulaire by offer id
 * @param {{string}} jobId
 * @returns {Promise<IFormulaireExtended>}
 */
export const getOffreAvecInfoMandataire = async (jobId: string): Promise<IFormulaireExtended> => {
  const result = await getOffre(jobId)

  if (!result) {
    return result
  }

  result.offres = result.offres.filter((x) => x._id == jobId)

  if (result.mandataire === true) {
    const [entreprise_localite] = result.adresse.match(/([0-9]{5})[ ,] ?([A-zÀ-ÿ]*)/) ?? [""]
    const cfa = await getEtablissement({ siret: result.gestionnaire })

    result.telephone = cfa.telephone
    result.email = cfa.email
    result.nom = cfa.nom
    result.prenom = cfa.prenom
    result.raison_sociale = cfa.raison_sociale
    result.adresse = cfa.adresse
    result.entreprise_localite = entreprise_localite
  }

  return result
}

/**
 * @description Get formulaire list with mondodb paginate query
 * @param {{string}} query
 * @param {{object}} options
 * @param {{number}} page
 * @param {{number}} limit
 * @returns {Promise<object>}
 */
export const getFormulaires = async (query: string, options: object, { page, limit }: { page: number; limit: number }): Promise<object> => {
  const response = await Formulaire.paginate({ query, ...options, page, limit, lean: true })

  return {
    pagination: {
      page: response.page,
      result_per_page: limit,
      number_of_page: response.totalPages,
      total: response.totalDocs,
    },
    data: response.docs,
  }
}

/**
 * @description Create job offer for formulaire
 * @param {{IOffreExtended}} offre
 * @param {{string}} id_form
 * @returns {Promise<IFormulaire>}
 */
export const createJob = async ({ offre, id_form }: { offre: IOffreExtended; id_form: string }): Promise<IFormulaire> => {
  let isUserAwaiting = false
  // get user data
  const user = await usersRecruteur.getUser({ id_form })
  // get user activation state if not managed by a CFA
  if (user) {
    isUserAwaiting = usersRecruteur.getUserValidationState(user.etat_utilisateur) === etat_utilisateur.ATTENTE
    // upon user creation, if user is awaiting validation, update offre status to "En attente"
    if (isUserAwaiting) {
      offre.statut = "En attente"
    }
  }
  // insert offre
  const updatedFormulaire = await createOffre(id_form, offre)

  const { email, raison_sociale, prenom, nom, mandataire, gestionnaire, offres } = updatedFormulaire
  let contactCFA

  offre._id = updatedFormulaire.offres.filter((x) => x.libelle === offre.libelle)[0]._id

  offre.supprimer = `${config.publicUrlEspacePro}/offre/${offre._id}/cancel`
  offre.pourvue = `${config.publicUrlEspacePro}/offre/${offre._id}/provided`

  // if first offer creation for an Entreprise, send specific mail
  if (offres.length === 1 && mandataire === false) {
    // Get user account validation link
    const url = getValidationUrl(user._id)

    await mailer.sendEmail({
      to: email,
      subject: "La bonne alternance - Merci de valider votre adresse mail pour diffuser votre offre",
      template: mailTemplate["mail-nouvelle-offre-depot-simplifie"],
      data: {
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        confirmation_url: url,
        offre: pick(offre, ["rome_appellation_label", "date_debut_apprentissage", "type", "niveau"]),
        isUserAwaiting,
      },
    })

    return updatedFormulaire
  }

  // get CFA informations if formulaire is handled by a CFA
  if (updatedFormulaire.mandataire) {
    contactCFA = await usersRecruteur.getUser({ siret: gestionnaire })
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
      mandataire: updatedFormulaire.mandataire,
      offre: pick(offre, ["rome_appellation_label", "date_debut_apprentissage", "type", "niveau"]),
      lba_url:
        config.env !== "recette"
          ? `https://labonnealternance.apprentissage.beta.gouv.fr/recherche-apprentissage?&display=list&page=fiche&type=matcha&itemId=${offre._id}`
          : `https://labonnealternance-recette.apprentissage.beta.gouv.fr/recherche-apprentissage?&display=list&page=fiche&type=matcha&itemId=${offre._id}`,
    },
  })

  return updatedFormulaire
}

/**
 * @description Create job delegations
 * @param {{string}} jobId
 * @param {{string[]}} etablissementCatalogueIds
 * @returns {Promise<IFormulaire>}
 */
export const createJobDelegations = async ({ jobId, etablissementCatalogueIds }: { jobId: string; etablissementCatalogueIds: string[] }): Promise<IFormulaire> => {
  const offreDocument = await getOffre(jobId)
  const userDocument = await usersRecruteur.getUser({ id_form: offreDocument.id_form })
  const userState = userDocument.etat_utilisateur.pop()

  const offre = offreDocument.offres.find((offre) => offre._id.toString() === jobId)

  const { etablissements } = await getCatalogueEtablissements({ _id: { $in: etablissementCatalogueIds } })

  const delegations = []

  const promises = etablissements.map(async (etablissement) => {
    const formations = await getFormations(
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
      { etablissement_gestionnaire_courriel: 1, etablissement_formateur_siret: 1 }
    )

    const { etablissement_formateur_siret: siret, etablissement_gestionnaire_courriel: email } = formations[0]

    delegations.push({ siret, email })

    if (userState.statut === etat_utilisateur.VALIDE) {
      await mailer.sendEmail({
        to: email,
        subject: `Une entreprise recrute dans votre domaine`,
        template: mailTemplate["mail-cfa-delegation"],
        data: {
          enterpriseName: offreDocument.raison_sociale,
          jobName: offre.rome_appellation_label,
          contractType: offre.type.join(", "),
          trainingLevel: offre.niveau,
          startDate: dayjs(offre.date_debut_apprentissage).format("DD/MM/YYYY"),
          duration: offre.duree_contrat,
          rhythm: offre.rythme_alternance,
          offerButton: `${config.publicUrlEspacePro}/proposition/formulaire/${offreDocument.id_form}/offre/${offre._id}/siret/${siret}`,
          createAccountButton: `${config.publicUrlEspacePro}/creation/cfa`,
        },
      })
    }
  })

  await Promise.all(promises)

  offre.delegate = true
  offre.number_of_delegations = etablissements.length
  offre.delegations = offre?.delegations.concat(delegations) || delegations

  return await updateOffre(jobId, offre)
}

/**
 * @description Check if job offer exists
 * @param {string} id
 * @returns {Promise<IFormulaire>}
 */
export const checkOffreExists = async (id: string): Promise<boolean> => {
  const offre = await getOffre(id)
  return offre ? true : false
}

/**
 * @description Find formulaire by query
 * @param {object} query
 * @returns {Promise<IFormulaire>}
 */
export const getFormulaire = async (query: object): Promise<IFormulaire> => Formulaire.findOne(query).lean()

/**
 * @description Create new formulaire
 * @param {object} payload
 * @returns {Promise<IFormulaire>}
 */
export const createFormulaire = async (payload: object): Promise<IFormulaire> => await Formulaire.create(payload)

/**
 * @description Remove formulaire by id
 * @param {string} id_form
 * @returns {Promise<object>}
 */
export const deleteFormulaire = async (id_form: string): Promise<object> => await Formulaire.findByIdAndDelete(id_form)

/**
 * @description Remove all formulaires belonging to gestionnaire
 * @param {string} siret
 * @returns {Promise<object>}
 */
export const deleteFormulaireFromGestionnaire = async (siret: string): Promise<object> => await Formulaire.deleteMany({ gestionnaire: siret })

/**
 * @description Update existing formulaire and return updated version
 * @param {string} id_offre
 * @param {object} payload
 * @returns {Promise<IFormulaire>}
 */
export const updateFormulaire = async (id_form: string, payload: object): Promise<IFormulaire> => await Formulaire.findOneAndUpdate({ id_form }, payload, { new: true })

/**
 * @description Archive existing formulaire and cancel all its job offers
 * @param {string} id_form
 * @returns {Promise<boolean>}
 */
export const archiveFormulaire = async (id_form: string): Promise<boolean> => {
  const form = await Formulaire.findOne({ id_form })

  form.offres.map((offre) => {
    offre.statut = "Annulée"
  })

  form.statut = "Archivé"
  await form.save()

  return true
}

/**
 * @description Get job offer by job id
 * @param {string} id
 * @returns {Promise<IFormulaireExtended>}
 */
export const getOffre = async (id: string): Promise<IFormulaireExtended> => await Formulaire.findOne({ "offres._id": id }).lean()

/**
 * @description Create job offer on existing formulaire
 * @param {string} id_offre
 * @param {object} payload
 * @returns {Promise<IFormulaire>}
 */
export const createOffre = async (id_form: string, payload: object): Promise<IFormulaire> =>
  await Formulaire.findOneAndUpdate({ id_form }, { $push: { offres: payload } }, { new: true })

/**
 * @description Update existing job offer
 * @param {string} id_offre
 * @param {object} payload
 * @returns {Promise<IFormulaire>}
 */
export const updateOffre = async (id_offre: string, payload: object): Promise<IFormulaire> =>
  await Formulaire.findOneAndUpdate(
    { "offres._id": id_offre },
    {
      $set: {
        "offres.$": payload,
      },
    },
    { new: true }
  )

/**
 * @description Change job status to provided
 * @param {string} id_offre
 * @returns {Promise<boolean>}
 */
export const provideOffre = async (id_offre: string): Promise<boolean> => {
  await Formulaire.findOneAndUpdate(
    { "offres._id": id_offre },
    {
      $set: {
        "offres.$.statut": POURVUE,
      },
    }
  )
  return true
}

/**
 * @description Cancel job
 * @param {string} id_offre
 * @returns {Promise<boolean>}
 */
export const cancelOffre = async (id_offre: string): Promise<boolean> => {
  await Formulaire.findOneAndUpdate(
    { "offres._id": id_offre },
    {
      $set: {
        "offres.$.statut": ANNULEE,
      },
    }
  )
  return true
}

/**
 * @description Extends job duration by 1 month.
 * @param {string} id_offre
 * @returns {Promise<boolean>}
 */
export const extendOffre = async (id_offre: string): Promise<boolean> => {
  await Formulaire.findOneAndUpdate(
    { "offres._id": id_offre },
    {
      $set: {
        "offres.$.date_expiration": moment().add(1, "months").format("YYYY-MM-DD"),
        "offres.$.date_derniere_prolongation": Date.now(),
      },
      $inc: { "offres.$.nombre_prolongation": 1 },
    }
  )
  return true
}
