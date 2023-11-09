import { captureException } from "@sentry/nextjs"
import Axios from "axios"
import { IJobWritable, INewDelegations, IRoutes } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
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

export const getFormulaire = (establishment_id: string) => apiGet("/formulaire/:establishment_id", { params: { establishment_id } }).catch(errorHandler)
export const postFormulaire = (userId: string, form) => apiPost("/user/:userId/formulaire", { params: { userId }, body: form })
export const updateFormulaire = (establishment_id: string, values) => apiPut("/formulaire/:establishment_id", { params: { establishment_id }, body: values })

export const archiveFormulaire = (establishment_id: string) => apiDelete("/formulaire/:establishment_id", { params: { establishment_id } }).catch(errorHandler)
export const archiveDelegatedFormulaire = (siret) => API.delete(`/formulaire/delegated/${siret}`).catch(errorHandler)

/**
 * Offre API
 */
export const getOffre = (jobId) => API.get(`/formulaire/offre/f/${jobId}`)
export const createOffre = (establishment_id: string, newOffre: IJobWritable) => apiPost("/formulaire/:establishment_id/offre", { params: { establishment_id }, body: newOffre })
export const patchOffre = (jobId, data, config) => API.patch(`/formulaire/offre/${jobId}`, data, config).catch(errorHandler)
export const cancelOffre = (jobId) => API.put(`/formulaire/offre/${jobId}/cancel`)
export const cancelOffreFromAdmin = (jobId: string, data: IRoutes["put"]["/formulaire/offre/f/:jobId/cancel"]["body"]["_input"]) =>
  apiPut("/formulaire/offre/f/:jobId/cancel", { params: { jobId }, body: data })
export const extendOffre = (jobId: string) => apiPut(`/formulaire/offre/:jobId/extend`, { params: { jobId } })
export const fillOffre = (jobId) => API.put(`/formulaire/offre/${jobId}/provided`)
export const createEtablissementDelegation = ({ data, jobId }: { jobId: string; data: INewDelegations }) =>
  apiPost(`/formulaire/offre/:jobId/delegation`, { params: { jobId }, body: data })

/**
 * User API
 */
export const getUserStatus = (userId: string) => apiGet("/user/status/:userId", { params: { userId } })
export const updateUserValidationHistory = async (userId, state) => await API.put(`user/${userId}/history`, state).catch(errorHandler)
export const deleteCfa = async (userId) => await API.delete(`/user`, { params: { userId } }).catch(errorHandler)
export const deleteEntreprise = (userId: string, recruiterId: string) => apiDelete(`/user`, { querystring: { userId, recruiterId } }).catch(errorHandler)

// Temporaire, en attendant d'ajuster le modèle pour n'avoir qu'une seul source de données pour les entreprises
/**
 * KBA 20230511 : (migration db) : casting des valueurs coté collection recruiter, car les champs ne sont plus identiques avec la collection userRecruteur.
 */
export const updateEntreprise = async (userId: string, establishment_id, user) =>
  await Promise.all([
    apiPut(`/user/:userId`, { params: { userId }, body: user }),
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
export const getEntreprisesManagedByCfa = (userId: string) => apiGet("/etablissement/cfa/:userRecruteurId/entreprises", { params: { userRecruteurId: userId } })
export const getCfaInformation = async (siret) => await API.get(`/etablissement/cfa/${siret}`)

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

export const etablissementUnsubscribeDemandeDelegation = (establishmentSiret) => API.post(`/etablissement/${establishmentSiret}/proposition/unsubscribe`)

/**
 * Administration OPCO
 */

export const getOpcoUsers = (opco) => API.get("/user/opco", { params: { opco } })
