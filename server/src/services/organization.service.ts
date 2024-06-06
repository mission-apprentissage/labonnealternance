import Boom from "boom"
import { ICFA } from "shared/models/cfa.model"
import { EntrepriseStatus, IEntreprise } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { IUserWithAccount } from "shared/models/userWithAccount.model"
import { getLastStatusEvent } from "shared/utils"

import { Entreprise, Recruiter, RoleManagement, UserWithAccount } from "@/common/model"
import { asyncForEach } from "@/common/utils/asyncUtils"

import { CFA, ENTREPRISE } from "./constant.service"
import { autoValidateUserRoleOnCompany, getEntrepriseDataFromSiret, sendEmailConfirmationEntreprise } from "./etablissement.service"
import { activateEntrepriseRecruiterForTheFirstTime } from "./formulaire.service"
import { deactivateEntreprise, setEntrepriseInError, setEntrepriseValid } from "./userRecruteur.service"

export type Organization = { entreprise: IEntreprise; type: typeof ENTREPRISE } | { cfa: ICFA; type: typeof CFA }
export type UserAndOrganization = { user: IUserWithAccount; organization: Organization }

export const updateEntrepriseOpco = async (siret: string, { opco, idcc }: { opco: string; idcc?: string }) => {
  const entreprise = await Entreprise.findOne({ siret }).lean()
  if (!entreprise) {
    throw new Error("inattendu: aucune entreprise trouvée. Merci d'appeler cette méthode une fois l'entreprise créée")
  }
  await Entreprise.findOneAndUpdate({ siret }, { opco, idcc }).lean()
}

/**
 * Mets à jour l'entreprise si besoin et si possible, et renvoie l'entreprise la plus à jour possible.
 * @param siret
 * @param origin
 * @param siretResponse Réponse de la fonction getEntrepriseDataFromSiret
 * @returns renvoie l'entreprise la plus à jour possible.
 */
export const upsertEntrepriseData = async (
  siret: string,
  origin: string,
  siretResponse: Awaited<ReturnType<typeof getEntrepriseDataFromSiret>>,
  isInternalError: boolean
): Promise<IEntreprise> => {
  let existingEntreprise = await Entreprise.findOne({ siret }).lean()
  if ("error" in siretResponse) {
    if (existingEntreprise) {
      if (isInternalError) {
        await setEntrepriseInError(existingEntreprise._id, siretResponse.message)
      } else {
        await deactivateEntreprise(existingEntreprise._id, siretResponse.message)
      }
      return Entreprise.findOne({ siret }).lean()
    } else {
      existingEntreprise = (await Entreprise.create({ siret, origin, status: [] })).toObject()
      if (isInternalError) {
        await setEntrepriseInError(existingEntreprise._id, siretResponse.message)
      } else {
        await deactivateEntreprise(existingEntreprise._id, siretResponse.message)
      }
      return existingEntreprise
    }
  }

  const { address, address_detail, establishment_enseigne, geo_coordinates, establishment_raison_sociale } = siretResponse

  const entrepriseFields: Omit<IEntreprise, "_id" | "createdAt" | "updatedAt" | "status" | "origin" | "siret" | "opco" | "idcc"> = {
    address,
    address_detail,
    enseigne: establishment_enseigne,
    geo_coordinates,
    raison_sociale: establishment_raison_sociale,
  }
  let savedEntreprise: IEntreprise
  if (existingEntreprise) {
    savedEntreprise = await Entreprise.findOneAndUpdate({ siret }, { $set: entrepriseFields }, { new: true }).lean()
  } else {
    savedEntreprise = (await Entreprise.create({ ...entrepriseFields, siret, origin })).toObject()
  }
  await setEntrepriseValid(savedEntreprise._id)

  await Recruiter.updateMany({ establishment_siret: siret }, siretResponse)
  if (getLastStatusEvent(existingEntreprise?.status)?.status === EntrepriseStatus.ERROR) {
    const recruiters = await Recruiter.find({ establishment_siret: siret }).lean()
    const roles = await RoleManagement.find({ authorized_type: AccessEntityType.ENTREPRISE, authorized_id: savedEntreprise._id.toString() }).lean()
    const rolesToUpdate = roles.filter((role) => getLastStatusEvent(role.status)?.status !== AccessStatus.DENIED)
    const users = await UserWithAccount.find({ _id: { $in: rolesToUpdate.map((role) => role.user_id) } }).lean()
    await asyncForEach(users, async (user) => {
      const userAndOrganization: UserAndOrganization = { user, organization: { entreprise: savedEntreprise, type: ENTREPRISE } }
      const result = await autoValidateUserRoleOnCompany(userAndOrganization, origin)
      if (result.validated) {
        const recruiter = recruiters.find((recruiter) => recruiter.managed_by?.toString() === user._id.toString())
        if (!recruiter) {
          return
        }
        await activateEntrepriseRecruiterForTheFirstTime(recruiter)
        const role = rolesToUpdate.find((role) => role.user_id.toString() === user._id.toString())
        const status = getLastStatusEvent(role?.status)?.status
        if (!status) {
          throw Boom.internal("inattendu : status du role non trouvé")
        }
        await sendEmailConfirmationEntreprise(user, recruiter, status, EntrepriseStatus.VALIDE)
      }
    })
  }
  return savedEntreprise
}
