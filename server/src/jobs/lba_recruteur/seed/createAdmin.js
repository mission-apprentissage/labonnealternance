import { logger } from "../../../common/logger.js"
import { runScript } from "../../scriptWrapper.js"

const admin = [
  {
    nom: "Barnoin",
    prenom: "Kevin",
    email: "kevin.barnoin@beta.gouv.fr",
  },
  { nom: "Metayer", prenom: "François", email: "françois.metayer@beta.gouv.fr" },
  { nom: "Bouhend", prenom: "Abdellah", email: "abdellah.bouhend@beta.gouv.fr" },
  { nom: "Radisson", prenom: "Leo", email: "leo.radisson@beta.gouv.fr" },
  { nom: "Arnaud", prenom: "Claire", email: "claire.arnaud@beta.gouv.fr" },
  { nom: "Guillet", prenom: "Marion", email: "marion.guillet@beta.gouv.fr" },
]

runScript(async ({ usersRecruteur }) => {
  await Promise.all(
    admin.map(async ({ nom, prenom, email }) => {
      const exist = await usersRecruteur.getUser({ email })

      if (exist) {
        logger.info(`Admin already exist : ${email}`)
        return
      }

      const created = await usersRecruteur.createUser({
        nom,
        prenom,
        email,
        scope: "all",
        type: "ADMIN",
        isAdmin: true,
      })

      logger.info(`Admin created : ${created.email}`)
    })
  )
})
