import { UserRecruteur } from "../../../../common/model/index"
import { asyncForEach } from "../../../../common/utils/asyncUtils"
import { runScript } from "../../../scriptWrapper"

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
