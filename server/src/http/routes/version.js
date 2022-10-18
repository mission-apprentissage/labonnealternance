import express from "express";
import { tryCatch } from "../middlewares/tryCatchMiddleware.js";

import path from "path";
import parseChangelog from "changelog-parser";
import _ from "lodash";

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

/**
 * VERSION
 */
export default () => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      let data = await parseChangelog(path.join(__dirname, "../../../CHANGELOG.md"));
      return res.json(_.get(data, "versions.0", {}));
    })
  );

  return router;
};
