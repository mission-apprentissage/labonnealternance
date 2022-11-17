import { UserRecruteur } from "../../../../common/model/index.js"
import { runScript } from "../../../scriptWrapper.js"

runScript(async () => {
  // update record using MongoDB API to avoid timestamp automatic update
  await UserRecruteur.collection.updateMany({}, { $unset: { organization: "", uai: "" } })
})
