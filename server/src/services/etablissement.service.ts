import axios, { AxiosResponse } from "axios"
import { etat_etablissements } from "../common/constants.js"
import { Etablissement, ReferentielOpco, UserRecruteur } from "../common/model/index.js"
import { IEtablissement } from "../common/model/schema/etablissements/etablissement.types.js"
import { IReferentielOpco } from "../common/model/schema/referentielOpco/referentielOpco.types.js"
import { IUserRecruteur } from "../common/model/schema/userRecruteur/userRecruteur.types.js"
import { sentryCaptureException } from "../common/utils/sentryUtils.js"
import config from "../config.js"

import { IAPIAdresse, IAPIEtablissement, ICFADock, IEtablissementCatalogue, IEtablissementGouv, IReferentiel, ISIRET2IDCC } from "./etablissement.service.types.js"

const apiParams = {
  token: config.apiEntrepriseKey,
  context: "Matcha MNA",
  recipient: "12000101100010", // Siret Dinum
  object: "Consolidation des données",
}

/**
 * @description Creates an etablissement.
 * @param {Object} options
 * @returns {Promise<Etablissement>}
 */
export const create = async (options = {}) => {
  const etablissement = new Etablissement(options)
  await etablissement.save()

  return etablissement.toObject()
}

/**
 * @description Returns an etablissement from its id.
 * @param {ObjectId} id
 * @returns {Promise<Etablissement>}
 */
export const findById = async (id): Promise<IEtablissement> => {
  const etablissement = await Etablissement.findById(id)

  if (!etablissement) {
    throw new Error(`Unable to find etablissement ${id}`)
  }

  return etablissement.toObject()
}

/**
 * @description Returns items.
 * @param {Object} conditions
 * @returns {Promise<Etablissement[]>}
 */
export const find = async (conditions): Promise<IEtablissement[]> => Etablissement.find(conditions)

/**
 * @description Returns one item.
 * @param {Object} conditions
 * @returns {Promise<Etablissement>}
 */
export const findOne = async (conditions): Promise<IEtablissement> => Etablissement.findOne(conditions)

/**
 * @description Updates an etablissement from its conditions.
 * @param {Object} conditions
 * @param {Object} values
 * @returns {Promise<Etablissement>}
 */
export const findOneAndUpdate = async (conditions, values): Promise<IEtablissement> => Etablissement.findOneAndUpdate(conditions, values, { new: true })

/**
 * @description Upserts.
 * @param {Object} conditions
 * @param {Object} values
 * @returns {Promise<Etablissement>}
 */
export const updateMany = async (conditions, values): Promise<any> => Etablissement.updateMany(conditions, values, { new: true, upsert: true })

/**
 * @description Update one.
 * @param {Object} conditions
 * @param {Object} values
 * @returns {Promise<Etablissement>}
 */
export const updateOne = async (conditions, values): Promise<any> => Etablissement.updateOne(conditions, values, { new: true, upsert: true })

/**
 * @description Updates an etablissement from its id.
 * @param {ObjectId} id
 * @param {Object} values
 * @returns {Promise<Etablissement>}
 */
export const findByIdAndUpdate = async (id, values): Promise<IEtablissement> => Etablissement.findByIdAndUpdate({ _id: id }, values, { new: true })

/**
 * @description Deletes an etablissement from its id.
 * @param {ObjectId} id
 * @returns {Promise<void>}
 */
export const findByIdAndDelete = async (id): Promise<IEtablissement> => Etablissement.findByIdAndDelete(id)

/**
 * @description Get etablissement from a given query
 * @param {Object} query
 * @returns {Promise<void>}
 */
export const getEtablissement = async (query: object): Promise<IUserRecruteur> => UserRecruteur.findOne(query)

/**
 * @description Get opco details from CFADOCK API for a given SIRET
 * @param {String} siret
 * @returns {Promise<Object>}
 */
export const getOpco = async (siret: string): Promise<ICFADock> => {
  try {
    const { data } = await axios.get<ICFADock>(`https://www.cfadock.fr/api/opcos?siret=${siret}`)
    return data
  } catch (error) {
    throw error
  }
}

/**
 * @description Get opco details from CFADOCK API from a given IDCC
 * @param {Number} idcc
 * @returns {Promise<Object>}
 */
export const getOpcoByIdcc = async (idcc: number): Promise<ICFADock> => {
  try {
    const { data } = await axios.get<ICFADock>(`https://www.cfadock.fr/api/opcos?idcc=${idcc}`)
    return data
  } catch (error) {
    throw error
  }
}

/**
 * @description Get idcc number from SIRET2IDCC API from a given SIRET
 * @param {String} siret
 * @returns {Promise<Object>}
 */
export const getIdcc = async (siret: string): Promise<ISIRET2IDCC> => {
  try {
    const { data } = await axios.get<ISIRET2IDCC>(`https://siret2idcc.fabrique.social.gouv.fr/api/v2/${siret}`)
    return data
  } catch (error) {
    throw error
  }
}
/**
 * @description Get the establishment validation url for a given SIRET
 * @param {String} _id
 * @returns {String}
 */
export const getValidationUrl = (_id: string): string => `${config.publicUrlEspacePro}/authentification/validation/${_id}`
/**
 * @description Validate the establishment email for a given ID
 * @param {String} _id
 * @returns {Promise<void>}
 */
export const validateEtablissementEmail = async (_id: string): Promise<IUserRecruteur> => UserRecruteur.findByIdAndUpdate(_id, { email_valide: true })
/**
 * @description Get the establishment information from the ENTREPRISE API for a given SIRET
 * @param {String} siret
 * @returns {Promise<IApiEntreprise>}
 */
export const getEtablissementFromGouv = async (siret: string): Promise<IAPIEtablissement> => {
  try {
    const { data } = await axios.get<IAPIEtablissement>(`https://entreprise.api.gouv.fr/v2/etablissements/${siret}`, {
      params: apiParams,
    })

    return data
  } catch (error) {
    sentryCaptureException(error)
    throw error
  }
}
/**
 * @description Get the establishment information from the REFERENTIEL API for a given SIRET
 * @param {String} siret
 * @returns {Promise<IReferentiel>}
 */
export const getEtablissementFromReferentiel = async (siret: string): Promise<IReferentiel> => {
  try {
    const { data } = await axios.get<IReferentiel>(`https://referentiel.apprentissage.beta.gouv.fr/api/v1/organismes/${siret}`)
    return data
  } catch (error) {
    sentryCaptureException(error)
    if (error.response.status === 404) {
      return null
    }
  }
}
/**
 * @description Get the establishment information from the CATALOGUE API for a given SIRET
 * @param {String} siret
 * @returns {Promise<IEtablissementCatalogue>}
 */
export const getEtablissementFromCatalogue = async (siret: string): Promise<IEtablissementCatalogue> => {
  try {
    const result: IEtablissementCatalogue = await axios.get("https://catalogue.apprentissage.beta.gouv.fr/api/v1/entity/etablissements/", {
      params: {
        query: { siret },
      },
    })
    return result
  } catch (error) {
    sentryCaptureException(error)
    return error
  }
}
/**
 * @description Get the geolocation information from the ADDRESS API for a given address
 * @param {String} adresse
 * @returns {Promise<string>}
 */
export const getGeoCoordinates = async (adresse: string): Promise<string> => {
  try {
    const response: AxiosResponse<IAPIAdresse> = await axios.get(`https://api-adresse.data.gouv.fr/search/?q=${adresse}`)
    const coordinates = response.data.features[0] ? response.data.features[0].geometry.coordinates.reverse().join(",") : "NOT FOUND"
    return coordinates
  } catch (error) {
    sentryCaptureException(error)
    return "NOT FOUND"
  }
}
/**
 * @description Get matching records from the ReferentielOpco collection for a given siret & email
 * @param {String} siretCode
 * @returns {Promise<IReferentielOpco>}
 */
export const getEstablishmentFromOpcoReferentiel = async (siretCode: string): Promise<IReferentielOpco> => await ReferentielOpco.findOne({ siret_code: siretCode })
/**
 * @description Get all matching records from the ReferentielOpco collection for a given siret & email
 * @param {String} siretCode
 * @returns {Promise<IReferentielOpco[]>}
 */
export const getAllEstablishmentFromOpcoReferentiel = async (query: object): Promise<IReferentielOpco[]> => await ReferentielOpco.find(query).lean()
/**
 * @description Chech if a given email is included in the given email list array
 * @param {String} email
 * @param {String[]} emailList
 * @returns {Boolean}
 */
export const getMatchingEmailFromContactList = (email: string, emailList: string[]): boolean => emailList.includes(email)
/**
 * @description Check if the email domain is included in the givne email list array
 * @param {String} email
 * @param {String[]} emailList
 * @returns {Boolean}
 */
export const getMatchingDomainFromContactList = (email: string, emailList: string[]): boolean => {
  const [_, domain] = email.split("@")

  return emailList.some((e) => e.includes(domain))
}
/**
 * @description Format Entreprise data
 * @param {Object} d
 * @returns {Object}
 */
export const formatEntrepriseData = (d: IEtablissementGouv) => ({
  enseigne: d.enseigne,
  etat: d.etat_administratif.value, // F pour fermé ou A pour actif
  siret: d.siret,
  raison_sociale: d.adresse.l1,
  adresse_detail: d.adresse,
  adresse: `${d.adresse.l4 ?? ""} ${d.adresse.code_postal} ${d.adresse.localite}`,
  rue: d.adresse.l4,
  commune: d.adresse.localite,
  code_postal: d.adresse.code_postal,
  contacts: [], // conserve la coherence avec l'UI
  code_naf: d.naf,
  libelle_naf: d.libelle_naf,
  tranche_effectif: d.tranche_effectif_salarie_etablissement.intitule,
  date_creation_etablissement: new Date(d.date_creation_etablissement * 1000),
})
/**
 * @description Format Referentiel data
 * @param {Object} d
 * @returns {Object}
 */
export const formatReferentielData = (d: IReferentiel) => ({
  etat: d.etat_administratif,
  qualiopi: d.qualiopi,
  siret: d.siret,
  raison_sociale: d.raison_sociale,
  contacts: d.contacts,
  adresse_detail: d.adresse,
  adresse: d.adresse?.label,
  rue: d.adresse?.label?.split(`${d.adresse?.code_postal}`)[0].trim() || d.lieux_de_formation[0].adresse.label.split(`${d.lieux_de_formation[0].adresse.code_postal}`)[0].trim(),
  commune: d.adresse?.localite || d.lieux_de_formation[0].adresse.localite,
  code_postal: d.adresse?.code_postal || d.lieux_de_formation[0].adresse.code_postal,
  geo_coordonnees: d.adresse
    ? `${d.adresse?.geojson.geometry.coordinates[1]},${d.adresse?.geojson.geometry.coordinates[0]}`
    : `${d.lieux_de_formation[0].adresse.geojson?.geometry.coordinates[0]},${d.lieux_de_formation[0].adresse.geojson?.geometry.coordinates[1]}`,
})
/**
 * @description Format Catalogue data
 * @param {Object} d
 * @returns {Object}
 */
export const formatCatalogueData = (d: IEtablissementCatalogue) => ({
  etat: d.ferme === false ? etat_etablissements.FERME : etat_etablissements.ACTIF,
  siret: d.siret,
  raison_sociale: d.entreprise_raison_sociale,
  contacts: [], // les tco n'ont pas d'information de contact, mais conserve un standard pour l'ui,
  commune: d.localite,
  code_postal: d.code_postal,
  adresse: `${d.numero_voie === null ? "" : d.numero_voie} ${d.type_voie} ${d.nom_voie} ${d.code_postal} ${d.localite}`,
  rue: `${d.numero_voie === null ? "" : d.numero_voie} ${d.type_voie} ${d.nom_voie}`,
  geo_coordonnees: d.geo_coordonnees,
})
