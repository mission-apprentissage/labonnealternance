import express from "express";
import { tryCatch } from "../middlewares/tryCatchMiddleware";
import { referrers } from "../../common/model/constants/referrers";
import { optMode } from "../../common/model/constants/etablissement";

/**
 * @description Constants router.
 */
export default () => {
  const router = express.Router();

  /**
   * @description Returns all constants.
   */
  router.get(
    "/",
    tryCatch((req, res) => res.send({ referrers: Object.values(referrers), optMode: Object.values(optMode) }))
  );

  return router;
};
