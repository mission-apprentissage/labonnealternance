//@ts-nocheck
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import axios, { AxiosResponse } from "axios"
import { pick } from "lodash-es"
import { Filter } from "mongodb"
import { Etablissement, LbaCompany, LbaCompanyLegacy, ReferentielOpco, UnsubscribeOF, UserRecruteur } from "../common/model/index"
import { IEtablissement } from "../common/model/schema/etablissements/etablissement.types"
import { ILbaCompany } from "../common/model/schema/lbaCompany/lbaCompany.types"
import { IRecruiter } from "../common/model/schema/recruiter/recruiter.types"
import { IReferentielOpco } from "../common/model/schema/referentielOpco/referentielOpco.types"
import { IUserRecruteur } from "../common/model/schema/userRecruteur/userRecruteur.types"
import { isEmailFromPrivateCompany, isEmailSameDomain } from "../common/utils/mailUtils"
import { sentryCaptureException } from "../common/utils/sentryUtils"
import config from "../config"
import { validationOrganisation } from "./bal.service"
import { getCatalogueEtablissements } from "./catalogue.service"
import { BusinessErrorCodes, CFA, ENTREPRISE, ETAT_UTILISATEUR, RECRUITER_STATUS } from "./constant.service"
import {
  IAPIAdresse,
  IAPIEtablissement,
  ICFADock,
  IEtablissementCatalogue,
  IEtablissementGouv,
  IFormatAPIEntreprise,
  IFormatAPIReferentiel,
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
export const find = async (conditions): Promise<IEtablissement[]> => Etablissement.find(conditions)

/**
 * @description Returns one item.
 * @param {Object} conditions
 * @returns {Promise<Etablissement>}
 */
export const findOne = async (conditions): Promise<IEtablissement | null> => Etablissement.findOne(conditions)

/**
 * @description Updates an etablissement from its conditions.
 * @param {Object} conditions
 * @param {Object} values
 * @returns {Promise<Etablissement>}
 */
export const findOneAndUpdate = async (conditions, values): Promise<IEtablissement | null> => Etablissement.findOneAndUpdate(conditions, values, { new: true })

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
export const findByIdAndUpdate = async (id, values): Promise<IEtablissement | null> => Etablissement.findByIdAndUpdate({ _id: id }, values, { new: true })

/**
 * @description Deletes an etablissement from its id.
 * @param {ObjectId} id
 * @returns {Promise<void>}
 */
export const findByIdAndDelete = async (id): Promise<IEtablissement | null> => Etablissement.findByIdAndDelete(id)

/**
 * @description Get etablissement from a given query
 * @param {Object} query
 * @returns {Promise<void>}
 */
export const getEtablissement = async (query: Filter<IUserRecruteur>): Promise<IUserRecruteur | null> => UserRecruteur.findOne(query)

/**
 * @description Get opco details from CFADOCK API for a given SIRET
 * @param {String} siret
 * @returns {Promise<Object>}
 */
export const getOpco = async (siret: string): Promise<ICFADock | null> => {
  try {
    const { data } = await axios.get<ICFADock>(`https://www.cfadock.fr/api/opcos?siret=${encodeURIComponent(siret)}`)
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
    const { data } = await axios.get<ICFADock>(`https://www.cfadock.fr/api/opcos?idcc=${idcc}`)
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
export const getIdcc = async (siret: string): Promise<ISIRET2IDCC> => {
  try {
    const { data } = await axios.get<ISIRET2IDCC>(`https://siret2idcc.fabrique.social.gouv.fr/api/v2/${encodeURIComponent(siret)}`)
    return data
  } catch (err) {
    sentryCaptureException(err)
    return null
  }
}
/**
 * @description Get the establishment validation url for a given SIRET
 * @param {IRecruiter["_id"]} _id
 * @returns {String}
 */
export const getValidationUrl = (_id: IRecruiter["_id"]): string => `${config.publicUrlEspacePro}/authentification/validation/${_id}`
/**
 * @description Validate the establishment email for a given ID
 * @param {IUserRecruteur["_id"]} _id
 * @returns {Promise<void>}
 */
export const validateEtablissementEmail = async (_id: IUserRecruteur["_id"]): Promise<IUserRecruteur | null> => UserRecruteur.findByIdAndUpdate(_id, { is_email_checked: true })

/**
 * @description Get the establishment information from the ENTREPRISE API for a given SIRET
 * @param {String} siret
 * @returns {Promise<IApiEntreprise>}
 */
export const getEtablissementFromGouv = async (siret: string): Promise<IAPIEtablissement> => {
  try {
    const { data } = await axios.get<IAPIEtablissement>(`${config.entreprise.baseUrl}/sirene/etablissements/${encodeURIComponent(siret)}`, {
      params: apiParams,
    })
    return data
  } catch (error) {
    if (error?.response?.status === 404 || error?.response?.status === 422) {
      return null
    }
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
  } catch (error: any) {
    sentryCaptureException(error)
    if (error?.response?.status === 404) {
      // @ts-ignore
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
    const result: IEtablissementCatalogue = await axios.get("https://catalogue.apprentissage.beta.gouv.fr/api/v1/entity/etablissements/", {
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
/**
 * @description Get the geolocation information from the ADDRESS API for a given address
 * @param {String} adresse
 * @returns {Promise<string>}
 */
export const getGeoCoordinates = async (adresse: string): Promise<string> => {
  try {
    const response: AxiosResponse<IAPIAdresse> = await axios.get(`https://api-adresse.data.gouv.fr/search/?q=${adresse}`)
    // eslint-disable-next-line no-unsafe-optional-chaining
    const [firstFeature] = response.data?.features
    if (!firstFeature) {
      return "NOT FOUND"
    }
    return firstFeature.geometry.coordinates.reverse().join(",")
  } catch (error: any) {
    sentryCaptureException(error)
    return "NOT FOUND"
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
 * @param {Filter<IReferentielOpco>} query
 * @returns {Promise<IReferentielOpco[]>}
 */
export const getAllEstablishmentFromOpcoReferentiel = async (query: Filter<IReferentielOpco>): Promise<IReferentielOpco[]> => await ReferentielOpco.find(query).lean()
/**
 * @description Get all matching records from the LbaCompanyLegacy collection
 * @param {Filter<ILbaCompany>} query
 * @returns {Promise<ILbaCompany["email"]>}
 */
export const getAllEstablishmentFromLbaCompanyLegacy = async (query: Filter<ILbaCompany>): Promise<ILbaCompany[]> =>
  await LbaCompanyLegacy.find(query).select({ email: 1, _id: 0 }).lean()

/**
 * @description Get all matching records from the LbaCompanies collection
 * @param {Filter<ILbaCompany>} query
 * @returns {Promise<ILbaCompany["email"]>}
 */
export const getAllEstablishmentFromLbaCompany = async (query: Filter<ILbaCompany>): Promise<ILbaCompany[]> => await LbaCompany.find(query).select({ email: 1, _id: 0 }).lean()

/**
 * @description Format Entreprise data
 * @param {IEtablissementGouv} data
 * @returns {IFormatAPIEntreprise}
 */
export const formatEntrepriseData = (d: IEtablissementGouv): IFormatAPIEntreprise => ({
  establishment_enseigne: d.enseigne,
  establishment_state: d.etat_administratif, // F pour fermé ou A pour actif
  establishment_siret: d.siret,
  establishment_raison_sociale: d.unite_legale.personne_morale_attributs.raison_sociale,
  address_detail: d.adresse,
  address: `${d.adresse.acheminement_postal.l4} ${d.adresse.acheminement_postal.l6}`,
  contacts: [], // conserve la coherence avec l'UI
  naf_code: d.activite_principale.code,
  naf_label: d.activite_principale.libelle,
  establishment_size: getEffectif(d.unite_legale.tranche_effectif_salarie.code),
  establishment_creation_date: new Date(d.unite_legale.date_creation * 1000).toISOString(),
})

/**
 * @description Format Referentiel data
 * @param {IReferentiel} d
 * @returns {Object}
 */
export const formatReferentielData = (d: IReferentiel): IFormatAPIReferentiel => ({
  establishment_state: d.etat_administratif,
  is_qualiopi: d.qualiopi,
  establishment_siret: d.siret,
  establishment_raison_sociale: d.raison_sociale,
  contacts: d.contacts,
  address_detail: d.adresse,
  address: d.adresse?.label,
  geo_coordinates: d.adresse
    ? `${d.adresse?.geojson.geometry.coordinates[1]},${d.adresse?.geojson.geometry.coordinates[0]}`
    : `${d.lieux_de_formation[0].adresse.geojson?.geometry.coordinates[0]},${d.lieux_de_formation[0].adresse.geojson?.geometry.coordinates[1]}`,
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
  const { establishment_siret: siret, email, _id } = userRecruteur
  const siren = siret.slice(0, 9)
  // Get all corresponding records using the SIREN number in BonneBoiteLegacy collection
  const [bonneBoiteLegacyList, bonneBoiteList, referentielOpcoList] = await Promise.all([
    getAllEstablishmentFromLbaCompanyLegacy({ siret: { $regex: siren }, email: { $nin: ["", undefined] } }),
    getAllEstablishmentFromLbaCompany({ siret: { $regex: siren }, email: { $nin: ["", undefined] } }),
    getAllEstablishmentFromOpcoReferentiel({ siret_code: { $regex: siren } }),
  ])

  // Format arrays to get only the emails
  const bonneBoiteLegacyEmailList = bonneBoiteLegacyList.map(({ email }) => email)
  const bonneBoiteEmailList = bonneBoiteList.map(({ email }) => email)
  const referentielOpcoEmailList = referentielOpcoList.flatMap((item) => item.emails)

  // Create a single array with all emails duplicate free
  const validEmails = [...new Set([...referentielOpcoEmailList, ...bonneBoiteLegacyEmailList, ...bonneBoiteEmailList])]

  // Check BAL API for validation

  const isValid = validEmails.includes(email) || (isEmailFromPrivateCompany(email) && validEmails.some((validEmail) => isEmailSameDomain(email, validEmail)))
  if (isValid) {
    userRecruteur = await autoValidateUser(_id)
  } else {
    const balControl = await validationOrganisation(siret, email)
    if (balControl.is_valid) {
      userRecruteur = await autoValidateUser(_id)
    } else {
      userRecruteur = await setUserHasToBeManuallyValidated(_id)
    }
  }
  return { userRecruteur, validated: isValid }
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
      await saveOpco({ opco, idcc, siren, url: null })
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
  const result = await getEtablissementFromGouv(siret)
  if (!result) {
    return errorFactory("Le numéro siret est invalide.")
  }
  const { etat_administratif, activite_principale } = result.data
  if (etat_administratif === "F") {
    return errorFactory("Cette entreprise est considérée comme fermée.")
  }
  // Check if a CFA already has the company as partenaire
  if (!cfa_delegated_siret) {
    // Allow cfa to add themselves as a company
    if (activite_principale.code.startsWith("85")) {
      return errorFactory("Le numéro siret n'est pas référencé comme une entreprise.", BusinessErrorCodes.IS_CFA)
    }
  }
  const entrepriseData = formatEntrepriseData(result.data)
  const geo_coordinates = await getGeoCoordinates(`${entrepriseData.address_detail.acheminement_postal.l4}, ${entrepriseData.address_detail.acheminement_postal.l6}`)
  return { ...entrepriseData, geo_coordinates }
}

export const getOrganismeDeFormationDataFromSiret = async (siret: string) => {
  const cfaUserRecruteurOpt = await getEtablissement({ establishment_siret: siret, type: CFA })
  if (cfaUserRecruteurOpt) {
    return errorFactory("EXIST", BusinessErrorCodes.ALREADY_EXISTS)
  }
  const referentiel = await getEtablissementFromReferentiel(siret)
  if (!referentiel) {
    return errorFactory("UNKNOWN")
  }
  if (referentiel.etat_administratif === "fermé") {
    return errorFactory("CLOSED")
  }
  return formatReferentielData(referentiel)
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
      origin: string
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
    origin: string
    opco?: string
    idcc?: string
  }) => {
    const cfaErrorOpt = await validateCreationEntrepriseFromCfa({ siret, cfa_delegated_siret })
    if (cfaErrorOpt) return cfaErrorOpt
    const formatedEmail = email.toLocaleLowerCase()
    let entrepriseData: Partial<EntrepriseData>
    try {
      const siretResponse = await getEntrepriseDataFromSiret({ siret, cfa_delegated_siret })
      if ("error" in siretResponse) {
        return siretResponse
      } else {
        entrepriseData = siretResponse
      }
    } catch (err) {
      entrepriseData = { establishment_siret: siret }
      sentryCaptureException(err)
    }
    const contactInfos = { first_name, last_name, phone, origin }
    const savedData = { ...entrepriseData, ...contactInfos, email: formatedEmail }
    const formulaireInfo = await createFormulaire({
      ...savedData,
      status: RECRUITER_STATUS.EN_ATTENTE_VALIDATION,
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

export const sendUserConfirmationEmail = async ({
  email,
  firstName,
  lastName,
  userRecruteurId,
}: {
  email: string
  lastName: string
  firstName: string
  userRecruteurId: IUserRecruteur["_id"]
}) => {
  const url = getValidationUrl(userRecruteurId)
  await mailer.sendEmail({
    to: email,
    subject: "Confirmez votre adresse mail",
    template: getStaticFilePath("./templates/mail-confirmation-email.mjml.ejs"),
    data: {
      images: {
        logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
      },
      last_name: lastName,
      first_name: firstName,
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
  // Get user account validation link
  const url = getValidationUrl(user._id)
  if (jobs.length === 1 && offre && is_delegated === false) {
    await mailer.sendEmail({
      to: email,
      subject: "Confirmez votre adresse mail",
      template: getStaticFilePath("./templates/mail-nouvelle-offre-depot-simplifie.mjml.ejs"),
      data: {
        images: {
          logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
        },
        nom: user.last_name,
        prenom: user.first_name,
        email: user.email,
        confirmation_url: url,
        offre: pick(offre, ["rome_appellation_label", "job_start_date", "type", "job_level_label"]),
        isUserAwaiting,
      },
    })
  } else {
    await sendUserConfirmationEmail({
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      userRecruteurId: user._id,
    })
  }
}
