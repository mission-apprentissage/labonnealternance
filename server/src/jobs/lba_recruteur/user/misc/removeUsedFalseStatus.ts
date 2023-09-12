// @ts-nocheck
import { UserRecruteur } from "../../../../db/index.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { runScript } from "../../../scriptWrapper.js"

runScript(async () => {
  const users = await UserRecruteur.find({ "status.status": null, type: "ENTREPRISE" })

  const stat = { updated: 0, total: users.length }

  await asyncForEach(users, async (user) => {
    const lastState = user.status.pop()

    if (!lastState.status) {
      stat.updated++
      user.save()
    }
  })

  return { stat }
})
