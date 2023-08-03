import { runScript } from "../scriptWrapper.js"
import uploadFile from "./uploadFile.js"

runScript(async () => {
  await uploadFile({ filename: "20230801 - Mapping ROME-RNCP.xlsx", key: "mappingRncpRome" })
})
