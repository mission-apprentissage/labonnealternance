import { runScript } from "../scriptWrapper"

import buildSAVE from "./buildSAVE"

runScript(async () => {
  await buildSAVE()
})
