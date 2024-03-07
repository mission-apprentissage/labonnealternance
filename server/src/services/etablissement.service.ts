import { setTimeout } from "timers/promises"

import { AxiosResponse } from "axios"
import Boom from "boom"
import type { FilterQuery } from "mongoose"
import { IBusinessError, ICfaReferentielData, IEtablissement, ILbaCompany, IRecruiter, IReferentielOpco, ZCfaReferentielData } from "shared"
import { EDiffusibleStatus } from "shared/constants/diffusibleStatus"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { EntrepriseStatus } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { IUser2 } from "shared/models/user2.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { FCGetOpcoInfos } from "@/common/franceCompetencesClient"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getHttpClient } from "@/common/utils/httpUtils"
import { user2ToUserForToken } from "@/security/accessTokenService"

import { Cfa, Etablissement, LbaCompany, LbaCompanyLegacy, ReferentielOpco, RoleManagement, SiretDiffusibleStatus, UnsubscribeOF, User2 } from "../common/model/index"
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
import mailer, { sanitizeForEmail } from "./mailer.service"
import { getOpcoBySirenFromDB, saveOpco } from "./opco.service"
import {
  UserAndOrganization,
  autoValidateUser,
  createOrganizationUser,
  getUserRecruteurByEmail,
  isUserEmailChecked,
  setEntrepriseInError,
  setUserHasToBeManuallyValidated,
} from "./userRecruteur.service"

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
 * @description Get opco details from CFADOCK API for a given SIRET
 * @param {String} siret
 * @returns {Promise<Object>}
 */
export const getOpcoFromCfaDock = async (siret: string): Promise<{ opco: string; idcc: string } | undefined> => {
  try {
    const { data } = await getHttpClient({ timeout: 5000 }).get<ICFADock>(`https://www.cfadock.fr/api/opcos?siret=${encodeURIComponent(siret)}`)
    if (!data) {
      return undefined
    }
    const { searchStatus, opcoName, idcc } = data
    switch (searchStatus) {
      case "OK": {
        return { opco: opcoName, idcc: idcc.toString() }
      }
      case "MULTIPLE_OPCO": {
        return { opco: "Opco multiple", idcc: "Opco multiple, IDCC non défini" }
      }
      default: {
        return undefined
      }
    }
  } catch (err: any) {
    sentryCaptureException(err)
    return undefined
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
    if (data.data.status_diffusion !== EDiffusibleStatus.DIFFUSIBLE) {
      return BusinessErrorCodes.NON_DIFFUSIBLE
    }
    return data
  } catch (error: any) {
    const status = error?.response?.status
    if (status === 451) {
      return BusinessErrorCodes.NON_DIFFUSIBLE
    }
    if ([404, 422, 429].includes(status)) {
      return null
    }
    sentryCaptureException(error)
    throw error
  }
}

/**
 * @description Get diffusion status from the ENTREPRISE API for a given SIRET
 */
export const getEtablissementDiffusionStatus = async (siret: string): Promise<string> => {
  try {
    if (config.entreprise.simulateError) {
      throw new Error("API entreprise : simulation d'erreur")
    }

    const siretDiffusibleStatus = await SiretDiffusibleStatus.findOne({ siret }).lean()
    if (siretDiffusibleStatus) {
      return siretDiffusibleStatus.status_diffusion
    }

    const { data } = await getHttpClient({ timeout: 5000 }).get<IAPIEtablissement>(
      `${config.entreprise.baseUrl}/sirene/etablissements/diffusibles/${encodeURIComponent(siret)}/adresse`,
      {
        params: apiParams,
      }
    )
    await saveSiretDiffusionStatus(siret, data.data.status_diffusion)

    return data.data.status_diffusion
  } catch (error: any) {
    if (error?.response?.status === 404) {
      await saveSiretDiffusionStatus(siret, EDiffusibleStatus.NOT_FOUND)
      return EDiffusibleStatus.NOT_FOUND
    }
    if (error?.response?.status === 451) {
      await saveSiretDiffusionStatus(siret, EDiffusibleStatus.UNAVAILABLE)
      return EDiffusibleStatus.UNAVAILABLE
    }
    if (error?.response?.status === 429 || error?.response?.status === 504) {
      return "quota"
    }
    if (error?.code === "ECONNABORTED") {
      return "quota"
    }
    sentryCaptureException(error)
    throw error
  }
}

export const saveSiretDiffusionStatus = async (siret, diffusionStatus) => {
  try {
    await new SiretDiffusibleStatus({
      siret,
      status_diffusion: diffusionStatus,
    }).save()
  } catch (err) {
    // non blocking error
    sentryCaptureException(err)
  }
}

const MAX_RETRY = 100
const DELAY = 100

export const getDiffusionStatus = async (siret: string, count = 1) => {
  const isDiffusible = await getEtablissementDiffusionStatus(siret)
  if (isDiffusible === "quota") {
    if (count > MAX_RETRY) throw Boom.internal(`Api entreprise or cache entreprise not availabe. Tried ${MAX_RETRY} times`)
    await setTimeout(DELAY, "result")
    return await getDiffusionStatus(siret, count++)
  }
  return isDiffusible
}

export const checkIsDiffusible = async (siret: string) => (await getDiffusionStatus(siret)) === EDiffusibleStatus.DIFFUSIBLE

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

function geometryToGeoCoord(geometry: any): [number, number] {
  const { type } = geometry
  if (type === "Point") {
    return geometry.coordinates
  } else if (type === "Polygon") {
    return geometry.coordinates[0][0]
  } else {
    throw new Error(`Badly formatted geometry. type=${type}`)
  }
}

/**
 * @description Format Referentiel data
 */
export const formatReferentielData = (d: IReferentiel): ICfaReferentielData => {
  const geojson = d.adresse?.geojson ?? d.lieux_de_formation.at(0)?.adresse?.geojson
  if (!geojson) {
    throw Boom.internal("impossible de lire la geometry")
  }
  const coords = geometryToGeoCoord(geojson.geometry)

  const referentielData = {
    establishment_state: d.etat_administratif,
    is_qualiopi: d.qualiopi,
    establishment_siret: d.siret,
    establishment_raison_sociale: d.raison_sociale,
    contacts: d.contacts,
    address_detail: d.adresse,
    address: d.adresse?.label,
    geo_coordinates: `${coords[1]},${coords[0]}`,
    geopoint: {
      type: "Point",
      coordinates: coords,
    },
  }
  const validation = ZCfaReferentielData.safeParse(referentielData)
  if (!validation.success) {
    sentryCaptureException(Boom.internal(`erreur de validation sur les données du référentiel CFA pour le siret=${d.siret}.`, { validationError: validation.error }))
  }
  return referentielData
}

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

export const autoValidateCompany = async (userAndEntreprise: UserAndOrganization) => {
  const validated = await isCompanyValid(userAndEntreprise)
  if (validated) {
    await autoValidateUser(userAndEntreprise)
  } else {
    await setUserHasToBeManuallyValidated(userAndEntreprise)
  }
  return { validated }
}

export const isCompanyValid = async (props: UserAndOrganization): Promise<boolean> => {
  const {
    organization: { siret },
    user: { email },
  } = props
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

const errorFactory = (message: string, errorCode?: BusinessErrorCodes): IBusinessError => ({ error: true, message, errorCode })

const getOpcoFromCfaDockByIdcc = async (siret: string): Promise<{ opco: string; idcc: string } | undefined> => {
  const idccResult = await getIdcc(siret)
  if (!idccResult) return undefined
  const convention = idccResult.conventions?.at(0)
  if (convention) {
    const { num } = convention
    const opcoByIdccResult = await getOpcoByIdcc(num)
    if (opcoByIdccResult) {
      return { opco: opcoByIdccResult.opcoName, idcc: opcoByIdccResult.idcc.toString() }
    }
  }
}

const getOpcoFromFranceCompetences = async (siret: string): Promise<{ opco: string } | undefined> => {
  const opcoOpt = await FCGetOpcoInfos(siret)
  return opcoOpt ? { opco: opcoOpt } : undefined
}

const getOpcoDataRaw = async (siret: string): Promise<{ opco: string; idcc?: string } | undefined> => {
  return (await getOpcoFromCfaDock(siret)) ?? (await getOpcoFromCfaDockByIdcc(siret)) ?? (await getOpcoFromFranceCompetences(siret))
}

export const getOpcoData = async (siret: string): Promise<{ opco: string; idcc?: string | null } | undefined> => {
  const siren = siret.substring(0, 9)
  const opcoFromDB = await getOpcoBySirenFromDB(siren)
  if (opcoFromDB) {
    return opcoFromDB
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

export const getEntrepriseDataFromSiret = async ({ siret, type }: { siret: string; type: "CFA" | "ENTREPRISE" }) => {
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
  if (type === ENTREPRISE) {
    // Allow cfa to add themselves as a company
    if (activite_principale.code.startsWith("85")) {
      return errorFactory("Le numéro siret n'est pas référencé comme une entreprise.", BusinessErrorCodes.IS_CFA)
    }
  }
  const entrepriseData = formatEntrepriseData(result.data)
  if (!entrepriseData.establishment_raison_sociale) {
    throw Boom.internal("pas de raison sociale trouvée", { siret, type, entrepriseData, apiData: result.data })
  }
  const numeroEtRue = entrepriseData.address_detail.acheminement_postal.l4
  const codePostalEtVille = entrepriseData.address_detail.acheminement_postal.l6
  const { latitude, longitude } = await getGeoCoordinates(`${numeroEtRue}, ${codePostalEtVille}`).catch(() => getGeoCoordinates(codePostalEtVille))
  return { ...entrepriseData, geo_coordinates: `${latitude},${longitude}`, geopoint: { type: "Point", coordinates: [longitude, latitude] as [number, number] } }
}

const isCfaCreationValid = async (siret: string): Promise<boolean> => {
  const cfa = await Cfa.findOne({ siret }).lean()
  if (!cfa) return true
  const role = await RoleManagement.findOne({ authorized_type: AccessEntityType.CFA, authorized_id: cfa._id.toString() }).lean()
  if (!role) return true
  if (getLastStatusEvent(role.status)?.status !== AccessStatus.DENIED) {
    return false
  }
  return true
}

export const getOrganismeDeFormationDataFromSiret = async (siret: string, shouldValidate = true) => {
  if (shouldValidate) {
    const isValid = await isCfaCreationValid(siret)
    if (!isValid) {
      throw Boom.forbidden("Ce numéro siret est déjà associé à un compte utilisateur.", { reason: BusinessErrorCodes.ALREADY_EXISTS })
    }
  }
  const referentiel = await getEtablissementFromReferentiel(siret)
  if (!referentiel) {
    throw Boom.badRequest("Le numéro siret n'est pas référencé comme centre de formation.", { reason: BusinessErrorCodes.UNKNOWN })
  }
  if (shouldValidate && referentiel.etat_administratif === "fermé") {
    throw Boom.badRequest("Le numéro siret indique un établissement fermé.", { reason: BusinessErrorCodes.CLOSED })
  }
  if (!referentiel.adresse) {
    throw Boom.badRequest("Pour des raisons techniques, les organismes de formation à distance ne sont pas acceptés actuellement.", {
      reason: BusinessErrorCodes.UNSUPPORTED,
    })
  }
  const formattedReferentiel = formatReferentielData(referentiel)
  if (shouldValidate && !formattedReferentiel.is_qualiopi) {
    throw Boom.badRequest("L’organisme rattaché à ce SIRET n’est pas certifié Qualiopi", { reason: BusinessErrorCodes.NOT_QUALIOPI, ...formattedReferentiel })
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
  ): Promise<IBusinessError | { formulaire: IRecruiter; user: IUser2 }> => {
    const cfaErrorOpt = await validateCreationEntrepriseFromCfa({ siret, cfa_delegated_siret })
    if (cfaErrorOpt) return cfaErrorOpt
    const formatedEmail = email.toLocaleLowerCase()
    const userRecruteurOpt = await getUserRecruteurByEmail(formatedEmail)
    if (userRecruteurOpt) {
      return errorFactory("L'adresse mail est déjà associée à un compte La bonne alternance.", BusinessErrorCodes.ALREADY_EXISTS)
    }
    let entrepriseData: Partial<EntrepriseData>
    let hasSiretError = false
    try {
      const siretResponse = await getEntrepriseDataFromSiret({ siret, type: cfa_delegated_siret ? CFA : ENTREPRISE })
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
    const creationResult = await createOrganizationUser({
      ...savedData,
      establishment_id: formulaireId,
      type: ENTREPRISE,
      is_email_checked: false,
      is_qualiopi: false,
    })

    if (hasSiretError) {
      await setEntrepriseInError(creationResult.organization._id, "Erreur lors de l'appel à l'API SIRET")
    } else if (isUserValidated) {
      await autoValidateUser(creationResult)
    } else {
      await autoValidateCompany(creationResult)
    }
    return { formulaire: formulaireInfo, user: creationResult.user }
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
      const siretResponse = await getEntrepriseDataFromSiret({ siret, type: cfa_delegated_siret ? CFA : ENTREPRISE })
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

export const sendUserConfirmationEmail = async (user: IUser2) => {
  const url = createValidationMagicLink(user2ToUserForToken(user))
  await mailer.sendEmail({
    to: user.email,
    subject: "Confirmez votre adresse mail",
    template: getStaticFilePath("./templates/mail-confirmation-email.mjml.ejs"),
    data: {
      images: {
        logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
      },
      last_name: sanitizeForEmail(user.last_name),
      first_name: sanitizeForEmail(user.first_name),
      confirmation_url: url,
    },
  })
}

export const sendEmailConfirmationEntreprise = async (user: IUser2, recruteur: IRecruiter, accessStatus: AccessStatus, entrepriseStatus: EntrepriseStatus) => {
  if (entrepriseStatus === EntrepriseStatus.ERROR || isUserEmailChecked(user) || accessStatus === AccessStatus.DENIED) {
    return
  }
  const isUserAwaiting = accessStatus === AccessStatus.AWAITING_VALIDATION
  const { jobs, is_delegated, email } = recruteur
  const offre = jobs.at(0)
  if (jobs.length === 1 && offre && is_delegated === false) {
    // Get user account validation link
    const url = createValidationMagicLink(user2ToUserForToken(user))
    await mailer.sendEmail({
      to: email,
      subject: "Confirmez votre adresse mail",
      template: getStaticFilePath("./templates/mail-nouvelle-offre-depot-simplifie.mjml.ejs"),
      data: {
        images: {
          logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
        },
        nom: sanitizeForEmail(user.last_name),
        prenom: sanitizeForEmail(user.first_name),
        email: sanitizeForEmail(user.email),
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
    const user2 = await User2.findOne({ _id: user._id.toString() }).lean()
    if (!user2) {
      throw Boom.internal(`could not find user with id=${user._id}`)
    }
    await sendUserConfirmationEmail(user2)
  }
}

export const sendMailCfaPremiumStart = (etablissement: IEtablissement, type: "affelnet" | "parcoursup") => {
  if (!etablissement.gestionnaire_email) {
    throw Boom.badRequest("Gestionnaire email not found")
  }

  const subject =
    type === "affelnet" ? `La prise de RDV est activée pour votre CFA sur Choisir son affectation après la 3e` : `La prise de RDV est activée pour votre CFA sur Parcoursup`

  return mailer.sendEmail({
    to: etablissement.gestionnaire_email,
    subject,
    template: getStaticFilePath("./templates/mail-cfa-premium-start.mjml.ejs"),
    data: {
      ...(type === "affelnet" ? { isAffelnet: true } : type === "parcoursup" ? { isParcoursup: true } : {}),
      images: {
        logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
        logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
      },
      etablissement: {
        name: etablissement.raison_sociale,
        formateur_address: etablissement.formateur_address,
        formateur_zip_code: etablissement.formateur_zip_code,
        formateur_city: etablissement.formateur_city,
        formateur_siret: etablissement.formateur_siret,
        gestionnaire_email: etablissement.gestionnaire_email,
      },
      activationDate: dayjs().format("DD/MM/YYYY"),
    },
  })
}
