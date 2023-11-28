import { AxiosResponse } from "axios"
import Boom from "boom"
import type { FilterQuery } from "mongoose"
import { IEtablissement, ILbaCompany, IRecruiter, IReferentielData, IReferentielOpco, IUserRecruteur } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getHttpClient } from "@/common/utils/httpUtils"

import { Etablissement, LbaCompany, LbaCompanyLegacy, ReferentielOpco, UnsubscribeOF, UserRecruteur } from "../common/model/index"
import { isEmailFromPrivateCompany, isEmailSameDomain } from "../common/utils/mailUtils"
import { sentryCaptureException } from "../common/utils/sentryUtils"
import config from "../config"

import { createValidationMagicLink } from "./appLinks.service"
import { validationOrganisation } from "./bal.service"
import { getCatalogueEtablissements } from "./catalogue.service"
import { CFA, ENTREPRISE, RECRUITER_STATUS } from "./constant.service"
import dayjs from "./dayjs.service"
import {
  IAPIAdresse,
  IAPIEtablissement,
  ICFADock,
  IEtablissementCatalogue,
  IEtablissementGouv,
  IFormatAPIEntreprise,
  IReferentiel,
  ISIRET2IDCC,
} from "./etablissement.service.types"
import { createFormulaire, getFormulaire } from "./formulaire.service"
import mailer from "./mailer.service"
import { getOpcoBySirenFromDB, saveOpco } from "./opco.service"
import { autoValidateUser, createUser, getUser, getUserStatus, setUserHasToBeManuallyValidated, setUserInError } from "./userRecruteur.service"

const apiParams = {
  token: config.entreprise.apiKey,
  context: config.entreprise.context,
  recipient: config.entreprise.recipient, // Siret Dinum
  object: config.entreprise.object,
}

/**
 * Get company size by code
 * @param {string} code
 * @returns {string}
 */
const getEffectif = (code) => {
  switch (code) {
    case "00":
      return "0 salarié"

    case "01":
      return "1 ou 2 salariés"

    case "02":
      return "3 à 5 salariés"

    case "03":
      return "6 à 9 salariés"

    case "11":
      return "10 à 19 salariés"

    case "12":
      return "20 à 49 salariés"

    case "21":
      return "50 à 99 salariés"

    case "22":
      return "100 à 199 salariés"

    case "31":
      return "200 à 249 salariés"

    case "32":
      return "250 à 499 salariés"

    case "41":
      return "500 à 999 salariés"

    case "42":
      return "1 000 à 1 999 salariés"

    case "51":
      return "2 000 à 4 999 salariés"

    case "52":
      return "5 000 à 9 999 salariés"

    case "53":
      return "10 000 salariés et plus"

    default:
      return "Non diffusé"
  }
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
export const find = async (conditions): Promise<IEtablissement[]> => Etablissement.find(conditions).lean()

/**
 * @description Returns one item.
 * @param {Object} conditions
 * @returns {Promise<Etablissement>}
 */
export const findOne = async (conditions): Promise<IEtablissement | null> => Etablissement.findOne(conditions).lean()

/**
 * @description Updates an etablissement from its conditions.
 * @param {Object} conditions
 * @param {Object} values
 * @returns {Promise<Etablissement>}
 */
export const findOneAndUpdate = async (conditions, values): Promise<IEtablissement | null> => Etablissement.findOneAndUpdate(conditions, values, { new: true }).lean()

/**
 * @description Upserts.
 * @param {Object} conditions
 * @param {Object} values
 * @returns {Promise<Etablissement>}
 */
export const updateMany = async (conditions, values): Promise<any> => Etablissement.updateMany(conditions, values, { new: true, upsert: true }).lean()

/**
 * @description Update one.
 * @param {Object} conditions
 * @param {Object} values
 * @returns {Promise<Etablissement>}
 */
export const updateOne = async (conditions, values): Promise<any> => Etablissement.updateOne(conditions, values, { new: true, upsert: true }).lean()

/**
 * @description Updates an etablissement from its id.
 * @param {ObjectId} id
 * @param {Object} values
 * @returns {Promise<Etablissement>}
 */
export const findByIdAndUpdate = async (id, values): Promise<IEtablissement | null> => Etablissement.findByIdAndUpdate({ _id: id }, values, { new: true }).lean()

/**
 * @description Deletes an etablissement from its id.
 * @param {ObjectId} id
 * @returns {Promise<void>}
 */
export const findByIdAndDelete = async (id): Promise<IEtablissement | null> => Etablissement.findByIdAndDelete(id).lean()

/**
 * @description Get etablissement from a given query
 * @param {Object} query
 * @returns {Promise<void>}
 */
export const getEtablissement = async (query: FilterQuery<IUserRecruteur>): Promise<IUserRecruteur | null> => UserRecruteur.findOne(query).lean()

/**
 * @description Get opco details from CFADOCK API for a given SIRET
 * @param {String} siret
 * @returns {Promise<Object>}
 */
export const getOpco = async (siret: string): Promise<ICFADock | null> => {
  try {
    const { data } = await getHttpClient({ timeout: 5000 }).get<ICFADock>(`https://www.cfadock.fr/api/opcos?siret=${encodeURIComponent(siret)}`)
    return data
  } catch (err: any) {
    sentryCaptureException(err)
    return null
  }
}

/**
 * @description Get opco details from CFADOCK API from a given IDCC
 * @param {Number} idcc
 * @returns {Promise<Object>}
 */
export const getOpcoByIdcc = async (idcc: number): Promise<ICFADock | null> => {
  try {
    const { data } = await getHttpClient({ timeout: 5000 }).get<ICFADock>(`https://www.cfadock.fr/api/opcos?idcc=${idcc}`)
    return data
  } catch (err: any) {
    sentryCaptureException(err)
    return null
  }
}

/**
 * @description Get idcc number from SIRET2IDCC API from a given SIRET
 * @param {String} siret
 * @returns {Promise<Object>}
 */
export const getIdcc = async (siret: string): Promise<ISIRET2IDCC | null> => {
  try {
    const { data } = await getHttpClient({ timeout: 5000 }).get<ISIRET2IDCC>(`https://siret2idcc.fabrique.social.gouv.fr/api/v2/${encodeURIComponent(siret)}`)
    return data
  } catch (err) {
    sentryCaptureException(err)
    return null
  }
}

/**
 * @description Validate the establishment email for a given ID
 * @param {IUserRecruteur["_id"]} _id
 * @returns {Promise<void>}
 */
export const validateEtablissementEmail = async (email: IUserRecruteur["email"]): Promise<IUserRecruteur | null> =>
  UserRecruteur.findOneAndUpdate({ email }, { is_email_checked: true })

/**
 * @description Get the establishment information from the ENTREPRISE API for a given SIRET
 */
export const getEtablissementFromGouvSafe = async (siret: string): Promise<IAPIEtablissement | BusinessErrorCodes.NON_DIFFUSIBLE | null> => {
  try {
    if (config.entreprise.simulateError) {
      throw new Error("API entreprise : simulation d'erreur")
    }
    const { data } = await getHttpClient({ timeout: 5000 }).get<IAPIEtablissement>(`${config.entreprise.baseUrl}/sirene/etablissements/diffusibles/${encodeURIComponent(siret)}`, {
      params: apiParams,
    })
    if (data.data.status_diffusion !== "diffusible") {
      return BusinessErrorCodes.NON_DIFFUSIBLE
    }
    return data
  } catch (error: any) {
    const status = error?.response?.status
    if ([404, 422, 429].includes(status)) {
      return null
    }
    sentryCaptureException(error)
    throw error
  }
}

/**
 * @description Get the establishment information from the ENTREPRISE API for a given SIRET
 * Throw an error if the data is private
 */
export const getEtablissementFromGouv = async (siret: string): Promise<IAPIEtablissement | null> => {
  const data = await getEtablissementFromGouvSafe(siret)
  if (data === BusinessErrorCodes.NON_DIFFUSIBLE) {
    throw Boom.internal(BusinessErrorCodes.NON_DIFFUSIBLE)
  }
  return data
}
/**
 * @description Get the establishment information from the REFERENTIEL API for a given SIRET
 */
export const getEtablissementFromReferentiel = async (siret: string): Promise<IReferentiel | null> => {
  try {
    const { data } = await getHttpClient().get<IReferentiel>(`https://referentiel.apprentissage.beta.gouv.fr/api/v1/organismes/${siret}`)
    return data
  } catch (error: any) {
    sentryCaptureException(error)
    if (error?.response?.status === 404) {
      return null
    } else {
      throw error
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
    const result: IEtablissementCatalogue = await getHttpClient().get("https://catalogue.apprentissage.beta.gouv.fr/api/v1/entity/etablissements/", {
      params: {
        query: { siret },
      },
    })
    return result
  } catch (error: any) {
    sentryCaptureException(error)
    return error
  }
}

// when in string format: $latitude,$longitude
export type GeoCoord = {
  latitude: number
  longitude: number
}

/**
 * @description Get the geolocation information from the ADDRESS API for a given address
 * @param {String} adresse
 */
export const getGeoCoordinates = async (adresse: string): Promise<GeoCoord> => {
  try {
    const response: AxiosResponse<IAPIAdresse> = await getHttpClient().get(`https://api-adresse.data.gouv.fr/search/?q=${adresse}`)
    const firstFeature = response.data?.features.at(0)
    if (!firstFeature) {
      throw new Error("pas trouvé")
    }
    const coords = firstFeature.geometry.coordinates.reverse()
    const latitude = coords.at(0)
    const longitude = coords.at(1)
    if (latitude === undefined || longitude === undefined) {
      throw Boom.internal("moins de 2 coordonnées", { latitude, longitude })
    }
    return { latitude, longitude }
  } catch (error: any) {
    const newError = Boom.internal(`erreur de récupération des geo coordonnées`, { adresse })
    newError.cause = error
    throw newError
  }
}

/**
 * @description Get matching records from the ReferentielOpco collection for a given siret & email
 * @param {IReferentielOpco["siret_code"]} siretCode
 * @returns {Promise<IReferentielOpco>}
 */
export const getEstablishmentFromOpcoReferentiel = async (siretCode: IReferentielOpco["siret_code"]) => await ReferentielOpco.findOne({ siret_code: siretCode })
/**
 * @description Get all matching records from the ReferentielOpco collection
 * @param {FilterQuery<IReferentielOpco>} query
 * @returns {Promise<IReferentielOpco[]>}
 */
export const getAllEstablishmentFromOpcoReferentiel = async (query: FilterQuery<IReferentielOpco>): Promise<IReferentielOpco[]> => await ReferentielOpco.find(query).lean()
/**
 * @description Get all matching records from the LbaCompanyLegacy collection
 * @param {FilterQuery<ILbaCompany>} query
 * @returns {Promise<ILbaCompany["email"]>}
 */
export const getAllEstablishmentFromLbaCompanyLegacy = async (query: FilterQuery<ILbaCompany>): Promise<ILbaCompany[]> =>
  await LbaCompanyLegacy.find(query).select({ email: 1, _id: 0 }).lean()

/**
 * @description Get all matching records from the LbaCompanies collection
 * @param {FilterQuery<ILbaCompany>} query
 * @returns {Promise<ILbaCompany["email"]>}
 */
export const getAllEstablishmentFromLbaCompany = async (query: FilterQuery<ILbaCompany>): Promise<ILbaCompany[]> => await LbaCompany.find(query).select({ email: 1, _id: 0 }).lean()

function getRaisonSocialeFromGouvResponse(d: IEtablissementGouv): string | undefined {
  const { personne_morale_attributs, personne_physique_attributs } = d.unite_legale
  const { raison_sociale } = personne_morale_attributs
  if (raison_sociale) {
    return raison_sociale
  }
  if (personne_physique_attributs) {
    const { prenom_usuel, nom_naissance, nom_usage } = personne_physique_attributs
    return `${prenom_usuel} ${nom_usage ?? nom_naissance}`
  }
}

/**
 * @description Format Entreprise data
 * @param {IEtablissementGouv} data
 * @returns {IFormatAPIEntreprise}
 */
export const formatEntrepriseData = (d: IEtablissementGouv): IFormatAPIEntreprise => {
  if (!d.adresse) {
    throw new Error("erreur dans le format de l'api SIRENE : le champ adresse est vide")
  }
  return {
    establishment_enseigne: d.enseigne,
    establishment_state: d.etat_administratif, // F pour fermé ou A pour actif
    establishment_siret: d.siret,
    establishment_raison_sociale: getRaisonSocialeFromGouvResponse(d),
    address_detail: d.adresse,
    address: `${d.adresse?.acheminement_postal?.l4} ${d.adresse?.acheminement_postal?.l6}`,
    contacts: [], // conserve la coherence avec l'UI
    naf_code: d.activite_principale.code,
    naf_label: d.activite_principale.libelle,
    establishment_size: getEffectif(d.unite_legale.tranche_effectif_salarie.code),
    establishment_creation_date: new Date(d.unite_legale.date_creation * 1000),
  }
}

/**
 * @description Format Referentiel data
 * @param {IReferentiel} d
 * @returns {Object}
 */
export const formatReferentielData = (d: IReferentiel): IReferentielData => ({
  establishment_state: d.etat_administratif,
  is_qualiopi: d.qualiopi,
  establishment_siret: d.siret,
  establishment_raison_sociale: d.raison_sociale,
  contacts: d.contacts,
  address_detail: d.adresse,
  address: d.adresse?.label,
  geo_coordinates: d.adresse
    ? `${d.adresse?.geojson.geometry.coordinates[1]},${d.adresse?.geojson.geometry.coordinates[0]}`
    : `${d.lieux_de_formation[0]?.adresse?.geojson?.geometry.coordinates[0]},${d.lieux_de_formation[0]?.adresse?.geojson?.geometry.coordinates[1]}`,
})

/**
 * Taggue l'organisme de formation pour qu'il ne reçoive plus de demande de délégation
 * @param etablissementSiret siret de l'organisme de formation ne souhaitant plus recevoir les demandes
 */
export const etablissementUnsubscribeDemandeDelegation = async (etablissementSiret: string) => {
  const unsubscribeOF = await UnsubscribeOF.findOne({ establishment_siret: etablissementSiret })

  if (!unsubscribeOF) {
    const { etablissements } = await getCatalogueEtablissements(
      {
        siret: etablissementSiret,
      },
      { _id: 1 }
    )
    const [{ _id }] = etablissements
    if (!_id) return
    await UnsubscribeOF.create({
      catalogue_id: _id,
      establishment_siret: etablissementSiret,
      unsubscribe_date: new Date(),
    })
  }
}

export const autoValidateCompany = async (userRecruteur: IUserRecruteur) => {
  const validated = await isCompanyValid(userRecruteur)
  if (validated) {
    userRecruteur = await autoValidateUser(userRecruteur._id)
  } else {
    if (!(userRecruteur.status.length && getUserStatus(userRecruteur.status) === ETAT_UTILISATEUR.ATTENTE)) {
      userRecruteur = await setUserHasToBeManuallyValidated(userRecruteur._id)
    }
  }
  return { userRecruteur, validated }
}

export const isCompanyValid = async (userRecruteur: IUserRecruteur) => {
  const { establishment_siret: siret, email, _id } = userRecruteur

  if (!siret) {
    return false
  }

  const siren = siret.slice(0, 9)
  const sirenRegex = `^${siren}`
  // Get all corresponding records using the SIREN number in BonneBoiteLegacy collection
  const [bonneBoiteLegacyList, bonneBoiteList, referentielOpcoList] = await Promise.all([
    getAllEstablishmentFromLbaCompanyLegacy({ siret: { $regex: sirenRegex }, email: { $nin: ["", null] } }),
    getAllEstablishmentFromLbaCompany({ siret: { $regex: sirenRegex }, email: { $nin: ["", null] } }),
    getAllEstablishmentFromOpcoReferentiel({ siret_code: { $regex: sirenRegex } }),
  ])

  // Format arrays to get only the emails
  const bonneBoiteLegacyEmailList = bonneBoiteLegacyList.map(({ email }) => email)
  const bonneBoiteEmailList = bonneBoiteList.map(({ email }) => email)
  const referentielOpcoEmailList = referentielOpcoList.flatMap((item) => item.emails)

  // Create a single array with all emails duplicate free
  const validEmails = [...new Set([...referentielOpcoEmailList, ...bonneBoiteLegacyEmailList, ...bonneBoiteEmailList])]

  // Check BAL API for validation

  const isValid: boolean = validEmails.includes(email) || (isEmailFromPrivateCompany(email) && validEmails.some((validEmail) => validEmail && isEmailSameDomain(email, validEmail)))
  if (isValid) {
    return true
  } else {
    const balControl = await validationOrganisation(siret, email)
    return balControl.is_valid
  }
}

const errorFactory = (message: string, errorCode?: BusinessErrorCodes) => ({ error: true, message, errorCode })

const getOpcoDataRaw = async (siret: string) => {
  const opcoResult: ICFADock | null = await getOpco(siret)
  switch (opcoResult?.searchStatus) {
    case "OK": {
      return { opco: opcoResult.opcoName, idcc: opcoResult.idcc.toString() }
    }
    case "MULTIPLE_OPCO": {
      return { opco: "Opco multiple", idcc: "Opco multiple, IDCC non défini" }
    }
    case null:
    case "NOT_FOUND": {
      const idccResult = await getIdcc(siret)
      if (!idccResult) return undefined
      const conventions = idccResult[0]?.conventions
      if (conventions?.length) {
        const num: number = conventions[0]?.num
        const opcoByIdccResult = await getOpcoByIdcc(num)
        if (opcoByIdccResult) {
          return { opco: opcoByIdccResult.opcoName, idcc: opcoByIdccResult.idcc.toString() }
        }
      }
      break
    }
  }
  return undefined
}

export const getOpcoData = async (siret: string) => {
  const siren = siret.substring(0, 9)
  const opcoFromDB = await getOpcoBySirenFromDB(siren)
  if (opcoFromDB) {
    const { opco, idcc } = opcoFromDB
    return { opco, idcc }
  } else {
    const result = await getOpcoDataRaw(siret)
    if (result) {
      const { opco, idcc } = result
      await saveOpco({ opco, idcc, siren })
    }
    return result
  }
}

export type EntrepriseData = IFormatAPIEntreprise & { opco: string; idcc: string; geo_coordinates: string }

export const validateCreationEntrepriseFromCfa = async ({ siret, cfa_delegated_siret }: { siret: string; cfa_delegated_siret?: string }) => {
  if (!cfa_delegated_siret) return
  const recruteurOpt = await getFormulaire({
    establishment_siret: siret,
    cfa_delegated_siret,
    status: { $in: [RECRUITER_STATUS.ACTIF, RECRUITER_STATUS.EN_ATTENTE_VALIDATION] },
  })
  if (recruteurOpt) {
    return errorFactory("L'entreprise est déjà référencée comme partenaire.")
  }
}

export const getEntrepriseDataFromSiret = async ({ siret, cfa_delegated_siret }: { siret: string; cfa_delegated_siret?: string }) => {
  const result = await getEtablissementFromGouvSafe(siret)
  if (!result) {
    return errorFactory("Le numéro siret est invalide.")
  }
  if (result === BusinessErrorCodes.NON_DIFFUSIBLE) {
    return errorFactory(
      `Les informations de votre entreprise sont non diffusibles. <a href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Espace%20pro%20-%20Donnees%20entreprise%20non%20diffusibles" target="_blank">Contacter le support pour en savoir plus</a>`,
      BusinessErrorCodes.NON_DIFFUSIBLE
    )
  }

  const { etat_administratif, activite_principale } = result.data

  if (etat_administratif === "F") {
    return errorFactory("Cette entreprise est considérée comme fermée.", BusinessErrorCodes.CLOSED)
  }
  // Check if a CFA already has the company as partenaire
  if (!cfa_delegated_siret) {
    // Allow cfa to add themselves as a company
    if (activite_principale.code.startsWith("85")) {
      return errorFactory("Le numéro siret n'est pas référencé comme une entreprise.", BusinessErrorCodes.IS_CFA)
    }
  }
  const entrepriseData = formatEntrepriseData(result.data)
  if (!entrepriseData.establishment_raison_sociale) {
    throw Boom.internal("pas de raison sociale trouvée", { siret, cfa_delegated_siret, entrepriseData, apiData: result.data })
  }
  const numeroEtRue = entrepriseData.address_detail.acheminement_postal.l4
  const codePostalEtVille = entrepriseData.address_detail.acheminement_postal.l6
  const { latitude, longitude } = await getGeoCoordinates(`${numeroEtRue}, ${codePostalEtVille}`).catch(() => getGeoCoordinates(codePostalEtVille))
  return { ...entrepriseData, geo_coordinates: `${latitude},${longitude}` }
}

export const getOrganismeDeFormationDataFromSiret = async (siret: string) => {
  const cfaUserRecruteurOpt = await getEtablissement({ establishment_siret: siret, type: CFA })
  if (cfaUserRecruteurOpt) {
    throw Boom.forbidden("Ce numéro siret est déjà associé à un compte utilisateur.", { reason: "EXIST" })
  }
  const referentiel = await getEtablissementFromReferentiel(siret)
  if (!referentiel) {
    throw Boom.badRequest("Le numéro siret n'est pas référencé comme centre de formation.", { reason: "UNKNOWN" })
  }
  if (referentiel.etat_administratif === "fermé") {
    throw Boom.badRequest("Le numéro siret indique un établissement fermé.", { reason: "CLOSED" })
  }
  const formattedReferentiel = formatReferentielData(referentiel)
  if (!formattedReferentiel.is_qualiopi) {
    throw Boom.badRequest("L’organisme rattaché à ce SIRET n’est pas certifié Qualiopi", { reason: "QUALIOPI", ...formattedReferentiel })
  }
  return formattedReferentiel
}

export const entrepriseOnboardingWorkflow = {
  create: async (
    {
      email,
      first_name,
      last_name,
      phone,
      siret,
      cfa_delegated_siret,
      origin,
      opco,
      idcc,
    }: {
      siret: string
      last_name: string
      first_name: string
      phone?: string
      email: string
      cfa_delegated_siret?: string
      origin?: string | null
      opco: string
      idcc?: string
    },
    {
      isUserValidated = false,
    }: {
      isUserValidated?: boolean
    } = {}
  ) => {
    const cfaErrorOpt = await validateCreationEntrepriseFromCfa({ siret, cfa_delegated_siret })
    if (cfaErrorOpt) return cfaErrorOpt
    const formatedEmail = email.toLocaleLowerCase()
    const userRecruteurOpt = await getUser({ email: formatedEmail })
    if (userRecruteurOpt) {
      return errorFactory("L'adresse mail est déjà associée à un compte La bonne alternance.", BusinessErrorCodes.ALREADY_EXISTS)
    }
    let entrepriseData: Partial<EntrepriseData>
    let hasSiretError = false
    try {
      const siretResponse = await getEntrepriseDataFromSiret({ siret, cfa_delegated_siret })
      if ("error" in siretResponse) {
        return siretResponse
      } else {
        entrepriseData = siretResponse
      }
    } catch (err) {
      hasSiretError = true
      entrepriseData = { establishment_siret: siret }
      sentryCaptureException(err)
    }
    const contactInfos = { first_name, last_name, phone, opco, idcc, origin }
    const savedData = { ...entrepriseData, ...contactInfos, email: formatedEmail }
    const formulaireInfo = await createFormulaire({
      ...savedData,
      status: RECRUITER_STATUS.ACTIF,
      jobs: [],
      cfa_delegated_siret,
    })
    const formulaireId = formulaireInfo.establishment_id
    let newEntreprise: IUserRecruteur = await createUser({ ...savedData, establishment_id: formulaireId, type: ENTREPRISE })

    if (hasSiretError) {
      newEntreprise = await setUserInError(newEntreprise._id, "Erreur lors de l'appel à l'API SIRET")
    } else if (isUserValidated) {
      newEntreprise = await autoValidateUser(newEntreprise._id)
    } else {
      const balValidationResult = await autoValidateCompany(newEntreprise)
      newEntreprise = balValidationResult.userRecruteur
    }
    return { formulaire: formulaireInfo, user: newEntreprise }
  },
  createFromCFA: async ({
    email,
    first_name,
    last_name,
    phone,
    siret,
    cfa_delegated_siret,
    origin,
    opco,
    idcc,
  }: {
    siret: string
    last_name: string
    first_name: string
    phone: string
    email: string
    cfa_delegated_siret: string
    origin?: string | null
    opco?: string
    idcc?: string | null
  }) => {
    const cfaErrorOpt = await validateCreationEntrepriseFromCfa({ siret, cfa_delegated_siret })
    if (cfaErrorOpt) return cfaErrorOpt
    const formatedEmail = email.toLocaleLowerCase()
    let entrepriseData: Partial<EntrepriseData>
    let siretCallInError = false
    try {
      const siretResponse = await getEntrepriseDataFromSiret({ siret, cfa_delegated_siret })
      if ("error" in siretResponse) {
        return siretResponse
      } else {
        entrepriseData = siretResponse
      }
    } catch (err) {
      siretCallInError = true
      entrepriseData = { establishment_siret: siret }
      sentryCaptureException(err)
    }
    const contactInfos = { first_name, last_name, phone, origin }
    const savedData = { ...entrepriseData, ...contactInfos, email: formatedEmail }
    const formulaireInfo = await createFormulaire({
      ...savedData,
      status: siretCallInError ? RECRUITER_STATUS.EN_ATTENTE_VALIDATION : RECRUITER_STATUS.ACTIF,
      jobs: [],
      cfa_delegated_siret,
      is_delegated: true,
      origin,
      opco,
      idcc,
    })
    return formulaireInfo
  },
}

export const sendUserConfirmationEmail = async (user: IUserRecruteur) => {
  const url = createValidationMagicLink(user)
  await mailer.sendEmail({
    to: user.email,
    subject: "Confirmez votre adresse mail",
    template: getStaticFilePath("./templates/mail-confirmation-email.mjml.ejs"),
    data: {
      images: {
        logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
      },
      last_name: user.last_name,
      first_name: user.first_name,
      confirmation_url: url,
    },
  })
}

export const sendEmailConfirmationEntreprise = async (user: IUserRecruteur, recruteur: IRecruiter) => {
  const userStatus = getUserStatus(user.status)
  if (userStatus === ETAT_UTILISATEUR.ERROR || user.is_email_checked) {
    return
  }
  const isUserAwaiting = userStatus !== ETAT_UTILISATEUR.VALIDE
  const { jobs, is_delegated, email } = recruteur
  const offre = jobs.at(0)
  if (jobs.length === 1 && offre && is_delegated === false) {
    // Get user account validation link
    const url = createValidationMagicLink(user)
    await mailer.sendEmail({
      to: email,
      subject: "Confirmez votre adresse mail",
      template: getStaticFilePath("./templates/mail-nouvelle-offre-depot-simplifie.mjml.ejs"),
      data: {
        images: {
          logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
        },
        nom: user.last_name,
        prenom: user.first_name,
        email: user.email,
        confirmation_url: url,
        offre: {
          rome_appellation_label: offre.rome_appellation_label,
          job_type: offre.job_type,
          job_level_label: offre.job_level_label,
          job_start_date: dayjs(offre.job_start_date).format("DD/MM/YY"),
        },
        isUserAwaiting,
      },
    })
  } else {
    await sendUserConfirmationEmail(user)
  }
}
