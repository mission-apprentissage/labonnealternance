import { logger } from "../../../common/logger.js";

export const createUser = async (
  users,
  { prenom, nom, siret, raison_sociale, telephone, adresse, email, scope },
  { options }
) => {
  const { Type, Admin, Email_valide } = options;
  let exist = await users.getUser({ email });

  if (exist) {
    logger.error(`Users ${email} already exist - ${exist._id}`);
    return;
  }

  let payload = {
    prenom,
    nom,
    siret,
    raison_sociale,
    telephone,
    adresse,
    email,
    scope,
    type: Type,
    isAdmin: Admin,
    email_valide: Email_valide,
  };

  await users.createUser(payload);

  logger.info(`User created : ${email} — ${scope} - admin: ${Admin}`);
};
