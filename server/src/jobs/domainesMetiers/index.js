import updateDomainesMetiers from "./updateDomainesMetiers.js"
import { runScript } from "../scriptWrapper.js"

runScript(async () => {
  await updateDomainesMetiers()
})
