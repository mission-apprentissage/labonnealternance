import { ApplicationIntention, RefusalReasons } from "../constants/application.js"
import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"
import { CompanyFeebackSendStatus, ZHelloworkApplication } from "../models/applications.model.js"
import { zObjectId } from "../models/common.js"
import { JOB_STATUS_ENGLISH } from "../models/job.model.js"
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
          email: z.email("Format attendu : nom@domaine.fr").or(z.literal("")).optional(),
          phone: z
            .string()
            .regex(/^[0-9]{10}$/, "Le numéro doit comporter 10 chiffres, par exemple 0612345678")
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
    "/application/job/:jobId/application/:applicationId/treated-elsewhere": {
      path: "/application/job/:jobId/application/:applicationId/treated-elsewhere",
      method: "post",
      params: z.strictObject({ jobId: zObjectId, applicationId: zObjectId }),
      response: {
        "200": z.strictObject({}),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "application:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
    },
  },
  get: {
    "/application/job/:jobId": {
      path: "/application/job/:jobId",
      method: "get",
      params: z.strictObject({ jobId: zObjectId }),
      response: {
        "200": z.strictObject({
          job: z.strictObject({
            _id: zObjectId,
            offer_title: z.string(),
            offer_rome_appellation: z.string().nullable(),
            offer_expiration: z.date().nullable(),
            offer_status: extensions.buildEnum(JOB_STATUS_ENGLISH),
          }),
          applications: z.array(
            z.strictObject({
              _id: zObjectId,
              applicant_first_name: z.string(),
              applicant_last_name: z.string(),
              company_recruitment_intention: z.string().nullable(),
              created_at: z.date().nullable(),
            })
          ),
        }),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "application:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
    },
    "/application/job/:jobId/application/:applicationId": {
      path: "/application/job/:jobId/application/:applicationId",
      method: "get",
      params: z.strictObject({ jobId: zObjectId, applicationId: zObjectId }),
      response: {
        "200": z.strictObject({
          job: z.strictObject({ _id: zObjectId, offer_title: z.string(), to_applicant_questions: z.array(z.string()) }),
          application: z.strictObject({
            _id: zObjectId,
            created_at: z.date().nullable(),
            applicant_first_name: z.string(),
            applicant_last_name: z.string(),
            applicant_email: z.string(),
            applicant_phone: z.string(),
            company_recruitment_intention: z.string().nullable(),
            company_recruitment_intention_date: z.date().nullable(),
            company_feedback: z.string().nullable(),
            company_feedback_reasons: z.array(z.string()),
            company_feedback_date: z.date().nullable(),
            company_feedback_send_status: z.string().nullable(),
            feedback_email_subject: z.string().nullable().describe("Objet du mail de réponse envoyé au candidat"),
            applicant_message_to_company: z.string().nullable(),
            applicant_attachment_name: z.string(),
            applicant_attachment_deleted_at: z.date().nullable(),
            applicant_attachment_size: z.number().nullable().describe("Taille de la pièce jointe en octets, null si elle est inconnue"),
            applicant_inscription_formation: z.boolean().nullable(),
            applicant_contract_duration: z.string().nullable(),
            applicant_contract_start: z.array(z.string()),
            applicant_formation_description: z.string().nullable(),
            applicant_rythm_description: z.string().nullable(),
            applicant_answers_to_recruiter_questions: z.array(z.strictObject({ question: z.string(), answer: z.string() })),
            partner_name: z.string().nullable().describe("Plateforme partenaire par laquelle le candidat a postulé"),
          }),
        }),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "application:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
    },
    "/application/job/:jobId/application/:applicationId/attachment": {
      path: "/application/job/:jobId/application/:applicationId/attachment",
      method: "get",
      params: z.strictObject({ jobId: zObjectId, applicationId: zObjectId }),
      response: {
        "200": z.any().describe("Pièce jointe de la candidature (PDF ou DOCX)"),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "application:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
    },
    "/application/job/:jobId/application/:applicationId/reply-token": {
      path: "/application/job/:jobId/application/:applicationId/reply-token",
      method: "get",
      params: z.strictObject({ jobId: zObjectId, applicationId: zObjectId }),
      querystring: z.strictObject({ intention: extensions.buildEnum(ApplicationIntention) }),
      response: {
        "200": z.strictObject({ token: z.string().describe("Jeton des routes de réponse au candidat (/application/intention…)") }),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "application:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
    },
    "/application/job/:jobId/export": {
      path: "/application/job/:jobId/export",
      method: "get",
      params: z.strictObject({ jobId: zObjectId }),
      response: {
        "200": z.string().describe("Fichier CSV séparé par des tabulations"),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "application:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
    },
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
          espace_pro: z
            .strictObject({ job_id: z.string(), cfa_establishment_id: z.string().nullable(), establishment_name: z.string() })
            .nullable()
            .describe("Pages de l'espace pro de la candidature, pour le fil d'Ariane ; null hors offre LBA"),
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
