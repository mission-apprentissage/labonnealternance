import { runScript } from "../scriptWrapper.js"
import updateBonnesBoites from "./updateBonnesBoites.js"

runScript(async () => {
  await updateBonnesBoites({ UseAlgoFile: true, ClearMongo: true, BuildIndex: true, UseSave: true })
})
