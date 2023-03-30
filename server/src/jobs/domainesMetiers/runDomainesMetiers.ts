import { runScript } from "../scriptWrapper.js"
import updateDomainesMetiers from "./updateDomainesMetiers.js"

runScript(async () => {
  await updateDomainesMetiers()
})
