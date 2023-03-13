import { runScript } from "../scriptWrapper.js"
import updateOpcoCompanies from "./updateOpcoCompanies.js"

runScript(async () => {
  await updateOpcoCompanies({ ClearMongo: false })
})
