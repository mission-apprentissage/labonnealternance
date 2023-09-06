import { runScript } from "../scriptWrapper"

import uploadFile from "./uploadFile"

runScript(async () => {
  await uploadFile({ filename: "20230801 - Mapping ROME-RNCP.xlsx", key: "mappingRncpRome" })
})
