import { captureException } from "@sentry/nextjs"
import Axios from "axios"
import { IJobCreate, INewDelegations, INewSuperUser, IRecruiterJson, IRoutes, IUserWithAccountFields, removeUndefinedFields } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { IEntrepriseJson } from "shared/models/entreprise.model"
import { IAppointmentRequestContextCreateFormAvailableResponseSchema, IAppointmentRequestContextCreateFormUnavailableResponseSchema } from "shared/routes/appointments.routes"

import { publicConfig } from "@/config.public"

import { ApiError, apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api.utils"

const API = Axios.create({
  baseURL: publicConfig.apiEndpoint,
})

const errorHandler = (error: any): undefined => {
  if (error) {
    console.error("Erreur de l'API :", error)
  }
}

/**
 * Formulaire API
 */

export const getDelegationDetails = (establishment_id: string, token: string) =>
  apiGet("/formulaire/delegation/:establishment_id", { params: { establishment_id }, headers: { authorization: `Bearer ${token}` } }).catch(errorHandler)
export const getFormulaire = (establishment_id: string) => apiGet("/formulaire/:establishment_id", { params: { establishment_id } }).catch(errorHandler)
export const getFormulaireByToken = (establishment_id: string, token: string) =>
  apiGet("/formulaire/:establishment_id/by-token", { params: { establishment_id }, headers: { authorization: `Bearer ${token}` } }).catch(errorHandler)
export const postFormulaire = (userId: string, form) => apiPost("/user/:userId/formulaire", { params: { userId }, body: form })

export const archiveFormulaire = (establishment_id: string) => apiDelete("/formulaire/:establishment_id", { params: { establishment_id } }).catch(errorHandler)

/**
 * Offre API
 */
export const getOffre = (jobId: string) => apiGet("/formulaire/offre/f/:jobId", { params: { jobId } })
export const createOffre = (establishment_id: string, newOffre: IJobCreate) => apiPost("/formulaire/:establishment_id/offre", { params: { establishment_id }, body: newOffre })
export const createOffreByToken = (establishment_id: string, newOffre: IJobCreate, token: string) =>
  apiPost("/formulaire/:establishment_id/offre/by-token", { params: { establishment_id }, body: newOffre, headers: { authorization: `Bearer ${token}` } })
export const patchOffreDelegation = (jobId: string, siret: string) =>
  apiPatch(`/formulaire/offre/:jobId/delegation`, { params: { jobId }, querystring: { siret_formateur: siret } }).catch(errorHandler)
export const cancelOffre = (jobId, token) => apiPut(`/formulaire/offre/:jobId/cancel`, { params: { jobId }, headers: { authorization: `Bearer ${token}` } })
export const cancelOffreFromAdmin = (jobId: string, data: IRoutes["put"]["/formulaire/offre/f/:jobId/cancel"]["body"]["_input"]) =>
  apiPut("/formulaire/offre/f/:jobId/cancel", { params: { jobId }, body: data })
export const extendOffre = (jobId: string) => apiPut(`/formulaire/offre/:jobId/extend`, { params: { jobId } })
export const fillOffre = (jobId, token) => apiPut(`/formulaire/offre/:jobId/provided`, { params: { jobId }, headers: { authorization: `Bearer ${token}` } })
export const createEtablissementDelegation = ({ data, jobId }: { jobId: string; data: INewDelegations }) =>
  apiPost(`/formulaire/offre/:jobId/delegation`, { params: { jobId }, body: data })
export const createEtablissementDelegationByToken = ({ data, jobId, token }: { jobId: string; data: INewDelegations; token: string }) =>
  apiPost(`/formulaire/offre/:jobId/delegation/by-token`, { params: { jobId }, body: data, headers: { authorization: `Bearer ${token}` } })

/**
 * User API
 */
export const getUser = (userId: string, organizationId: string = "unused") => apiGet("/user/:userId/organization/:organizationId", { params: { userId, organizationId } })
export const getUserStatus = (userId: string) => apiGet("/user/status/:userId", { params: { userId } })
export const getUserStatusByToken = (userId: string, token: string) =>
  apiGet("/user/status/:userId/by-token", { params: { userId }, headers: { authorization: `Bearer ${token}` } })

export const activateUserRole = (userId: string, organizationId: string) =>
  apiPost("/user/:userId/organization/:organizationId/activate", { params: { userId, organizationId } }).catch(errorHandler)

export const deactivateUserRole = (userId: string, organizationId: string, reason: string) =>
  apiPost("/user/:userId/organization/:organizationId/deactivate", { params: { userId, organizationId }, body: { reason } }).catch(errorHandler)

export const notifyNotMyOpcoUserRole = (userId: string, organizationId: string, reason: string) =>
  apiPost("/user/:userId/organization/:organizationId/not-my-opco", { params: { userId, organizationId }, body: { reason } }).catch(errorHandler)

export const createSuperUser = (user: INewSuperUser) => apiPost("/admin/users", { body: user })

// Temporaire, en attendant d'ajuster le modèle pour n'avoir qu'une seul source de données pour les entreprises
/**
 * KBA 20230511 : (migration db) : casting des valueurs coté collection recruiter, car les champs ne sont plus identiques avec la collection userRecruteur.
 */
export const updateUserWithAccountFields = async (userId: string, user: IUserWithAccountFields) => {
  await apiPut("/user/:userId", { params: { userId }, body: user })
}

export const updateEntrepriseAdmin = async (userId: string, user: any, siret = "unused") => {
  await apiPut("/admin/users/:userId/organization/:siret", { params: { userId, siret }, body: user })
}

export const updateUser = async (userId: string, user: any) => {
  await apiPut("/admin/users/:userId", { params: { userId }, body: user })
}

/**
 * Auth API
 */
export const sendMagiclink = async (email) => await API.post(`/login/magiclink`, email)
export const sendValidationLink = async (userId: string, token: string) =>
  await apiPost("/login/:userId/resend-confirmation-email", { params: { userId }, headers: { authorization: `Bearer ${token}` } })

/**
 * Etablissement API
 */
export const getEntreprisesManagedByCfa = (cfaId: string): Promise<IRecruiterJson[]> => apiGet("/etablissement/cfa/:cfaId/entreprises", { params: { cfaId } })
export const getCfaInformation = async (siret: string) => {
  try {
    const data = await apiGet("/etablissement/cfa/:siret", { params: { siret } })
    return { statusCode: 200, data, error: false }
  } catch (error) {
    if (error instanceof ApiError && error.context?.statusCode >= 400) {
      const { errorData, statusCode, message } = error.context
      if (error.context.statusCode >= 500) {
        captureException(error)
      }
      return { statusCode, message, data: errorData, error: true }
    } else {
      captureException(error)
      return { statusCode: 500, message: "unkown error", error: true }
    }
  }
}
export const validateCfaCreation = async (siret: string) => apiGet("/etablissement/cfa/:siret/validate-creation", { params: { siret } })

export const getEntrepriseInformation = async (
  siret: string,
  { cfa_delegated_siret, skipUpdate }: { cfa_delegated_siret?: string; skipUpdate?: boolean } = {}
): Promise<{ statusCode: 200; data: IEntrepriseJson; error: false } | { statusCode: number; message: string; data?: { errorCode?: BusinessErrorCodes }; error: true }> => {
  try {
    const data = await apiGet(
      "/etablissement/entreprise/:siret",
      { params: { siret }, querystring: removeUndefinedFields({ cfa_delegated_siret, skipUpdate: skipUpdate ? "true" : "false" }) },
      { timeout: 7000 }
    )
    return { statusCode: 200, data, error: false }
  } catch (error: unknown) {
    if (error instanceof ApiError && error.context?.statusCode >= 400) {
      const { errorData, statusCode, message } = error.context
      if (error.context.statusCode >= 500) {
        captureException(error)
      }
      return { statusCode, message, data: errorData, error: true }
    } else {
      captureException(error)
      return { statusCode: 500, message: "unkown error", error: true }
    }
  }
}
export const getEntrepriseOpco = async (siret: string) => {
  try {
    const data = await apiGet("/etablissement/entreprise/:siret/opco", { params: { siret } }, { timeout: 7000 })
    return data
  } catch (error) {
    captureException(error)
    return null
  }
}

export const getPrdvContext = async (
  idCleMinistereEducatif: string,
  referrer: string = "lba"
): Promise<IAppointmentRequestContextCreateFormAvailableResponseSchema | IAppointmentRequestContextCreateFormUnavailableResponseSchema | null> => {
  try {
    const data = await apiGet("/appointment", { querystring: { idCleMinistereEducatif, referrer } }, { timeout: 7000 })
    return data
  } catch (error) {
    if (error?.message !== BusinessErrorCodes.TRAINING_NOT_FOUND) {
      captureException(error)
    }
    return { error: error.message }
  }
}

export const getCompanyContactInfo = async (siret: string) => {
  const data = await apiGet("/lbacompany/:siret/contactInfo", { params: { siret } })
  return data
}

export const putCompanyContactInfo = async ({ siret, phone, email }: { siret: string; phone: string; email: string }) => {
  const data = await apiPut("/lbacompany/:siret/contactInfo", { params: { siret }, body: { phone, email } })
  return data
}

export const getApplicationCompanyEmailAddress = async (token: string) => {
  const data = await apiGet("/application/company/email", { querystring: { token } })
  return data
}

export const getApplicationDataForIntention = async (applicationId: string, token: string) => {
  const data = await apiGet("/application/dataForIntention/:id", {
    params: { id: applicationId },
    headers: {
      authorization: `Bearer ${token}`,
    },
  })
  return data
}

export const createEtablissement = (etablissement) => apiPost("/etablissement/creation", { body: etablissement })

export const getRomeDetail = (rome: string) => apiGet("/rome/detail/:rome", { params: { rome } })
export const getRelatedEtablissementsFromRome = async ({ rome, latitude, longitude, limit }: { rome: string; latitude: number; longitude: number; limit: number }) =>
  apiGet(`/etablissement/cfas-proches`, { querystring: { rome, latitude, longitude, limit } })

export const etablissementUnsubscribeDemandeDelegation = (establishment_siret: any, token: string) =>
  apiPost("/etablissement/:establishment_siret/proposition/unsubscribe", {
    params: { establishment_siret },
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

/**
 * Administration OPCO
 */

export const getOpcoUsers = () => apiGet("/user/opco", {})

export const reportLbaItem = (itemId: string, type: LBA_ITEM_TYPE) => apiPost("/report-company", { querystring: { type, itemId } })
