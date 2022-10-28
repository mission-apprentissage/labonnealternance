import express from "express";
import { tryCatch } from "../../middlewares/tryCatchMiddleware";
import config from "../../../config";

export default () => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      return res.json({
        config: config,
      });
    })
  );

  return router;
};
