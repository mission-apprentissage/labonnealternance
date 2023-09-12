import Axios from "axios"

const API = Axios.create({
  baseURL: `${process.env.REACT_APP_BASE_URL}/api`,
})

const securedAPI = Axios.create({
  baseURL: `${process.env.REACT_APP_BASE_URL}/api`,
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem("lba:token")}`,
  },
})

const errorHandler = (error) => {
  if (error.response && error.response.data) {
    console.error("Erreur de l'API :", error)
  }
}

/**
 * La bonne alternance API (domaine/métier)
 */
export const getMetier = (search) => Axios.get(`https://labonnealternance.apprentissage.beta.gouv.fr/api/romelabels?title=${search}`)

/**
 * Formulaire API
 */
export const getFormulaires = (query, options, limit, page) => securedAPI.get("/formulaire", { params: { query, options, limit, page } }).catch(errorHandler)
export const getFormulaire = (establishment_id) => API.get(`/formulaire/${establishment_id}`).catch(errorHandler)
export const postFormulaire = (form) => API.post(`/formulaire`, form).catch(errorHandler)
export const putFormulaire = (establishment_id, form) => API.put(`/formulaire/${establishment_id}`, form)
export const archiveFormulaire = (establishment_id) => API.delete(`/formulaire/${establishment_id}`).catch(errorHandler)
export const archiveDelegatedFormulaire = (siret) => API.delete(`/formulaire/delegated/${siret}`).catch(errorHandler)

/**
 * Offre API
 */
export const getOffre = (jobId) => API.get(`/formulaire/offre/f/${jobId}`)
export const postOffre = (establishment_id, offre) => API.post(`/formulaire/${establishment_id}/offre`, offre).catch(errorHandler)
export const putOffre = (jobId, offre) => API.put(`/formulaire/offre/${jobId}`, { ...offre, date_mise_a_jour: Date() }).catch(errorHandler)
export const patchOffre = (jobId, data, config) => API.patch(`/formulaire/offre/${jobId}`, data, config).catch(errorHandler)
export const cancelOffre = (jobId) => API.put(`/formulaire/offre/${jobId}/cancel`)
export const fillOffre = (jobId) => API.put(`/formulaire/offre/${jobId}/provided`)
export const createEtablissementDelegation = ({ data, jobId }) => API.post(`/formulaire/offre/${jobId}/delegation`, data)

/**
 * User API
 */

/**
 * KBA 13/10/2022 : to be reuse when fontend can deal with pagination
 * Quick fix made today
 */
export const getUsers = async (query) => securedAPI.get("/user", { params: query })
// export const getUsers = (query, options, limit, page) =>
//   API.get('/user', { params: { query, options, limit, page } }).catch(errorHandler)

export const getUser = async (userId) => await API.get(`/user/${userId}`)
export const createUser = async (user) => await API.post("/user", user).catch(errorHandler)
export const updateUser = async (userId, user) => await API.put(`user/${userId}`, user)
export const updateUserValidationHistory = async (userId, state) => await API.put(`user/${userId}/history`, state).catch(errorHandler)
export const deleteCfa = async (userId) => await API.delete(`/user`, { params: { userId } }).catch(errorHandler)
export const deleteEntreprise = async (userId, recruiterId) => await API.delete(`/user`, { params: { userId, recruiterId } }).catch(errorHandler)

// Temporaire, en attendant d'ajuster le modèle pour n'avoir qu'une seul source de données pour les entreprises
/**
 * KBA 20230511 : (migration db) : casting des valueurs coté collection recruiter, car les champs ne sont plus identiques avec la collection userRecruteur.
 */
export const updateEntreprise = async (userId, establishment_id, values) => await Promise.all([updateUser(userId, values), putFormulaire(establishment_id, values)])

/**
 * Auth API
 */
export const validateToken = async (token) => await API.post(`/login/verification`, token)
export const sendMagiclink = async (email) => await API.post(`/login/magiclink`, email)
export const sendValidationLink = async (email) => await API.post(`/login/confirmation-email`, email)
export const validationCompte = (id) => API.post("/etablissement/validation", id)

/**
 * Etablissement API
 */
export const getCfaInformation = async (siret) => await API.get(`/etablissement/cfa/${siret}`)
export const getEntrepriseInformation = async (siret, options) => {
  try {
    const { data } = await API.get(`/etablissement/entreprise/${siret}`, { params: options })
    return data
  } catch (error) {
    const status = error?.response?.status
    if (status && status < 500) {
      return error?.response?.data
    } else {
      return { error: true, errorType: "server", data: error?.response?.data }
    }
  }
}
export const getEntrepriseOpco = async (siret) => {
  try {
    const { data } = await API.get(`/etablissement/entreprise/${siret}/opco`)
    return data
  } catch (error) {
    return null
  }
}

export const createPartenaire = (partenaire) => API.post("/etablissement/creation", partenaire)
export const updatePartenaire = (id, partenaire) => securedAPI.put(`/etablissement/${id}`, partenaire)
export const getRomeDetail = (rome) => API.get(`/rome/detail/${rome}`)
export const getRelatedEtablissementsFromRome = ({ rome, latitude, longitude }) => API.get(`/etablissement/cfa/rome?rome[]=${rome}&latitude=${latitude}&longitude=${longitude}`)
export const validateOptOutToken = (token) =>
  API.get(`/optout/validate`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

export const etablissementUnsubscribeDemandeDelegation = (establishmentSiret) => API.post(`/etablissement/${establishmentSiret}/proposition/unsubscribe`)

/**
 * Administration OPCO
 */

export const getOpcoUsers = async (query) => API.get(`/user/opco`, { params: query })
