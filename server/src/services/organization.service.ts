import { internal } from "@hapi/boom"
import { ObjectId } from "mongodb"
import { CFA, ENTREPRISE, OPCOS_LABEL } from "shared/constants/index"
import { ICFA } from "shared/models/cfa.model"
import { EntrepriseStatus, IEntreprise } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { IUserWithAccount } from "shared/models/userWithAccount.model"
import { getLastStatusEvent, isEnum } from "shared/utils/index"

import { asyncForEach } from "../common/utils/asyncUtils"
import { getDbCollection } from "../common/utils/mongodbUtils"

import { autoValidateUserRoleOnCompany, getEntrepriseDataFromSiret, sendEmailConfirmationEntreprise } from "./etablissement.service"
import { checkForJobActivations } from "./formulaire.service"
import { deactivateEntreprise, setEntrepriseInError, setEntrepriseValid } from "./userRecruteur.service"

export type Organization = { entreprise: IEntreprise; type: typeof ENTREPRISE } | { cfa: ICFA; type: typeof CFA }
export type UserAndOrganization = { user: IUserWithAccount; organization: Organization }

export const updateEntrepriseOpco = async (siret: string, { opco, idcc }: { opco: OPCOS_LABEL; idcc: number | null }) => {
  const entreprise = await getDbCollection("entreprises").findOne({ siret })
  if (!entreprise) {
    throw new Error("inattendu: aucune entreprise trouvée. Merci d'appeler cette méthode une fois l'entreprise créée")
  }
  if (!isKnownOpco(entreprise.opco)) {
    await getDbCollection("entreprises").findOneAndUpdate({ siret }, { $set: { opco, idcc } })
    return { opco, idcc }
  }
  return { opco: entreprise.opco, idcc: entreprise.idcc }
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
  let existingEntreprise: IEntreprise | null = await getDbCollection("entreprises").findOne({ siret })
  if ("error" in siretResponse) {
    if (!existingEntreprise) {
      const now = new Date()
      existingEntreprise = { _id: new ObjectId(), opco: OPCOS_LABEL.UNKNOWN_OPCO, idcc: null, createdAt: now, updatedAt: now, siret, origin, status: [] }
      await getDbCollection("entreprises").insertOne(existingEntreprise)
    }
    if (isInternalError) {
      const statusToUpdate = [EntrepriseStatus.ERROR, EntrepriseStatus.A_METTRE_A_JOUR]
      const lastStatus = getLastStatusEvent(existingEntreprise.status)?.status
      if (!lastStatus || statusToUpdate.includes(lastStatus)) {
        await setEntrepriseInError(existingEntreprise._id, siretResponse.message)
      }
    } else {
      await deactivateEntreprise(existingEntreprise._id, siretResponse.message)
    }
    return (await getDbCollection("entreprises").findOne({ siret }))!
  }

  const { address, address_detail, establishment_enseigne, geo_coordinates, establishment_raison_sociale, naf_code, naf_label } = siretResponse

  const entrepriseFields: Omit<IEntreprise, "_id" | "createdAt" | "updatedAt" | "status" | "origin" | "siret" | "opco" | "idcc"> = {
    address,
    address_detail,
    enseigne: establishment_enseigne,
    geo_coordinates,
    raison_sociale: establishment_raison_sociale,
    naf_code,
    naf_label,
  }
  let savedEntreprise: IEntreprise
  if (existingEntreprise) {
    const updatedEntreprise = await getDbCollection("entreprises").findOneAndUpdate(
      { siret },
      { $set: { ...entrepriseFields, updatedAt: new Date() } },
      { returnDocument: "after" }
    )
    if (!updatedEntreprise) {
      throw internal("inattendu: aucune entreprise trouvée")
    }
    savedEntreprise = updatedEntreprise
  } else {
    const now = new Date()
    savedEntreprise = { ...entrepriseFields, opco: OPCOS_LABEL.UNKNOWN_OPCO, idcc: null, siret, origin, _id: new ObjectId(), createdAt: now, updatedAt: now, status: [] }
    await getDbCollection("entreprises").insertOne(savedEntreprise)
  }
  await setEntrepriseValid(savedEntreprise._id)

  await getDbCollection("recruiters").updateMany(
    { establishment_siret: siret },
    {
      $set: {
        address,
        address_detail,
        establishment_enseigne,
        geo_coordinates,
        geopoint: siretResponse.geopoint,
        establishment_raison_sociale,
        establishment_creation_date: siretResponse.establishment_creation_date,
        establishment_size: siretResponse.establishment_size,
        naf_code: siretResponse.naf_code,
        naf_label: siretResponse.naf_label,
        updatedAt: new Date(),
      },
    }
  )
  if (getLastStatusEvent(existingEntreprise?.status)?.status === EntrepriseStatus.ERROR) {
    const recruiters = await getDbCollection("recruiters").find({ establishment_siret: siret }).toArray()
    const roles = await getDbCollection("rolemanagements").find({ authorized_type: AccessEntityType.ENTREPRISE, authorized_id: savedEntreprise._id.toString() }).toArray()
    const rolesToUpdate = roles.filter((role) => getLastStatusEvent(role.status)?.status !== AccessStatus.DENIED)
    const users = await getDbCollection("userswithaccounts")
      .find({ _id: { $in: rolesToUpdate.map((role) => role.user_id) } })
      .toArray()
    await asyncForEach(users, async (user) => {
      const userAndOrganization: UserAndOrganization = { user, organization: { entreprise: savedEntreprise, type: ENTREPRISE } }
      const result = await autoValidateUserRoleOnCompany(userAndOrganization, origin)
      if (result.validated) {
        const recruiter = recruiters.find((recruiter) => recruiter.managed_by.toString() === user._id.toString())
        if (!recruiter) {
          return
        }
        await checkForJobActivations(recruiter)
        const role = rolesToUpdate.find((role) => role.user_id.toString() === user._id.toString())
        const status = getLastStatusEvent(role?.status)?.status
        if (!status) {
          throw internal("inattendu : status du role non trouvé")
        }
        await sendEmailConfirmationEntreprise(user, recruiter, status, EntrepriseStatus.VALIDE)
      }
    })
  }
  return savedEntreprise
}

export const isKnownOpco = (opco: OPCOS_LABEL | null) => isEnum(OPCOS_LABEL, opco) && opco !== OPCOS_LABEL.UNKNOWN_OPCO && opco !== OPCOS_LABEL.MULTIPLE_OPCO
