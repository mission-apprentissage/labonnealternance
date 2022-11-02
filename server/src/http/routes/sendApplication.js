import express from "express";
import rateLimit from "express-rate-limit";
import {
  debugUpdateApplicationStatus,
  saveApplicationFeedback,
  saveApplicationFeedbackComment,
  saveApplicationIntentionComment,
  sendApplication,
  updateApplicationStatus,
  updateBlockedEmails,
} from "../../service/applications.js";
import { tryCatch } from "../middlewares/tryCatchMiddleware.js";

const limiter1Per5Second = rateLimit({
  windowMs: 5000, // 5 seconds
  max: 1, // limit each IP to 1 request per windowMs
});

export default function (components) {
  const router = express.Router();

  router.post(
    "/",
    limiter1Per5Second,
    tryCatch(async (req, res) => {
      const result = await sendApplication({
        shouldCheckSecret: req.body.secret ? true : false,
        query: req.body,
        referer: req.headers.referer,
        ...components,
      });

      if (result.error) {
        if (result.error === "error_sending_application") {
          res.status(500);
        } else {
          res.status(400);
        }
      }

      return res.json(result);
    })
  );

  router.post(
    "/feedback",
    limiter1Per5Second,
    tryCatch(async (req, res) => {
      const result = await saveApplicationFeedback({
        query: req.body,
        ...components,
      });
      return res.json(result);
    })
  );

  router.post(
    "/feedbackComment",
    limiter1Per5Second,
    tryCatch(async (req, res) => {
      const result = await saveApplicationFeedbackComment({
        query: req.body,
        ...components,
      });
      return res.json(result);
    })
  );

  router.post(
    "/intentionComment",
    limiter1Per5Second,
    tryCatch(async (req, res) => {
      const result = await saveApplicationIntentionComment({
        query: req.body,
        ...components,
      });
      return res.json(result);
    })
  );

  router.post(
    "/webhook",
    tryCatch(async (req, res) => {
      updateApplicationStatus({ payload: req.body, ...components });
      return res.json({ result: "ok" });
    })
  );

  router.get(
    "/webhook",
    tryCatch(async (req, res) => {
      debugUpdateApplicationStatus({ shouldCheckSecret: true, query: req.query, ...components });
      return res.json({ result: "ok" });
    })
  );

  router.get(
    "/updateBlockedEmails",
    tryCatch(async (req, res) => {
      updateBlockedEmails({ shouldCheckSecret: true, query: req.query, ...components });
      return res.json({ result: "ok" });
    })
  );

  return router;
}
