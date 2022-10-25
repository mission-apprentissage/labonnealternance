import express from "express";
import { tryCatch } from "../middlewares/tryCatchMiddleware.js";
import { getRomesAndLabelsFromTitleQuery } from "../../service/domainesMetiers.js";
/**
 * API romes
 */
export default function () {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await getRomesAndLabelsFromTitleQuery(req.query);
      return res.json(result);
    })
  );

  return router;
}
