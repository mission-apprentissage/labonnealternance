import Boom from "boom"
import { ADMIN, CFA, ENTREPRISE, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { IUserRecruteur } from "shared/models"
import { AccessStatus } from "shared/models/roleManagement.model"

import { upsertCfa } from "@/services/cfa.service"
import { getEntrepriseDataFromSiret } from "@/services/etablissement.service"
import { upsertEntrepriseData } from "@/services/organization.service"
import { createAdminUser, createOrganizationUser } from "@/services/userRecruteur.service"
import { emailHasActiveRole } from "@/services/userWithAccount.service"

import { logger } from "../../../common/logger"

export const createUserFromCLI = async (
  {
    first_name,
    last_name,
    establishment_siret,
    establishment_raison_sociale,
    phone,
    address,
    email,
  }: Pick<IUserRecruteur, "first_name" | "last_name" | "establishment_siret" | "establishment_raison_sociale" | "phone" | "address" | "email" | "scope">,
  { options }: { options: { Type: IUserRecruteur["type"]; Email_valide: IUserRecruteur["is_email_checked"] } }
) => {
  const { Type: type, Email_valide: is_email_checked } = options
  if (await emailHasActiveRole(email)) {
    logger.error(`User ${email} already have an active role`)
    return
  }

  const origin = "CLI"
  const grantedBy = "CLI"

  const userFields = {
    first_name,
    last_name,
    email,
    phone: phone ?? "",
  }
  const statusEvent = {
    reason: "created from CLI",
    status: AccessStatus.GRANTED,
    validation_type: VALIDATION_UTILISATEUR.AUTO,
  }

  if (type === ENTREPRISE) {
    if (!establishment_siret) {
      throw Boom.internal("inattendu: siret vide")
    }
    const siretResponse = await getEntrepriseDataFromSiret({ siret: establishment_siret, type: ENTREPRISE })
    if ("error" in siretResponse) {
      throw Boom.badRequest(siretResponse.message)
    }
    const entreprise = await upsertEntrepriseData(establishment_siret, origin, siretResponse)
    await createOrganizationUser({ userFields, is_email_checked, organization: { type: ENTREPRISE, entreprise }, grantedBy, statusEvent })
  } else if (type === CFA) {
    if (!establishment_siret) {
      throw Boom.internal("inattendu: siret vide")
    }
    const cfa = await upsertCfa(
      establishment_siret,
      {
        address,
        raison_sociale: establishment_raison_sociale,
      },
      origin ?? ""
    )
    await createOrganizationUser({ userFields, is_email_checked, organization: { type: CFA, cfa }, grantedBy, statusEvent })
  } else if (type === ADMIN) {
    await createAdminUser(userFields, { grantedBy })
  } else {
    throw Boom.badRequest(`unsupported type: ${type}`)
  }

  logger.info(`User created : ${email} — ${type} - admin: ${type === ADMIN}`)
}
