import express from "express"
import parseChangelog from "changelog-parser"
import { get } from "lodash-es"
import path from "path"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import __dirname from "../../common/dirname.js"
const currentDirname = __dirname(import.meta.url)

/**
 * VERSION
 */
export default () => {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      let data = await parseChangelog(path.join(currentDirname, "../../../CHANGELOG.md"))
      return res.json(get(data, "versions.0", {}))
    })
  )

  return router
}
