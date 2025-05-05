import { captureException } from "@sentry/nextjs"
import { IJobCreate, INewDelegations, INewSuperUser, IRecruiterJson, IRoutes, IUserWithAccountFields, removeUndefinedFields, type IBody } from "shared"
import { ApplicationIntention } from "shared/constants/application"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { IEntrepriseJson } from "shared/models/entreprise.model"

import { ApiError, apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api.utils"

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
export const postFormulaire = (userId: string, form) => apiPost("/user/:userId/formulaire", { params: { userId }, body: form })

export const archiveFormulaire = (establishment_id: string) => apiDelete("/formulaire/:establishment_id", { params: { establishment_id } }).catch(errorHandler)

/**
 * Offre API
 */
export const getOffre = (jobId: string) => apiGet("/formulaire/offre/f/:jobId", { params: { jobId } })
export const createOffre = (establishment_id: string, newOffre: IJobCreate) => apiPost("/formulaire/:establishment_id/offre", { params: { establishment_id }, body: newOffre })
export const createOffreByToken = (establishment_id: string, newOffre: IJobCreate, token: string) =>
  apiPost("/formulaire/:establishment_id/offre/by-token", { params: { establishment_id }, body: newOffre, headers: { authorization: `Bearer ${token}` } })
export const viewOffreDelegation = (jobId: string, siret: string, token: string) =>
  apiPatch(`/formulaire/offre/:jobId/delegation/view`, { params: { jobId }, querystring: { siret_formateur: siret }, headers: { authorization: `Bearer ${token}` } })
// need a function to cancel partner jobs : add the job_origin from the application in the url - refactor ui/pages/espace-pro/offre/[jobId]/[option].tsx needed
export const cancelPartnerJob = (id: string, token: string) => apiPost("/v2/_private/jobs/canceled/:id", { params: { id }, headers: { authorization: `Bearer ${token}` } })
export const providedPartnerJob = (id: string, token: string) => apiPost("/v2/_private/jobs/provided/:id", { params: { id }, headers: { authorization: `Bearer ${token}` } })
// once offres_emploi_lba are definitly stored in jobs partners, we can move this call to /jobs/:jobId/cancel
export const cancelOffre = (jobId: string, token: string) => apiPut(`/formulaire/offre/:jobId/cancel`, { params: { jobId }, headers: { authorization: `Bearer ${token}` } })
export const cancelOffreFromAdmin = (jobId: string, data: IRoutes["put"]["/formulaire/offre/f/:jobId/cancel"]["body"]["_input"]) =>
  apiPut("/formulaire/offre/f/:jobId/cancel", { params: { jobId }, body: data })
export const extendOffre = (jobId: string) => apiPut(`/formulaire/offre/:jobId/extend`, { params: { jobId } })
export const fillOffre = (jobId, token) => apiPut(`/formulaire/offre/:jobId/provided`, { params: { jobId }, headers: { authorization: `Bearer ${token}` } })
export const notifyLbaJobDetailView = async (jobId: string) => await apiPost("/v1/jobs/matcha/:id/stats/view-details", { params: { id: jobId } })
export const getRelatedEtablissementsFromRome = async ({ rome, latitude, longitude, limit }: { rome: string; latitude: number; longitude: number; limit: number }) =>
  apiGet(`/etablissement/cfas-proches`, { querystring: { rome, latitude, longitude, limit } })
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

export const updateEntrepriseAdmin = async (userId: string, user: IBody<IRoutes["put"]["/admin/users/:userId/organization/:siret"]>, siret = "unused") => {
  await apiPut("/admin/users/:userId/organization/:siret", { params: { userId, siret }, body: user })
}

export const updateUser = async (userId: string, user: any) => {
  await apiPut("/admin/users/:userId", { params: { userId }, body: user })
}

/**
 * Auth API
 */
export const sendMagiclink = async (email) => await apiPost(`/login/magiclink`, { body: email })
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

export const getPrdvContext = async (cleMinistereEducatif: string, referrer: string = "lba") => {
  try {
    const data = await apiGet("/_private/appointment", { querystring: { cleMinistereEducatif, referrer } }, { timeout: 7000 })
    return data
  } catch (error) {
    if (error?.message !== BusinessErrorCodes.TRAINING_NOT_FOUND) {
      captureException(error)
    }
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

export const getApplicationDataForIntention = async (applicationId: string, intention: ApplicationIntention, token: string) => {
  const data = await apiGet("/application/intention/schedule/:id", {
    params: { id: applicationId },
    querystring: { intention },
    headers: {
      authorization: `Bearer ${token}`,
    },
  })
  return data
}

export const createEtablissement = (etablissement) => apiPost("/etablissement/creation", { body: etablissement })

export const getRomeDetail = (rome: string) => apiGet("/rome/detail/:rome", { params: { rome } })

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

export const reportLbaItem = (itemId: string, type: LBA_ITEM_TYPE, reason: string, reasonDetails: string | undefined) =>
  apiPost("/report-company", { querystring: { type, itemId }, body: { reason, reasonDetails } })

export const getEligibleTrainingsForAppointments = (siret: string) =>
  apiGet("/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret", { params: { siret: siret } })

export const getEtablissement = (siret: string) => apiGet("/admin/etablissements/siret-formateur/:siret", { params: { siret: siret } })
