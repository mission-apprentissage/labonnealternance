import { logger } from "../../../common/logger.js"
import { runScript } from "../../scriptWrapper.js"

const admin = []

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
        email_valide: true,
        raison_sociale: "BETA",
      })

      logger.info(`Admin created : ${created.email}`)
    })
  )
})
