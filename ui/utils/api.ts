import { captureException } from "@sentry/nextjs"
import Axios from "axios"

import { publicConfig } from "../config.public"

import { apiPut } from "./api.utils"

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
export const extendOffre = (jobId) => API.put(`/formulaire/offre/${jobId}/extend`)
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

export const getEntrepriseInformation = async (siret, options: { cfa_delegated_siret: string | undefined } = { cfa_delegated_siret: undefined }) => {
  try {
    const { data } = await API.get(`/etablissement/entreprise/${siret}`, { params: options })
    return data
  } catch (error: any) {
    const payload: { data: object | undefined; error: string; statusCode: number; message: string } = error.response.data

    return payload
  }
}
export const getEntrepriseOpco = async (siret) => {
  try {
    const { data } = await API.get(`/etablissement/entreprise/${siret}/opco`)
    return data
  } catch (error) {
    const payload: { data: object | undefined; error: string; statusCode: number; message: string } = error.response.data
    captureException(error)
    console.log(payload)
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
