import { runScript } from "../scriptWrapper"

import updateDomainesMetiers from "./updateDomainesMetiers"

runScript(async () => {
  await updateDomainesMetiers()
})
