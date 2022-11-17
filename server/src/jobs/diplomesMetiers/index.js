import updateDiplomesMetiers from "./updateDiplomesMetiers.js"
import { runScript } from "../scriptWrapper.js"

runScript(async () => {
  await updateDiplomesMetiers()
})
