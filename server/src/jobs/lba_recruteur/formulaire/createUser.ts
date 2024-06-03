import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { IUserRecruteur } from "shared/models"
import { AccessStatus } from "shared/models/roleManagement.model"

import { emailHasActiveRole } from "@/services/userWithAccount.service"

import { logger } from "../../../common/logger"
import { createUser } from "../../../services/userRecruteur.service"

export const createUserFromCLI = async (
  {
    first_name,
    last_name,
    establishment_siret,
    establishment_raison_sociale,
    phone,
    address,
    email,
    scope,
  }: Pick<IUserRecruteur, "first_name" | "last_name" | "establishment_siret" | "establishment_raison_sociale" | "phone" | "address" | "email" | "scope">,
  { options }: { options: { Type: IUserRecruteur["type"]; Email_valide: IUserRecruteur["is_email_checked"] } }
) => {
  const { Type, Email_valide } = options
  if (await emailHasActiveRole(email)) {
    logger.error(`User ${email} already have an active role`)
    return
  }

  await createUser(
    {
      first_name,
      last_name,
      establishment_siret,
      establishment_raison_sociale,
      phone,
      address,
      email,
      scope,
      type: Type,
      is_email_checked: Email_valide,
    },
    "CLI",
    {
      reason: "created from CLI",
      status: AccessStatus.GRANTED,
      validation_type: VALIDATION_UTILISATEUR.AUTO,
    }
  )

  logger.info(`User created : ${email} — ${scope} - admin: ${Type === "ADMIN"}`)
}
