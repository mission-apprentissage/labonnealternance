import { IUserRecruteur } from "shared/models"

import { logger } from "../../../common/logger"
import { getUser, createUser } from "../../../services/userRecruteur.service"

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
    status,
  }: Pick<IUserRecruteur, "first_name" | "last_name" | "establishment_siret" | "establishment_raison_sociale" | "phone" | "address" | "email" | "scope" | "status">,
  { options }: { options: { Type: IUserRecruteur["type"]; Email_valide: IUserRecruteur["is_email_checked"] } }
) => {
  const { Type, Email_valide } = options
  const exist = await getUser({ email })

  if (exist) {
    logger.error(`Users ${email} already exist - ${exist._id}`)
    return
  }

  const payload = {
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
    status,
  }

  await createUser(payload)

  logger.info(`User created : ${email} — ${scope} - admin: ${Type === "ADMIN"}`)
}
