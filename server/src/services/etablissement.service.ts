import { setTimeout } from "timers/promises"

import { badRequest, internal, isBoom } from "@hapi/boom"
import { AxiosResponse } from "axios"
import { Filter as MongoDBFilter, ObjectId } from "mongodb"
import { IAdresseV3, IBusinessError, ICfaReferentielData, IEtablissement, IGeoPoint, ILbaCompany, ILbaCompanyLegacy, IRecruiter, ZCfaReferentielData, ZPointGeometry } from "shared"
import { CFA, ENTREPRISE, RECRUITER_STATUS } from "shared/constants"
import { EDiffusibleStatus } from "shared/constants/diffusibleStatus"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { EntrepriseStatus, IEntreprise } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { IUserWithAccount } from "shared/models/userWithAccount.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { getEtablissementDiffusionStatus, getEtablissementFromGouvSafe } from "@/common/apis/apiEntreprise/apiEntreprise.client"
import { FCGetOpcoInfos } from "@/common/apis/franceCompetences/franceCompetencesClient"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getHttpClient } from "@/common/utils/httpUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { userWithAccountToUserForToken } from "@/security/accessTokenService"
import { emailHasActiveRole, isUserEmailChecked } from "@/services/userWithAccount.service"

import { isEmailFromPrivateCompany, isEmailSameDomain } from "../common/utils/mailUtils"
import { sentryCaptureException } from "../common/utils/sentryUtils"
import config from "../config"

import { createValidationMagicLink } from "./appLinks.service"
import { validationOrganisation } from "./bal.service"
import { getCatalogueEtablissements } from "./catalogue.service"
import { upsertCfa } from "./cfa.service"
import dayjs from "./dayjs.service"
import { IAPIAdresse, IAPIEtablissement, ICFADock, IEtablissementGouv, IFormatAPIEntreprise, IReferentiel, ISIRET2IDCC } from "./etablissement.service.types"
import { createFormulaire, getFormulaire } from "./formulaire.service"
import mailer, { sanitizeForEmail } from "./mailer.service"
import { getOpcoBySirenFromDB, saveOpco } from "./opco.service"
import { UserAndOrganization, updateEntrepriseOpco, upsertEntrepriseData } from "./organization.service"
import { modifyPermissionToUser } from "./roleManagement.service"
import { autoValidateUser as authorizeUserOnEntreprise, createOrganizationUser, setUserHasToBeManuallyValidated } from "./userRecruteur.service"

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
 * @description Returns one item.
 * @param {Object} conditions
 * @returns {Promise<Etablissement>}
 */
export const findOne = async (conditions): Promise<IEtablissement | null> => getDbCollection("etablissements").findOne(conditions)

/**
 * @description Get opco details from CFADOCK API for a given SIRET
 * @param {String} siret
 * @returns {Promise<Object>}
 */
const getOpcoFromCfaDock = async (siret: string): Promise<{ opco: string; idcc?: string } | undefined> => {
  try {
    const { data } = await getHttpClient({ timeout: 5000 }).get<ICFADock>(`https://www.cfadock.fr/api/opcos?siret=${encodeURIComponent(siret)}`)
    if (!data) {
      return undefined
    }
    const { searchStatus, opcoName, idcc } = data
    switch (searchStatus) {
      case "OK": {
        return { opco: opcoName, idcc: idcc?.toString() }
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
const getOpcoByIdcc = async (idcc: number): Promise<ICFADock | null> => {
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
const getIdcc = async (siret: string): Promise<ISIRET2IDCC | null> => {
  try {
    const { data } = await getHttpClient({ timeout: 5000 }).get<ISIRET2IDCC>(`https://siret2idcc.fabrique.social.gouv.fr/api/v2/${encodeURIComponent(siret)}`)
    return data
  } catch (err) {
    sentryCaptureException(err)
    return null
  }
}

const MAX_RETRY = 100
const DELAY = 100

export const getDiffusionStatus = async (siret: string, count = 1) => {
  const isDiffusible = await getEtablissementDiffusionStatus(siret)
  if (isDiffusible === "quota") {
    if (count > MAX_RETRY) throw internal(`Api entreprise or cache entreprise not availabe. Tried ${MAX_RETRY} times`)
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
    throw internal(BusinessErrorCodes.NON_DIFFUSIBLE)
  }
  return data
}
/**
 * @description Get the establishment information from the REFERENTIEL API for a given SIRET
 */
const getEtablissementFromReferentiel = async (siret: string): Promise<IReferentiel | null> => {
  try {
    const { data } = await getHttpClient().get<IReferentiel>(`https://referentiel.apprentissage.beta.gouv.fr/api/v1/organismes/${siret}`)
    return data
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null
    } else {
      sentryCaptureException(error)
      throw error
    }
  }
}

// when in string format: $latitude,$longitude
export type GeoCoord = {
  latitude: number
  longitude: number
}

export const getGeoPoint = async (adresse: string): Promise<IGeoPoint> => {
  try {
    const response: AxiosResponse<IAPIAdresse> = await getHttpClient().get(`https://api-adresse.data.gouv.fr/search?q=${encodeURIComponent(adresse)}&limit=1`)
    const firstFeature = response.data?.features.at(0)
    if (!firstFeature) {
      throw internal("getGeoPoint: addresse non trouvée", { adresse })
    }

    return ZPointGeometry.parse(firstFeature.geometry)
  } catch (error: any) {
    if (isBoom(error)) {
      throw error
    }
    const newError = internal(`getGeoPoint: erreur de récupération des geo coordonnées`, { adresse })
    newError.cause = error
    throw newError
  }
}

export const getGeoCoordinates = async (adresse: string): Promise<GeoCoord> => {
  const geopoint = await getGeoPoint(adresse)
  const [longitude, latitude] = geopoint.coordinates

  return { latitude, longitude }
}

type IGetAllEmailFromLbaCompanyLegacy = Pick<ILbaCompanyLegacy, "email">
export const getAllEstablishmentFromLbaCompanyLegacy = async (query: MongoDBFilter<ILbaCompanyLegacy>) =>
  (await getDbCollection("recruteurslbalegacies").find(query).project({ email: 1, _id: 0 }).toArray()) as IGetAllEmailFromLbaCompanyLegacy[]

type IGetAllEmailFromLbaCompany = Pick<ILbaCompany, "email">
export const getAllEstablishmentFromLbaCompany = async (query: MongoDBFilter<ILbaCompany>) =>
  (await getDbCollection("recruteurslba").find(query).project({ email: 1, _id: 0 }).toArray()) as IGetAllEmailFromLbaCompany[]

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

const addressDetailToString = (address: IAdresseV3): string => {
  const { l4 = "", l6 = "", l7 = "" } = address?.acheminement_postal ?? {}
  return [l4, l6, l7 === "FRANCE" ? null : l7].filter((_) => _).join(" ")
}

/**
 * @description Format Entreprise data
 */
const formatEntrepriseData = (d: IEtablissementGouv): IFormatAPIEntreprise => {
  if (!d.adresse) {
    throw new Error("erreur dans le format de l'api SIRENE : le champ adresse est vide")
  }
  return {
    establishment_enseigne: d.enseigne,
    establishment_state: d.etat_administratif, // F pour fermé ou A pour actif
    establishment_siret: d.siret,
    establishment_raison_sociale: getRaisonSocialeFromGouvResponse(d),
    address_detail: d.adresse,
    address: addressDetailToString(d.adresse),
    contacts: [], // conserve la coherence avec l'UI
    naf_code: d.activite_principale.code,
    naf_label: d.activite_principale.libelle,
    establishment_size: getEffectif(d.unite_legale.tranche_effectif_salarie.code),
    establishment_creation_date: new Date(d.unite_legale.date_creation * 1000),
  }
}

function geometryToGeoCoord(geometry): [number, number] {
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
    throw internal("impossible de lire la geometry")
  }
  const coords = geometryToGeoCoord(geojson.geometry)

  const referentielData: ICfaReferentielData = {
    establishment_state: d.etat_administratif,
    is_qualiopi: Boolean(d.qualiopi),
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
  } as ICfaReferentielData
  const validation = ZCfaReferentielData.safeParse(referentielData)
  if (!validation.success) {
    sentryCaptureException(internal(`erreur de validation sur les données du référentiel CFA pour le siret=${d.siret}.`, { validationError: validation.error }))
  }
  return validation.data ?? referentielData
}

/**
 * Taggue l'organisme de formation pour qu'il ne reçoive plus de demande de délégation
 * @param etablissementSiret siret de l'organisme de formation ne souhaitant plus recevoir les demandes
 */
export const etablissementUnsubscribeDemandeDelegation = async (etablissementSiret: string) => {
  const unsubscribeOF = await getDbCollection("unsubscribedofs").findOne({ establishment_siret: etablissementSiret })

  if (!unsubscribeOF) {
    const { etablissements } = await getCatalogueEtablissements(
      {
        siret: etablissementSiret,
      },
      { _id: 1 }
    )
    const [{ _id }] = etablissements
    if (!_id) return
    await getDbCollection("unsubscribedofs").insertOne({
      _id: new ObjectId(),
      catalogue_id: _id,
      establishment_siret: etablissementSiret,
      unsubscribe_date: new Date(),
    })
  }
}

export const autoValidateUserRoleOnCompany = async (userAndEntreprise: UserAndOrganization, origin: string) => {
  const { isValid: validated, validator } = await isCompanyValid(userAndEntreprise)
  const reason = `validaton par : ${validator}`
  if (validated) {
    await authorizeUserOnEntreprise(userAndEntreprise, origin, reason)
  } else {
    await setUserHasToBeManuallyValidated(userAndEntreprise, origin)
  }
  return { validated }
}

const isCompanyValid = async (props: UserAndOrganization): Promise<{ isValid: boolean; validator: string }> => {
  const {
    organization,
    user: { email },
  } = props
  const siret = organization.type === CFA ? organization.cfa.siret : organization.entreprise.siret
  if (!siret) {
    return { isValid: false, validator: "siret manquant" }
  }

  const siren = siret.slice(0, 9)
  const sirenRegex = `^${siren}`
  // Get all corresponding records using the SIREN number in BonneBoiteLegacy collection
  const [bonneBoiteLegacyList, bonneBoiteList, referentielOpcoList] = await Promise.all([
    getAllEstablishmentFromLbaCompanyLegacy({ siret: { $regex: sirenRegex }, email: { $nin: ["", null] } }),
    getAllEstablishmentFromLbaCompany({ siret: { $regex: sirenRegex }, email: { $nin: ["", null] } }),
    getDbCollection("referentielopcos")
      .find({ siret_code: { $regex: sirenRegex } })
      .toArray(),
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
    return { isValid: true, validator: "bonnes boites ou referentiel opco" }
  } else {
    const balControl = await validationOrganisation(siret, email)
    return { isValid: balControl.is_valid, validator: "BAL" }
  }
}

const errorFactory = (message: string, errorCode?: BusinessErrorCodes): IBusinessError => ({ error: true, message, errorCode })

const getOpcoFromCfaDockByIdcc = async (siret: string): Promise<{ opco: string; idcc?: string } | undefined> => {
  const idccResult = await getIdcc(siret)
  if (!idccResult) return undefined
  const convention = idccResult.conventions?.at(0)
  if (convention) {
    const { num } = convention
    const opcoByIdccResult = await getOpcoByIdcc(num)
    if (opcoByIdccResult) {
      return { opco: opcoByIdccResult.opcoName, idcc: opcoByIdccResult.idcc?.toString() }
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

export const getOpcoData = async (siret: string): Promise<{ opco: string; idcc: string | null } | null> => {
  const siren = siret.substring(0, 9)
  const opcoFromDB = await getOpcoBySirenFromDB(siren)
  if (opcoFromDB) {
    return { opco: opcoFromDB.opco, idcc: opcoFromDB.idcc ?? null }
  }
  const entreprise = await getDbCollection("entreprises").findOne({ siret })
  if (entreprise) {
    const { opco, idcc = null } = entreprise
    if (opco) {
      return { opco, idcc }
    }
  }

  const result = await getOpcoDataRaw(siret)
  if (result) {
    const { opco, idcc } = result
    await saveOpco({ opco, idcc, siren })
    return { opco, idcc: idcc ?? null }
  }

  return null
}

export type EntrepriseData = IFormatAPIEntreprise & { geo_coordinates: string; geopoint: IGeoPoint }

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

export const getEntrepriseDataFromSiret = async ({
  siret,
  type,
  isApiApprentissage = false,
}: {
  siret: string
  type: "CFA" | "ENTREPRISE"
  isApiApprentissage?: boolean
}): Promise<EntrepriseData | IBusinessError> => {
  const result = await getEtablissementFromGouvSafe(siret)
  if (!result) {
    return errorFactory("Le numéro siret est invalide.")
  }
  if (result === BusinessErrorCodes.NON_DIFFUSIBLE) {
    if (isApiApprentissage) {
      return errorFactory("Non-distributable company.", BusinessErrorCodes.NON_DIFFUSIBLE)
    } else {
      return errorFactory(
        `Les informations de votre entreprise sont non diffusibles. <a href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Espace%20pro%20-%20Donnees%20entreprise%20non%20diffusibles" target="_blank" title="contacter le support - nouvelle fenêtre">Contacter le support pour en savoir plus</a>`,
        BusinessErrorCodes.NON_DIFFUSIBLE
      )
    }
  }

  const { etat_administratif, activite_principale } = result.data

  if (etat_administratif === "F") {
    if (isApiApprentissage) {
      return errorFactory("The company is considered closed.", BusinessErrorCodes.CLOSED)
    } else {
      return errorFactory("Cette entreprise est considérée comme fermée.", BusinessErrorCodes.CLOSED)
    }
  }
  // Check if a CFA already has the company as partenaire
  if (type === ENTREPRISE) {
    // Allow cfa to add themselves as a company
    if (activite_principale.code.startsWith("85")) {
      if (isApiApprentissage) {
        return errorFactory("The SIRET number is not referenced as a company.", BusinessErrorCodes.IS_CFA)
      } else {
        return errorFactory("Le numéro siret n'est pas référencé comme une entreprise.", BusinessErrorCodes.IS_CFA)
      }
    }
  }
  const entrepriseData = formatEntrepriseData(result.data)
  if (!entrepriseData.establishment_raison_sociale) {
    throw internal("pas de raison sociale trouvée", { siret, type, entrepriseData, apiData: result.data })
  }
  const numeroEtRue = entrepriseData.address_detail.acheminement_postal.l4
  const codePostalEtVille = entrepriseData.address_detail.acheminement_postal.l6
  const { latitude, longitude } = await getGeoCoordinates(`${numeroEtRue}, ${codePostalEtVille}`).catch(() => getGeoCoordinates(codePostalEtVille))
  return { ...entrepriseData, geo_coordinates: `${latitude},${longitude}`, geopoint: { type: "Point", coordinates: [longitude, latitude] as [number, number] } }
}

export const isCfaCreationValid = async (siret: string): Promise<boolean> => {
  const cfa = await getDbCollection("cfas").findOne({ siret })
  if (!cfa) return true
  const roles = await getDbCollection("rolemanagements").find({ authorized_type: AccessEntityType.CFA, authorized_id: cfa._id.toString() }).toArray()
  const managingAccess = [AccessStatus.GRANTED, AccessStatus.AWAITING_VALIDATION]
  const managingRoles = roles.filter((role) => {
    const roleStatus = getLastStatusEvent(role.status)?.status
    return roleStatus ? managingAccess.includes(roleStatus) : false
  })
  return managingRoles.length ? false : true
}

export const getCfaSiretInfos = async (siret: string) => {
  const cfa = await getDbCollection("cfas").findOne({ siret })
  if (cfa) {
    return cfa
  }
  const response = await validateEligibiliteCfa(siret)
  return response.cfa
}

export const validateEligibiliteCfa = async (siret: string, origin = "") => {
  const referentiel = await getEtablissementFromReferentiel(siret)
  if (!referentiel) {
    throw badRequest("Le numéro siret n'est pas référencé comme centre de formation.", { reason: BusinessErrorCodes.UNKNOWN })
  }
  if (referentiel.etat_administratif === "fermé") {
    throw badRequest("Le numéro siret indique un établissement fermé.", { reason: BusinessErrorCodes.CLOSED })
  }
  if (!referentiel.adresse) {
    throw badRequest("Pour des raisons techniques, les organismes de formation à distance ne sont pas acceptés actuellement.", {
      reason: BusinessErrorCodes.UNSUPPORTED,
    })
  }
  const formattedReferentiel = formatReferentielData(referentiel)
  if (!formattedReferentiel.is_qualiopi) {
    throw badRequest("L’organisme rattaché à ce SIRET n’est pas certifié Qualiopi", { reason: BusinessErrorCodes.NOT_QUALIOPI, ...formattedReferentiel })
  }
  const { address, address_detail, establishment_raison_sociale, geo_coordinates } = formattedReferentiel
  const cfa = await upsertCfa(
    siret,
    {
      address,
      address_detail,
      enseigne: null,
      geo_coordinates,
      raison_sociale: establishment_raison_sociale,
    },
    origin
  )
  return { referentiel: formattedReferentiel, cfa }
}

export const entrepriseOnboardingWorkflow = {
  create: async (
    {
      email,
      first_name,
      last_name,
      phone,
      siret,
      origin,
      opco,
      idcc,
    }: {
      siret: string
      last_name: string
      first_name: string
      phone?: string
      email: string
      origin?: string | null
      opco: string
      idcc?: string
    },
    {
      isUserValidated = false,
    }: {
      isUserValidated?: boolean
    } = {}
  ): Promise<IBusinessError | { formulaire: IRecruiter; user: IUserWithAccount; validated: boolean }> => {
    origin = origin ?? ""
    const cfaErrorOpt = await validateCreationEntrepriseFromCfa({ siret })
    if (cfaErrorOpt) return cfaErrorOpt
    const formulaireExist = await getFormulaire({ establishment_siret: siret, email })
    if (formulaireExist) {
      return errorFactory("Un compte est déjà associé à ce couple email/siret.", BusinessErrorCodes.ALREADY_EXISTS)
    }
    const formatedEmail = email.toLocaleLowerCase()
    // Faut-il rajouter un contrôle sur l'existance du couple email/siret dans la collection recruiters ?
    if (await emailHasActiveRole(formatedEmail)) {
      return errorFactory("L'adresse mail est déjà associée à un compte La bonne alternance.", BusinessErrorCodes.ALREADY_EXISTS)
    }
    let siretResponse: Awaited<ReturnType<typeof getEntrepriseDataFromSiret>>
    let isSiretInternalError = false
    try {
      siretResponse = await getEntrepriseDataFromSiret({ siret, type: ENTREPRISE })
      if ("error" in siretResponse) {
        return siretResponse
      }
    } catch (err: any) {
      isSiretInternalError = true
      siretResponse = {
        error: true,
        message: `erreur lors de l'appel de l'api entreprise : ${err?.message ?? err + ""}`,
      }
      sentryCaptureException(err)
    }
    const entreprise = await upsertEntrepriseData(siret, origin, siretResponse, isSiretInternalError)
    const opcoResult = await updateEntrepriseOpco(siret, { opco, idcc })
    opco = opcoResult.opco
    idcc = opcoResult.idcc ?? undefined

    let validated = false
    const managingUser = await createOrganizationUser({
      userFields: {
        first_name,
        last_name,
        phone: phone ?? "",
        origin,
        email: formatedEmail,
      },
      is_email_checked: false,
      organization: { type: ENTREPRISE, entreprise },
    })
    if (isUserValidated) {
      await modifyPermissionToUser(
        {
          user_id: managingUser._id,
          authorized_id: entreprise._id.toString(),
          authorized_type: AccessEntityType.ENTREPRISE,
          origin,
        },
        {
          validation_type: VALIDATION_UTILISATEUR.AUTO,
          status: AccessStatus.GRANTED,
          reason: "création par clef API",
        }
      )
      validated = true
    } else {
      const result = await autoValidateUserRoleOnCompany({ user: managingUser, organization: { type: ENTREPRISE, entreprise } }, origin)
      validated = result.validated
    }

    const formulaire = await createFormulaire(
      {
        ...entrepriseToRecruiter(entreprise),
        first_name,
        last_name,
        phone,
        opco,
        idcc,
        origin,
        email: formatedEmail,
        status: RECRUITER_STATUS.ACTIF,
        jobs: [],
        naf_label: "naf_label" in siretResponse ? siretResponse.naf_label : undefined,
        naf_code: "naf_code" in siretResponse ? siretResponse.naf_code : undefined,
      },
      managingUser._id.toString()
    )

    return { formulaire, user: managingUser, validated }
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
    managedBy,
  }: {
    siret: string
    last_name: string
    first_name: string
    phone: string
    email: string
    cfa_delegated_siret: string
    opco?: string
    idcc?: string | null
    managedBy: string
    origin: string
  }) => {
    const cfaErrorOpt = await validateCreationEntrepriseFromCfa({ siret, cfa_delegated_siret })
    if (cfaErrorOpt) return cfaErrorOpt
    const formatedEmail = email.toLocaleLowerCase()
    let siretResponse: Awaited<ReturnType<typeof getEntrepriseDataFromSiret>>
    let isSiretInternalError = false
    try {
      siretResponse = await getEntrepriseDataFromSiret({ siret, type: CFA })
      if ("error" in siretResponse) {
        return siretResponse
      }
    } catch (err: any) {
      isSiretInternalError = true
      siretResponse = {
        error: true,
        message: `erreur lors de l'appel de l'api entreprise : ${err?.message ?? err + ""}`,
      }
      sentryCaptureException(err)
    }
    const entreprise = await upsertEntrepriseData(siret, origin, siretResponse, isSiretInternalError)
    if (opco) {
      const opcoResult = await updateEntrepriseOpco(siret, { opco, idcc: idcc ?? undefined })
      opco = opcoResult.opco
      idcc = opcoResult.idcc
    }

    const formulaireInfo = await createFormulaire(
      {
        ...entrepriseToRecruiter(entreprise),
        first_name,
        last_name,
        phone,
        email: formatedEmail,
        status: "error" in siretResponse ? RECRUITER_STATUS.EN_ATTENTE_VALIDATION : RECRUITER_STATUS.ACTIF,
        jobs: [],
        cfa_delegated_siret,
        is_delegated: true,
        origin,
        opco,
        idcc,
        naf_label: "naf_label" in siretResponse ? siretResponse.naf_label : undefined,
        naf_code: "naf_code" in siretResponse ? siretResponse.naf_code : undefined,
      },
      managedBy
    )
    return formulaireInfo
  },
}

const entrepriseToRecruiter = (entreprise: IEntreprise): Partial<IRecruiter> => {
  const { siret, address, address_detail, enseigne, geo_coordinates, idcc, opco, raison_sociale } = entreprise
  const [latitude, longitude] = geo_coordinates!.split(",").map((coords) => parseFloat(coords))
  const formulaire: Partial<IRecruiter> = {
    establishment_siret: siret,
    establishment_raison_sociale: raison_sociale,
    establishment_enseigne: enseigne,
    opco,
    idcc,
    address,
    address_detail,
    geo_coordinates,
    geopoint: { type: "Point", coordinates: [longitude, latitude] as [number, number] },
  }
  return formulaire
}

export const sendUserConfirmationEmail = async (user: IUserWithAccount) => {
  const url = createValidationMagicLink(userWithAccountToUserForToken(user))
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

export const sendEmailConfirmationEntreprise = async (
  user: IUserWithAccount,
  recruteur: IRecruiter,
  accessStatus: AccessStatus | null,
  entrepriseStatus: EntrepriseStatus | null
) => {
  if (
    entrepriseStatus !== EntrepriseStatus.VALIDE ||
    isUserEmailChecked(user) ||
    !accessStatus ||
    ![AccessStatus.GRANTED, AccessStatus.AWAITING_VALIDATION].includes(accessStatus)
  ) {
    return
  }
  const isUserAwaiting = accessStatus === AccessStatus.AWAITING_VALIDATION
  const { jobs, is_delegated, email } = recruteur
  const offre = jobs.at(0)
  if (jobs.length === 1 && offre && is_delegated === false) {
    // Get user account validation link
    const url = createValidationMagicLink(userWithAccountToUserForToken(user))
    await mailer.sendEmail({
      to: email,
      subject: "Confirmez votre adresse mail",
      template: getStaticFilePath("./templates/mail-nouvelle-offre-depot-simplifie.mjml.ejs"),
      data: {
        images: {
          logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
          logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
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
          delegations: offre.delegations,
        },
        isUserAwaiting,
      },
    })
  } else {
    const user2 = await getDbCollection("userswithaccounts").findOne({ _id: user._id })
    if (!user2) {
      throw internal(`could not find user with id=${user._id}`)
    }
    await sendUserConfirmationEmail(user2)
  }
}

export const sendMailCfaPremiumStart = (etablissement: IEtablissement, type: "affelnet" | "parcoursup") => {
  if (!etablissement.gestionnaire_email) {
    throw badRequest("Gestionnaire email not found")
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
        email: etablissement.gestionnaire_email,
      },
      activationDate: dayjs().format("DD/MM/YYYY"),
    },
  })
}

export const isHardbounceEventFromEtablissement = async (payload) => {
  const messageId = payload["message-id"]

  const etablissement = await findOne({ to_CFA_invite_optout_last_message_id: messageId })
  if (etablissement) {
    return true
  }
  return false
}
