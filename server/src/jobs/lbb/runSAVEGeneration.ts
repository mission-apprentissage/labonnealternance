import { runScript } from "../scriptWrapper.js"
import buildSAVE from "./buildSAVE.js"

runScript(async () => {
  await buildSAVE()
})
