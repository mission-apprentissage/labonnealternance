import Axios from "axios"

const API = Axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
})

const errorHandler = (error) => {
  if (error.response && error.response.data) {
    console.log("Erreur de l'API :", error)
  }
}

/**
 * La bonne alternance API (domaine/métier)
 */
export const getMetier = (search) => Axios.get(`https://labonnealternance.apprentissage.beta.gouv.fr/api/romelabels?title=${search}`)

/**
 * Formulaire API
 */
export const getFormulaires = (query, options, limit, page) => API.get("/formulaire", { params: { query, options, limit, page } }).catch(errorHandler)
export const getFormulaire = (formId) => API.get(`/formulaire/${formId}`).catch(errorHandler)
export const postFormulaire = (form) => API.post(`/formulaire`, form).catch(errorHandler)
export const putFormulaire = (formId, form) => API.put(`/formulaire/${formId}`, form)
export const archiveFormulaire = (formId) => API.delete(`/formulaire/${formId}`).catch(errorHandler)

/**
 * Offre API
 */
export const getOffre = (idOffre) => API.get(`/formulaire/offre/f/${idOffre}`)
export const postOffre = (formId, offre) => API.post(`/formulaire/${formId}/offre`, offre).catch(errorHandler)
export const putOffre = (offreId, offre) => API.put(`/formulaire/offre/${offreId}`, { ...offre, date_mise_a_jour: Date() }).catch(errorHandler)
export const cancelOffre = (offreId) => API.put(`/formulaire/offre/${offreId}/cancel`)
export const fillOffre = (offreId) => API.put(`/formulaire/offre/${offreId}/provided`)
export const createEtablissementDelegation = ({ data, offreId }) => API.post(`/formulaire/offre/${offreId}/delegation`, data)

/**
 * User API
 */

/**
 * KBA 13/10/2022 : to be reuse when fontend can deal with pagination
 * Quick fix made today
 */
export const getUsers = async (query) => API.get("/user", { params: query })
// export const getUsers = (query, options, limit, page) =>
//   API.get('/user', { params: { query, options, limit, page } }).catch(errorHandler)

export const getUser = async (userId) => await API.get(`/user/${userId}`).catch(errorHandler)
export const createUser = async (user) => await API.post("/user", user).catch(errorHandler)
export const updateUser = async (userId, user) => await API.put(`user/${userId}`, user)
export const updateUserValidationHistory = async (userId, state) => await API.put(`user/${userId}/history`, state).catch(errorHandler)
export const deleteCfa = async (userId) => await API.delete(`/user`, { params: { userId } }).catch(errorHandler)
export const deleteEntreprise = async (userId, formId) => await API.delete(`/user`, { params: { userId, formId } }).catch(errorHandler)

// Temporaire, en attendant d'ajuster le modèle pour n'avoir qu'une seul source de données pour les entreprises
export const updateEntreprise = async (userId, formId, values) => await Promise.all([updateUser(userId, values), putFormulaire(formId, values)])

/**
 * Auth API
 */
export const validateToken = async (token) => await API.post(`/login/verification`, token)
export const sendMagiclink = async (email) => await API.post(`/login/magiclink`, email)
export const sendValidationLink = async (email) => await API.post(`/login/confirmation-email`, email)
export const validationCompte = (id) => API.post("/etablissementsRecruteur/validation", id)

/**
 * Etablissement API
 */
export const getCfaInformation = async (siret) => await API.get(`/etablissementsRecruteur/cfa/${siret}`)
export const getEntrepriseInformation = async (siret, options) => await API.get(`/etablissementsRecruteur/entreprise/${siret}`, { params: options })
export const getPartenaire = (siret) => API.get(`etablissementsRecruteur/${siret}`)
export const createPartenaire = (partenaire) => API.post("/etablissementsRecruteur/creation", partenaire)
export const updatePartenaire = (id, partenaire) => API.put(`/etablissementsRecruteur/${id}`, partenaire)
export const getRomeDetail = (rome) => API.get(`/rome/detail/${rome}`)
export const getRelatedEtablissementsFromRome = ({ rome, latitude, longitude }) =>
  API.get(`/etablissementsRecruteur/cfa/rome?rome[]=${rome}&latitude=${latitude}&longitude=${longitude}`)
export const validateOptOutToken = (token) =>
  API.get(`/optout/validate`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

export const getWithQS = (payload) => API.get("/formulaire", { params: { query: JSON.stringify(payload.query), ...payload } })

/**
 * Administration OPCO
 */

export const getOpcoUsers = async (query) => API.get(`/user/opco`, { params: query })
