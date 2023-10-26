import { captureException } from "@sentry/nextjs"
import Axios from "axios"

import { publicConfig } from "../config.public"

import { apiGet, apiPut } from "./api.utils"

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

export const getFormulaire = (establishment_id) => API.get(`/formulaire/${establishment_id}`).catch(errorHandler)
export const postFormulaire = (form) => API.post(`/formulaire`, form)

export const archiveFormulaire = (establishment_id) => API.delete(`/formulaire/${establishment_id}`).catch(errorHandler)
export const archiveDelegatedFormulaire = (siret) => API.delete(`/formulaire/delegated/${siret}`).catch(errorHandler)

/**
 * Offre API
 */
export const getOffre = (jobId) => API.get(`/formulaire/offre/f/${jobId}`)

export const patchOffre = (jobId, data, config) => API.patch(`/formulaire/offre/${jobId}`, data, config).catch(errorHandler)
export const cancelOffre = (jobId) => API.put(`/formulaire/offre/${jobId}/cancel`)
export const cancelOffreFromAdmin = (jobId, data) => API.put(`/formulaire/offre/f/${jobId}/cancel`, data)
export const extendOffre = (jobId) => apiPut(`/formulaire/offre/:jobId/extend`, { params: { jobId } })
export const fillOffre = (jobId) => API.put(`/formulaire/offre/${jobId}/provided`)
export const createEtablissementDelegation = ({ data, jobId }) => API.post(`/formulaire/offre/${jobId}/delegation`, data)

/**
 * User API
 */
export const updateUserValidationHistory = async (userId, state) => await API.put(`user/${userId}/history`, state).catch(errorHandler)
export const deleteCfa = async (userId) => await API.delete(`/user`, { params: { userId } }).catch(errorHandler)
export const deleteEntreprise = async (userId, recruiterId) => await API.delete(`/user`, { params: { userId, recruiterId } }).catch(errorHandler)

// Temporaire, en attendant d'ajuster le modèle pour n'avoir qu'une seul source de données pour les entreprises
/**
 * KBA 20230511 : (migration db) : casting des valueurs coté collection recruiter, car les champs ne sont plus identiques avec la collection userRecruteur.
 */
export const updateEntreprise = async (userId: string, establishment_id, user) =>
  await Promise.all([
    apiPut(`/user/:userId`, { params: { userId }, body: user }),
    //
    apiPut(`/formulaire/:establishment_id`, { params: { establishment_id }, body: user }),
  ])

/**
 * Auth API
 */
export const sendMagiclink = async (email) => await API.post(`/login/magiclink`, email)
export const sendValidationLink = async (email) => await API.post(`/login/confirmation-email`, email)

/**
 * Etablissement API
 */
export const getCfaInformation = async (siret) => await API.get(`/etablissement/cfa/${siret}`)

export const getEntrepriseInformation = async (siret: string, options: { cfa_delegated_siret: string | undefined } = { cfa_delegated_siret: undefined }) => {
  try {
    const data = await apiGet("/etablissement/entreprise/:siret", { params: { siret }, querystring: options, timeout: 7000 })
    return data
  } catch (error: any) {
    captureException(error)
    if (error && typeof error === "object" && "response" in error) {
      const payload: { data?: { isCfa?: boolean }; error: boolean; statusCode: number; message: string } = error.response.data
      return payload
    } else {
      return { statusCode: 500, message: "unkown error", error: true }
    }
  }
}
export const getEntrepriseOpco = async (siret: string) => {
  try {
    const data = await apiGet("/etablissement/entreprise/:siret/opco", { params: { siret }, timeout: 7000 })
    return data
  } catch (error) {
    captureException(error)
    return null
  }
}

export const createEtablissement = (etablissement) => API.post("/etablissement/creation", etablissement)

export const getRomeDetail = (rome: string) => API.get(`/rome/detail/${rome}`)
export const getRelatedEtablissementsFromRome = ({ rome, latitude, longitude }: { rome: string; latitude: number; longitude: number }) =>
  API.get(`/etablissement/cfas-proches?rome=${rome}&latitude=${latitude}&longitude=${longitude}`)

export const etablissementUnsubscribeDemandeDelegation = (establishmentSiret) => API.post(`/etablissement/${establishmentSiret}/proposition/unsubscribe`)

/**
 * Administration OPCO
 */

export const getOpcoUsers = (opco) => API.get("/user/opco", { params: { opco } })
