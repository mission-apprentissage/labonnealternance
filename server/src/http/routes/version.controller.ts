import path from "path"

import parseChangelog from "changelog-parser"
import express from "express"
import { get } from "lodash-es"

import __dirname from "../../common/dirname"
import { tryCatch } from "../middlewares/tryCatchMiddleware"

const currentDirname = __dirname(import.meta.url)

/**
 * VERSION
 */
export default () => {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const data = await parseChangelog(path.join(currentDirname, "../../../CHANGELOG.md"))
      return res.json(get(data, "versions.0", {}))
    })
  )

  return router
}
