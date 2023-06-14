import { logger } from "../../../common/logger.js"
import { getUser, createUser } from "../../../services/userRecruteur.service.js"

export const createUserFromCLI = async ({ first_name, last_name, establishment_siret, establishment_raison_sociale, phone, address, email, scope }, { options }) => {
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
  }

  await createUser(payload)

  logger.info(`User created : ${email} — ${scope} - admin: ${Type === "ADMIN"}`)
}
