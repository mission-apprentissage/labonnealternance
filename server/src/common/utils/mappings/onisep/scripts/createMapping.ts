import csvToJson from "csvtojson"
import fs from "fs"
import { chunk } from "lodash-es"
import { getFormationsById } from "../../../catalogue.js"
import { logger } from "../../../../logger.js"

/**
 * @description Parses CSV file given from ONISEP and generate an hashmap "id" => "cle_ministere_educatif.
 * @returns {Promise<void>}
 */
;(async () => {
  const streamMappingFile = fs.createWriteStream("../mapping.js")

  const rows = await csvToJson({ noheader: true, delimiter: ";" }).fromFile("./raw_onisep_mapping.csv")

  streamMappingFile.write("const mapping = {\n")

  const catalogueCallsChunks = chunk(rows.slice(1), 20)

  for (const chunk of catalogueCallsChunks) {
    await Promise.all(
      chunk.map(async ({ field1, field6 }) => {
        const { formations } = await getFormationsById({ id: field1 })

        const [formation] = formations

        // If the formation hasn't been found, we skip this row
        if (!formation) {
          logger.warn(`Unable to retrieve catalogue formation from its id: ${field1}.`)
          return
        }

        logger.warn(`Catalogue formation found ("${field1}" > "${formation.cle_ministere_educatif}").`)
        streamMappingFile.write(`  "${field6}": "${formation.cle_ministere_educatif}", \n`)
      })
    )
  }

  streamMappingFile.write("};\n\n")
  streamMappingFile.write("module.exports = { mapping };")
  streamMappingFile.close()

  logger.info(`Mapping file successfully created.`)
})()
