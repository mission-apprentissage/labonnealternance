import express from "express";
import { logger } from "../../common/logger.js";
import { tryCatch } from "../middlewares/tryCatchMiddleware.js";
import { arrayOf, validate } from "../utils/validators.js";
import Joi from "joi";

/**
 * Sample route module for displaying hello message
 */
export default () => {
  const router = express.Router();

  router.get(
    "/api/hello",
    tryCatch(async (req, res) => {
      const { messages } = await validate(
        { ...req.query, ...req.params },
        {
          messages: arrayOf(Joi.string().required()).default([]),
        }
      );

      logger.info("Hello :", { messages });

      return res.json({
        hello: messages,
      });
    })
  );

  return router;
};
