import { ApplicationIntention, RefusalReasons } from "../constants/application.js"
import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"
import { CompanyFeebackSendStatus, ZHelloworkApplication } from "../models/applications.model.js"
import { ZLbacError } from "../models/lbac-error.model.js"

import type { IRoutesDef } from "./common.routes.js"
import { ZResError } from "./common.routes.js"

export const zApplicationRoutes = {
  post: {
    "/application/intentionComment/:id": {
      path: "/application/intentionComment/:id",
      method: "post",
      params: z.strictObject({ id: z.string() }),
      body: z
        .looseObject({
          company_feedback: z.string().min(1, "Veuillez remplir le message"),
          company_recruitment_intention: z.literal(ApplicationIntention.ENTRETIEN),
          email: z.email("Adresse e-mail invalide").or(z.literal("")).optional(),
          phone: z
            .string()
            .regex(/^[0-9]{10}$/, "Le numéro de téléphone doit avoir exactement 10 chiffres")
            .or(z.literal(""))
            .optional(),
        })
        .or(
          z.looseObject({
            company_feedback: z.string().min(1, "Veuillez remplir le message"),
            company_recruitment_intention: z.literal(ApplicationIntention.REFUS),
            refusal_reasons: z.array(extensions.buildEnum(RefusalReasons)),
          })
        ),

      response: {
        "200": z.strictObject({}),
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
      params: z.strictObject({ id: z.string() }),
      response: {
        "200": z.strictObject({}),
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
        "200": z.strictObject({
          atsApplicationId: z.string(),
        }),
        "400": z.union([
          ZResError,
          ZLbacError,
          z.strictObject({
            message: z.string(),
            code: z.string(),
          }),
        ]),
        "401": z.union([
          ZResError,
          ZLbacError,
          z.strictObject({
            message: z.string(),
            code: z.string(),
          }),
        ]),
      },
      securityScheme: null,
    },
  },
  get: {
    "/application/company/email": {
      path: "/application/company/email",
      method: "get",
      querystring: z.strictObject({ token: z.string() }),
      response: {
        "200": z.strictObject({
          company_email: z.email(),
        }),
      },
      securityScheme: null,
    },
    "/application/intention/schedule/:id": {
      path: "/application/intention/schedule/:id",
      method: "get",
      params: z.strictObject({ id: z.string() }),
      querystring: z.strictObject({ intention: extensions.buildEnum(ApplicationIntention) }),
      response: {
        "200": z.strictObject({
          recruiter_email: z.string(),
          recruiter_phone: z.string(),
          applicant_first_name: z.string(),
          applicant_last_name: z.string(),
          applicant_email: z.string(),
          applicant_phone: z.string(),
          company_name: z.string(),
          sent_intention: z
            .object({
              company_feedback_send_status: extensions.buildEnum(CompanyFeebackSendStatus),
              company_feedback: z.string().nullable(),
              company_feedback_reasons: z.array(extensions.buildEnum(RefusalReasons)).nullable(),
              company_recruitment_intention_date: z.date().nullable(),
              company_recruitment_intention: extensions.buildEnum(ApplicationIntention).nullable(),
            })
            .optional(),
        }),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
