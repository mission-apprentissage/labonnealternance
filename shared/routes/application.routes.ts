import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { ZApplicationUI } from "../models/applications.model"

import { IRoutesDef } from "./common.routes"

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
      body: z
        .object({
          id: z.string(),
          iv: z.string(),
          comment: z.string(),
        })
        .strict(),
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
      body: extensions.brevoWebhook(),
      response: {
        "200": z
          .object({
            result: z.literal("ok"),
          })
          .strict(),
      },
    },
  },
} as const satisfies IRoutesDef
