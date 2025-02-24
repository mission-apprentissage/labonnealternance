import { badRequest, internal } from "@hapi/boom"
import { captureException } from "@sentry/node"
import { Filter as MongoDBFilter, ObjectId } from "mongodb"
import {
  IBusinessError,
  ICfaReferentielData,
  IEtablissement,
  IGeoPoint,
  ILbaCompany,
  ILbaCompanyLegacy,
  IRecruiter,
  ITrackingCookies,
  parseEnum,
  TrafficType,
  ZCfaReferentielData,
} from "shared"
import { CFA, ENTREPRISE, RECRUITER_STATUS } from "shared/constants"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { OPCOS_LABEL, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { IEtablissementGouvData } from "shared/models/cacheInfosSiret.model"
import { EntrepriseStatus, IEntreprise } from "shared/models/entreprise.model"
import { IOpco } from "shared/models/opco.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { IUserWithAccount } from "shared/models/userWithAccount.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { getEtablissementFromGouvSafe } from "@/common/apis/apiEntreprise/apiEntreprise.client"
import { FCGetOpcoInfos } from "@/common/apis/franceCompetences/franceCompetencesClient"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getHttpClient } from "@/common/utils/httpUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { userWithAccountToUserForToken } from "@/security/accessTokenService"
import { getUserWithAccountByEmail, isUserEmailChecked } from "@/services/userWithAccount.service"

import { isEmailFromPrivateCompany, isEmailSameDomain } from "../common/utils/mailUtils"
import { sentryCaptureException } from "../common/utils/sentryUtils"
import { removeHtmlTagsFromString } from "../common/utils/stringUtils"
import config from "../config"

import { createValidationMagicLink } from "./appLinks.service"
import { validationOrganisation } from "./bal.service"
import { getSiretInfos } from "./cacheInfosSiret.service"
import { getCatalogueEtablissements } from "./catalogue.service"
import { upsertCfa } from "./cfa.service"
import { fetchOpcosFromCFADock } from "./cfadock.service"
import dayjs from "./dayjs.service"
import { ICFADock, IFormatAPIEntreprise, IReferentiel, ISIRET2IDCC } from "./etablissement.service.types"
import { createFormulaire, getFormulaire } from "./formulaire.service"
import { addressDetailToString, convertGeometryToPoint, getGeoCoordinates } from "./geolocation.service"
import mailer from "./mailer.service"
import { getOpcoBySirenFromDB, getOpcosBySiretFromDB, insertOpcos, saveOpco } from "./opco.service"
import { updateEntrepriseOpco, upsertEntrepriseData, UserAndOrganization } from "./organization.service"
import { modifyPermissionToUser } from "./roleManagement.service"
import { saveUserTrafficSourceIfAny } from "./trafficSource.service"
import { autoValidateUser as authorizeUserOnEntreprise, createOrganizationUser, setUserHasToBeManuallyValidated } from "./userRecruteur.service"

const effectifMapping: Record<NonNullable<IEtablissementGouvData["data"]["unite_legale"]["tranche_effectif_salarie"]["code"]>, string | null> = {
  "00": "0 salarié",
  "01": "1 ou 2 salariés",
  "02": "3 à 5 salariés",
  "03": "6 à 9 salariés",
  "11": "10 à 19 salariés",
  "12": "20 à 49 salariés",
  "21": "50 à 99 salariés",
  "22": "100 à 199 salariés",
  "31": "200 à 249 salariés",
  "32": "250 à 499 salariés",
  "41": "500 à 999 salariés",
  "42": "1 000 à 1 999 salariés",
  "51": "2 000 à 4 999 salariés",
  "52": "5 000 à 9 999 salariés",
  "53": "10 000 salariés et plus",
  NN: null,
}

const getEffectif = (code: IEtablissementGouvData["data"]["unite_legale"]["tranche_effectif_salarie"]["code"]) => {
  return (code ? effectifMapping[code] : null) ?? "Non diffusé"
}

/**
 * @description Get opco details from CFADOCK API for a given SIRET
 * @param {String} siret
 * @returns {Promise<Object>}
 */
const getOpcoFromCfaDock = async (siret: string): Promise<{ opco: string; idcc: number | null } | undefined> => {
  try {
    const { data } = await getHttpClient({ timeout: 5000 }).get<ICFADock>(`https://www.cfadock.fr/api/opcos?siret=${encodeURIComponent(siret)}`)
    if (!data) {
      return undefined
    }
    const { searchStatus, opcoName, idcc } = data
    switch (searchStatus) {
      case "OK": {
        return { opco: opcoName, idcc }
      }
      case "MULTIPLE_OPCO": {
        return { opco: OPCOS_LABEL.MULTIPLE_OPCO, idcc: null }
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

/**
 * @description Get the establishment information from the ENTREPRISE API for a given SIRET
 * Throw an error if the data is private
 */
export const getEtablissementFromGouv = async (siret: string): Promise<IEtablissementGouvData | null> => {
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

type IGetAllEmailFromLbaCompanyLegacy = Pick<ILbaCompanyLegacy, "email">
export const getAllEstablishmentFromLbaCompanyLegacy = async (query: MongoDBFilter<ILbaCompanyLegacy>) =>
  (await getDbCollection("recruteurslbalegacies").find(query).project({ email: 1, _id: 0 }).toArray()) as IGetAllEmailFromLbaCompanyLegacy[]

type IGetAllEmailFromLbaCompany = Pick<ILbaCompany, "email">
export const getAllEstablishmentFromLbaCompany = async (query: MongoDBFilter<ILbaCompany>) =>
  (await getDbCollection("recruteurslba").find(query).project({ email: 1, _id: 0 }).toArray()) as IGetAllEmailFromLbaCompany[]

function getRaisonSocialeFromGouvResponse(d: IEtablissementGouvData["data"]): string | undefined {
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
export const formatEntrepriseData = (data: IEtablissementGouvData["data"]): IFormatAPIEntreprise => {
  if (!data.adresse) {
    throw new Error("erreur dans le format de l'api SIRENE : le champ adresse est vide")
  }
  return {
    establishment_enseigne: data.enseigne,
    establishment_state: data.etat_administratif, // F pour fermé ou A pour actif
    establishment_siret: data.siret,
    establishment_raison_sociale: getRaisonSocialeFromGouvResponse(data),
    address_detail: data.adresse,
    address: addressDetailToString(data.adresse),
    contacts: [], // conserve la coherence avec l'UI
    naf_code: data.activite_principale.code,
    naf_label: data.activite_principale.libelle,
    establishment_size: getEffectif(data.unite_legale.tranche_effectif_salarie.code),
    establishment_creation_date: data.unite_legale?.date_creation ? new Date(data.unite_legale.date_creation * 1000) : null,
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
  const geopoint = convertGeometryToPoint(geojson.geometry)

  const referentielData: ICfaReferentielData = {
    establishment_state: d.etat_administratif,
    is_qualiopi: Boolean(d.qualiopi),
    establishment_siret: d.siret,
    establishment_raison_sociale: d.raison_sociale,
    contacts: d.contacts,
    address_detail: d.adresse,
    address: d.adresse?.label,
    geo_coordinates: `${geopoint.coordinates[1]},${geopoint.coordinates[0]}`,
    geopoint,
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

const getOpcoFromCfaDockByIdcc = async (siret: string): Promise<{ opco: string; idcc: number | null } | undefined> => {
  const idccResult = await getIdcc(siret)
  if (!idccResult) return undefined
  const convention = idccResult.conventions?.at(0)
  if (convention) {
    const { num } = convention
    const opcoByIdccResult = await getOpcoByIdcc(num)
    if (opcoByIdccResult) {
      return { opco: opcoByIdccResult.opcoName, idcc: opcoByIdccResult.idcc }
    }
  }
}

const getOpcoFromFranceCompetences = async (siret: string): Promise<{ opco: string; idcc: null } | undefined> => {
  const opcoOpt = await FCGetOpcoInfos(siret)
  return opcoOpt ? { opco: opcoOpt, idcc: null } : undefined
}

const getOpcoDataRaw = async (siret: string): Promise<{ opco: string; idcc: number | null } | undefined> => {
  return (await getOpcoFromCfaDock(siret)) ?? (await getOpcoFromCfaDockByIdcc(siret)) ?? (await getOpcoFromFranceCompetences(siret))
}

export const getOpcoData = async (siret: string): Promise<{ opco: string; idcc: number | null } | null> => {
  const siren = siret.substring(0, 9)
  const opcoFromDB = await getOpcoBySirenFromDB(siren)
  if (opcoFromDB) {
    return { opco: opcoFromDB.opco, idcc: opcoFromDB.idcc }
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
    return { opco, idcc }
  }

  return null
}

export const getOpcosData = async (sirets: string[]): Promise<{ opco: OPCOS_LABEL; idcc: number | null; siret: string }[]> => {
  const opcoFromDB = await getOpcosBySiretFromDB(sirets)
  sirets = sirets.filter((requestedSiret) => !opcoFromDB.some(({ siret }) => siret === requestedSiret))
  const opcoFromEntreprises = await getOpcosDataFromEntreprises(sirets)
  sirets = sirets.filter((requestedSiret) => !opcoFromEntreprises.some(({ siret }) => siret === requestedSiret))
  const opcoFromCfaDock = await getOpcosDataFromCfaDock(sirets)
  sirets = sirets.filter((requestedSiret) => !opcoFromCfaDock.some(({ siret }) => siret === requestedSiret))
  const opcoFromFranceCompetences = await getOpcosDataFromFranceCompetence(sirets)
  const savedOpcoDatas: Omit<IOpco, "_id">[] = [...opcoFromCfaDock, ...opcoFromFranceCompetences].map(({ siret, opco, idcc }) => ({
    opco,
    idcc,
    siren: siret.substring(0, 9),
  }))
  await insertOpcos(savedOpcoDatas)
  return [...opcoFromDB, ...opcoFromEntreprises, ...opcoFromCfaDock, ...opcoFromFranceCompetences]
}

const getOpcosDataFromEntreprises = async (sirets: string[]): Promise<{ opco: OPCOS_LABEL; idcc: number | null; siret: string }[]> => {
  if (!sirets.length) {
    return []
  }
  const entreprises = await getDbCollection("entreprises")
    .find({ siret: { $in: sirets } })
    .toArray()
  return entreprises.flatMap(({ opco, idcc, siret }) => {
    if (!opco) {
      return []
    }
    return [{ siret, opco, idcc: idcc ?? null }]
  })
}

const getOpcosDataFromCfaDock = async (sirets: string[]): Promise<{ opco: OPCOS_LABEL; idcc: number | null; siret: string }[]> => {
  try {
    if (!sirets.length) {
      return []
    }
    const sirens = new Set<string>(sirets.map((siret) => siret.substring(0, 9)))
    const results = await fetchOpcosFromCFADock(sirens)
    return sirets.flatMap((siret) => {
      const siren = siret.substring(0, 9)
      const result = results.find((result) => result.filters.siret === siren)
      if (!result) {
        return []
      }
      const { opcoName, idcc } = result
      return [{ siret, opco: opcoName, idcc: idcc ?? null }]
    })
  } catch (err) {
    captureException(err)
    return []
  }
}

const getOpcosDataFromFranceCompetence = async (sirets: string[]): Promise<{ opco: OPCOS_LABEL; idcc: null; siret: string }[]> => {
  if (!sirets.length) {
    return []
  }
  const results = [] as { opco: OPCOS_LABEL; idcc: null; siret: string }[]
  await asyncForEach(sirets, async (siret) => {
    try {
      const result = await getOpcoFromFranceCompetences(siret)
      const opco = parseEnum(OPCOS_LABEL, result?.opco)
      if (opco) {
        results.push({ siret, opco, idcc: null })
      }
    } catch (err) {
      captureException(err)
    }
  })
  return results
}

export type EntrepriseData = IFormatAPIEntreprise & { geo_coordinates: string; geopoint: IGeoPoint }

export const validateCreationEntrepriseFromCfa = async ({ siret, cfa_delegated_siret, nafCode }: { siret: string; cfa_delegated_siret?: string; nafCode?: string }) => {
  if (!cfa_delegated_siret) return
  if (nafCode?.startsWith("85")) {
    return errorFactory("L'entreprise partenaire ne doit pas relever du secteur de l'enseignement.", BusinessErrorCodes.IS_CFA)
  }
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
  const result = await getSiretInfos(siret)
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
    if (activite_principale?.code?.startsWith("85")) {
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
      source,
    }: {
      siret: string
      last_name: string
      first_name: string
      phone?: string
      email: string
      origin?: string | null
      opco: OPCOS_LABEL
      idcc?: string
      source: ITrackingCookies
    },
    {
      isUserValidated = false,
    }: {
      isUserValidated?: boolean
    } = {}
  ): Promise<IBusinessError | { formulaire: IRecruiter; user: IUserWithAccount; validated: boolean }> => {
    origin = origin ?? ""
    const formulaireExist = await getFormulaire({ establishment_siret: siret, email })
    if (formulaireExist) {
      return errorFactory("Un compte est déjà associé à ce couple email/siret.", BusinessErrorCodes.ALREADY_EXISTS)
    }
    const formatedEmail = email.toLocaleLowerCase()
    // Faut-il rajouter un contrôle sur l'existance du couple email/siret dans la collection recruiters ?
    if (await getUserWithAccountByEmail(formatedEmail)) {
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
    const opcoResult = await updateEntrepriseOpco(siret, { opco, idcc: parseInt(idcc ?? "") || null })

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
    await saveUserTrafficSourceIfAny({ user_id: managingUser._id, type: TrafficType.ENTREPRISE, source })

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
        opco: opcoResult.opco || OPCOS_LABEL.UNKNOWN_OPCO,
        idcc: opcoResult.idcc,
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
    managedBy,
  }: {
    siret: string
    last_name: string
    first_name: string
    phone: string
    email: string
    cfa_delegated_siret: string
    managedBy: string
    origin: string
  }) => {
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
    const cfaErrorOpt = await validateCreationEntrepriseFromCfa({ siret, cfa_delegated_siret, nafCode: entreprise.naf_code ?? undefined })
    if (cfaErrorOpt) return cfaErrorOpt

    const opcoResult = await getOpcoData(siret)
    const opco = opcoResult?.opco

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
        opco: (opco && parseEnum(OPCOS_LABEL, opco)) || OPCOS_LABEL.UNKNOWN_OPCO,
        idcc: opcoResult?.idcc ?? null,
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
      last_name: removeHtmlTagsFromString(user.last_name),
      first_name: removeHtmlTagsFromString(user.first_name),
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
        nom: removeHtmlTagsFromString(user.last_name),
        prenom: removeHtmlTagsFromString(user.first_name),
        email: removeHtmlTagsFromString(user.email),
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
        logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.webp?raw=true`,
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

  const etablissement = await getDbCollection("etablissements").findOne({ to_CFA_invite_optout_last_message_id: messageId })
  if (etablissement) {
    return true
  }
  return false
}

export const doTasksWhenEntrepriseIsReadyToPublish = async () => {}
