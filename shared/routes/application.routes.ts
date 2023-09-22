import { z } from "zod"

import { ZApplicationUI } from "../models/applications.model"

export const zApplicationRoutes = {
  post: {
    "/api/V1/application": {
      body: ZApplicationUI,
      response: {
        "200": z
          .object({
            result: z.literal("ok"),
            message: z.literal("messages sent"),
          })
          .strict(),
      },
    },
    "/api/application": {
      body: ZApplicationUI,
      response: {
        "200": z
          .object({
            result: z.literal("ok"),
            message: z.literal("messages sent"),
          })
          .strict(),
      },
    },
    "/api/application/intentionComment": {
      body: z.object({
        id: z.string(),
        iv: z.string(),
        comment: z.string(),
      }).strict(),
      response: {
        "200": z
          .object({
            result: z.literal("ok"),
            message: z.literal("comment registered"),
          })
          .strict(),
      },
    },
    "/api/application/webhook": {
      body: z.object({
        event: z.string(),
        id: z.string(),
        date: z.string(),
        ts: z.number(),
        "message-id": z.string(),
        email: z.string(),
        ts_event: z.number(),
        subject: z.string(),
        sending_ip: z.string(),
        ts_epoch: z.number(),
      }),
      response: {
        "200": z
          .object({
            result: z.literal("ok"),
          })
          .strict(),
      },
    },
  },
}
