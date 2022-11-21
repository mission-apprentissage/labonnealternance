import { logger } from "../../../common/logger.js"
import { UserRecruteur } from "../../../common/model/index.js"
import { runScript } from "../../scriptWrapper.js"
import { userList } from "./opcoUsers.js"

runScript(async () => {
  await Promise.all(
    userList.map(async (user) => {
      const exist = await UserRecruteur.findOne({ email: user.email, type: "OPCO" }).lean()

      if (exist) {
        logger.info(`USER EXIST : ${user.nom} - ${user.prenom} — ${Object.values(user.opco)}`)
        return
      }

      console.error(user.email)

      const newUser = await UserRecruteur.create({
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        raison_social: Object.values(user.opco)[0],
        scope: Object.values(user.opco)[0],
        type: "OPCO",
      })

      logger.info(`USER CREATED : ${newUser.nom} - ${newUser.prenom} — ${newUser.scope}`)
    })
  )
})
