import { ETAT_UTILISATEUR, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { IUserRecruteur } from "shared/models"

import { logger } from "../../../common/logger"
import { createUser, getUserRecruteurByEmail } from "../../../services/userRecruteur.service"

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
  const exist = await getUserRecruteurByEmail(email)

  if (exist) {
    logger.error(`Users ${email} already exist - ${exist._id}`)
    return
  }

  await createUser({
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
    status: [
      {
        status: ETAT_UTILISATEUR.VALIDE,
        validation_type: VALIDATION_UTILISATEUR.AUTO,
        user: "SERVEUR",
        date: new Date(),
      },
    ],
  })

  logger.info(`User created : ${email} — ${scope} - admin: ${Type === "ADMIN"}`)
}
