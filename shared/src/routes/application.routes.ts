import { ApplicationIntention, RefusalReasons } from "../constants/application.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"
import { ZHelloworkApplication } from "../models/applications.model.js"
import { ZLbacError } from "../models/lbacError.model.js"

import type { IRoutesDef } from "./common.routes.js"
import { ZResError } from "./common.routes.js"

export const zApplicationRoutes = {
  post: {
    "/application/intentionComment/:id": {
      path: "/application/intentionComment/:id",
      method: "post",
      params: z.object({ id: z.string() }).strict(),
      body: z
        .object({
          company_feedback: z.string().nonempty("Veuillez remplir le message"),
          company_recruitment_intention: z.literal(ApplicationIntention.ENTRETIEN),
          email: z.string().email("Adresse e-mail invalide"),
          phone: z.string().regex(/^[0-9]{10}$/, "Le numéro de téléphone doit avoir exactement 10 chiffres"),
        })
        .passthrough()
        .or(
          z
            .object({
              company_feedback: z.string().nonempty("Veuillez remplir le message"),
              company_recruitment_intention: z.literal(ApplicationIntention.REFUS),
              refusal_reasons: z.array(extensions.buildEnum(RefusalReasons)),
            })
            .passthrough()
        ),

      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
    "/application/intention/cancel/:id": {
      path: "/application/intention/cancel/:id",
      method: "post",
      params: z.object({ id: z.string() }).strict(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
    "/application/hellowork": {
      path: "/application/hellowork",
      method: "post",
      body: ZHelloworkApplication,
      response: {
        "200": z
          .object({
            atsApplicationId: z.string(),
          })
          .strict(),
        "400": z
          .union([
            ZResError,
            ZLbacError,
            z
              .object({
                message: z.string(),
                code: z.string(),
              })
              .strict(),
          ]),
        "401": z
          .union([
            ZResError,
            ZLbacError,
            z
              .object({
                message: z.string(),
                code: z.string(),
              })
              .strict(),
          ]),
      },
      securityScheme: null,
    },
  },
  get: {
    "/application/company/email": {
      path: "/application/company/email",
      method: "get",
      querystring: z.object({ token: z.string() }).strict(),
      response: {
        "200": z
          .object({
            company_email: z.string().email(),
          })
          .strict(),
      },
      securityScheme: null,
    },
    "/application/intention/schedule/:id": {
      path: "/application/intention/schedule/:id",
      method: "get",
      params: z.object({ id: z.string() }).strict(),
      querystring: z.object({ intention: extensions.buildEnum(ApplicationIntention) }).strict(),
      response: {
        "200": z
          .object({
            recruiter_email: z.string(),
            recruiter_phone: z.string(),
            applicant_first_name: z.string(),
            applicant_last_name: z.string(),
            company_name: z.string(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
