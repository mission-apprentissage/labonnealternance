import { captureException } from "@sentry/nextjs"
import Axios from "axios"
import { IJobWritable, INewDelegations, IRoutes, parseEnumOrError } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { OPCOS } from "shared/constants/recruteur"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { IUser2 } from "shared/models/user2.model"
import { IEntrepriseInformations } from "shared/routes/recruiters.routes"

import { publicConfig } from "../config.public"

import { ApiError, apiDelete, apiGet, apiPost, apiPut, removeUndefinedFields } from "./api.utils"

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
export const updateFormulaire = (establishment_id: string, values) => apiPut("/formulaire/:establishment_id", { params: { establishment_id }, body: values })

export const archiveFormulaire = (establishment_id: string) => apiDelete("/formulaire/:establishment_id", { params: { establishment_id } }).catch(errorHandler)
export const archiveDelegatedFormulaire = (siret: string) => API.delete(`/formulaire/delegated/${siret}`).catch(errorHandler)

/**
 * Offre API
 */
export const getOffre = (jobId: string) => apiGet("/formulaire/offre/f/:jobId", { params: { jobId } })
export const createOffre = (establishment_id: string, newOffre: IJobWritable) => apiPost("/formulaire/:establishment_id/offre", { params: { establishment_id }, body: newOffre })
export const createOffreByToken = (establishment_id: string, newOffre: IJobWritable, token: string) =>
  apiPost("/formulaire/:establishment_id/offre/by-token", { params: { establishment_id }, body: newOffre, headers: { authorization: `Bearer ${token}` } })
export const patchOffreDelegation = (jobId, data, config) => API.patch(`/formulaire/offre/${jobId}/delegation`, data, config).catch(errorHandler)
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
const updateUser = (userId: string, user) => apiPut("/user/:userId", { params: { userId }, body: user })
const updateUserAdmin = (userId: string, user) => apiPut("/admin/users/:userId", { params: { userId }, body: user })
export const getUserStatus = (userId: string) => apiGet("/user/status/:userId", { params: { userId } })
export const getUserStatusByToken = (userId: string, token: string) =>
  apiGet("/user/status/:userId/by-token", { params: { userId }, headers: { authorization: `Bearer ${token}` } })
export const updateUserValidationHistory = ({
  userId,
  organizationId,
  reason,
  status,
  organizationType,
}: {
  userId: string
  organizationId: string
  status: AccessStatus
  reason: string
  organizationType: typeof AccessEntityType.ENTREPRISE | typeof AccessEntityType.CFA
}) => apiPut("/user/:userId/organization/:organizationId/permission", { params: { userId, organizationId }, body: { organizationType, status, reason } }).catch(errorHandler)
export const deleteCfa = async (userId) => await API.delete(`/user`, { params: { userId } }).catch(errorHandler)
export const deleteEntreprise = (userId: string, recruiterId: string) => apiDelete(`/user`, { querystring: { userId, recruiterId } }).catch(errorHandler)
export const createAdminUser = (user: IUser2) => apiPost("/admin/users", { body: user })

// Temporaire, en attendant d'ajuster le modèle pour n'avoir qu'une seul source de données pour les entreprises
/**
 * KBA 20230511 : (migration db) : casting des valueurs coté collection recruiter, car les champs ne sont plus identiques avec la collection userRecruteur.
 */
export const updateEntreprise = async (userId: string, establishment_id: string | undefined, user: any) => {
  const promises: Promise<any>[] = [updateUser(userId, user)]
  if (establishment_id) {
    promises.push(updateFormulaire(establishment_id, user))
  }
  await Promise.all(promises)
}

export const updateEntrepriseAdmin = async (userId: string, establishment_id: string, user: any) =>
  await Promise.all([
    updateUserAdmin(userId, user),
    //
    updateFormulaire(establishment_id, user),
  ])

/**
 * Auth API
 */
export const sendMagiclink = async (email) => await API.post(`/login/magiclink`, email)
export const sendValidationLink = async (userId: string) => await apiPost("/login/:userId/resend-confirmation-email", { params: { userId } })

/**
 * Etablissement API
 */
export const getEntreprisesManagedByCfa = (cfaId: string) => apiGet("/etablissement/cfa/:cfaId/entreprises", { params: { cfaId } })
export const getCfaInformation = async (siret: string) => apiGet("/etablissement/cfa/:siret", { params: { siret } })

export const getEntrepriseInformation = async (
  siret: string,
  options: { cfa_delegated_siret?: string } = {}
): Promise<{ statusCode: 200; data: IEntrepriseInformations; error: false } | { statusCode: number; message: string; data?: { errorCode?: BusinessErrorCodes }; error: true }> => {
  try {
    const data = await apiGet("/etablissement/entreprise/:siret", { params: { siret }, querystring: removeUndefinedFields(options) }, { timeout: 7000 })
    return { statusCode: 200, data, error: false }
  } catch (error: unknown) {
    captureException(error)
    if (error instanceof ApiError && error.context?.statusCode >= 400) {
      const { errorData, statusCode, message } = error.context
      return { statusCode, message, data: errorData, error: true }
    } else {
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

export const createEtablissement = (etablissement) => apiPost("/etablissement/creation", { body: etablissement })

export const getRomeDetail = (rome: string) => API.get(`/rome/detail/${rome}`)
export const getRelatedEtablissementsFromRome = ({ rome, latitude, longitude }: { rome: string; latitude: number; longitude: number }) =>
  API.get(`/etablissement/cfas-proches?rome=${rome}&latitude=${latitude}&longitude=${longitude}`)

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

export const getOpcoUsers = (opco: string) => apiGet("/user/opco", { querystring: { opco: parseEnumOrError(OPCOS, opco) } })