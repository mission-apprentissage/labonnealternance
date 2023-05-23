import { logger } from "../../../common/logger.js"
import { IUserRecruteur } from "../../../common/model/schema/userRecruteur/userRecruteur.types.js"

export const createUser = async (usersRecruteur, { first_name, last_name, establishment_siret, establishment_raison_sociale, phone, address, email, scope }, { options }) => {
  const { Type, Email_valide } = options
  const exist = await usersRecruteur.getUser({ email })

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

  await usersRecruteur.createUser(payload)

  logger.info(`User created : ${email} — ${scope} - admin: ${Type === "ADMIN"}`)
}
