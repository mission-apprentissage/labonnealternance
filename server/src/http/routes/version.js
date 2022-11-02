import express from "express";
import parseChangelog from "changelog-parser";
import { get } from "lodash-es";
import path from "path";
import * as url from "url";
import { tryCatch } from "../middlewares/tryCatchMiddleware.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

/**
 * VERSION
 */
export default () => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      let data = await parseChangelog(path.join(__dirname, "../../../CHANGELOG.md"));
      return res.json(get(data, "versions.0", {}));
    })
  );

  return router;
};
