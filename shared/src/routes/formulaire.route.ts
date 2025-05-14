import { zObjectId } from "zod-mongodb-schema"

import { z } from "../helpers/zodWithOpenApi.js"
import { JOB_STATUS, ZJob, ZJobCreate } from "../models/job.model.js"
import { ZRecruiter, ZRecruiterWithApplicationCount } from "../models/recruiter.model.js"
import { ZUserWithAccountFields } from "../models/userWithAccount.model.js"

import { IRoutesDef } from "./common.routes.js"

export const zFormulaireRoute = {
  get: {
    "/formulaire/:establishment_id": {
      method: "get",
      path: "/formulaire/:establishment_id",
      params: z.object({ establishment_id: z.string() }).strict(),
      response: {
        "200": ZRecruiterWithApplicationCount,
      },
      securityScheme: {
        auth: "cookie-session",
        access: { some: ["recruiter:manage", "recruiter:add_job"] },
        resources: {
          recruiter: [{ establishment_id: { type: "params", key: "establishment_id" } }],
        },
      },
    },
    "/formulaire/:establishment_id/by-token": {
      method: "get",
      path: "/formulaire/:establishment_id/by-token",
      params: z.object({ establishment_id: z.string() }).strict(),
      response: {
        "200": ZRecruiterWithApplicationCount,
      },
      securityScheme: {
        auth: "access-token",
        access: { some: ["recruiter:manage", "recruiter:add_job"] },
        resources: {
          recruiter: [{ establishment_id: { type: "params", key: "establishment_id" } }],
        },
      },
    },
    "/formulaire/delegation/:establishment_id": {
      method: "get",
      path: "/formulaire/delegation/:establishment_id",
      params: z.object({ establishment_id: z.string() }).strict(),
      response: {
        "200": ZRecruiter,
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
    "/formulaire/offre/f/:jobId": {
      method: "get",
      path: "/formulaire/offre/f/:jobId",
      // TODO_SECURITY_FIX faire un ZJobPublic sans la partie delegations
      params: z.object({ jobId: zObjectId }).strict(),
      response: {
        "200": ZJob,
      },
      securityScheme: {
        auth: "cookie-session",
        access: "job:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
    },
  },
  post: {
    "/user/:userId/formulaire": {
      method: "post",
      path: "/user/:userId/formulaire",
      params: z.object({ userId: zObjectId }).strict(),
      body: z
        .object({
          establishment_siret: z.string(),
          email: z.string(),
          last_name: z.string(),
          first_name: z.string(),
          phone: z.string(),
        })
        .strict(),
      response: {
        "200": ZRecruiter,
      },
      securityScheme: {
        auth: "cookie-session",
        access: "user:manage",
        resources: {
          user: [{ _id: { key: "userId", type: "params" } }],
        },
      },
    },
    "/formulaire/:establishment_id/informations": {
      method: "post",
      path: "/formulaire/:establishment_id/informations",
      params: z.object({ establishment_id: z.string() }).strict(),
      body: ZUserWithAccountFields.partial(),
      response: {
        "200": z.object({ ok: z.boolean() }).strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "recruiter:manage",
        resources: {
          recruiter: [{ establishment_id: { type: "params", key: "establishment_id" } }],
        },
      },
    },
    "/formulaire/:establishment_id/offre": {
      method: "post",
      path: "/formulaire/:establishment_id/offre",
      // TODO_SECURITY_FIX limiter les champs autorisés à la modification. Utiliser un "ZRecruiterNew" (ou un autre nom du genre ZFormulaire)
      params: z.object({ establishment_id: z.string() }).strict(),
      // TODO nonstrict TO BE FIXED on the frontend
      body: ZJobCreate.nonstrict(),
      response: {
        "200": z
          .object({
            recruiter: ZRecruiter,
            token: z.string().optional(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "recruiter:add_job",
        resources: {
          recruiter: [{ establishment_id: { type: "params", key: "establishment_id" } }],
        },
      },
    },
    "/formulaire/:establishment_id/offre/by-token": {
      method: "post",
      path: "/formulaire/:establishment_id/offre/by-token",
      // TODO_SECURITY_FIX limiter les champs autorisés à la modification. Utiliser un "ZRecruiterNew" (ou un autre nom du genre ZFormulaire)
      params: z.object({ establishment_id: z.string() }).strict(),
      // TODO nonstrict TO BE FIXED on the frontend
      body: ZJobCreate.nonstrict(),
      response: {
        "200": z
          .object({
            recruiter: ZRecruiter,
            token: z.string(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: "recruiter:add_job",
        resources: {
          recruiter: [{ establishment_id: { type: "params", key: "establishment_id" } }],
        },
      },
    },
    "/formulaire/offre/:jobId/delegation": {
      method: "post",
      path: "/formulaire/offre/:jobId/delegation",
      params: z.object({ jobId: zObjectId }).strict(),
      body: z
        .object({
          etablissementCatalogueIds: z.array(z.string()),
        })
        .strict(),
      response: {
        "200": ZRecruiter,
      },
      securityScheme: {
        auth: "cookie-session",
        access: { some: ["job:manage", "recruiter:add_job"] },
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
    },
    "/formulaire/offre/:jobId/delegation/by-token": {
      method: "post",
      path: "/formulaire/offre/:jobId/delegation/by-token",
      params: z.object({ jobId: zObjectId }).strict(),
      body: z
        .object({
          etablissementCatalogueIds: z.array(z.string()),
        })
        .strict(),
      response: {
        "200": ZRecruiter,
      },
      securityScheme: {
        auth: "access-token",
        access: { some: ["job:manage", "recruiter:add_job"] },
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
    },
  },
  put: {
    "/formulaire/offre/:jobId": {
      method: "put",
      path: "/formulaire/offre/:jobId",
      params: z.object({ jobId: zObjectId }).strict(),
      body: ZJob.pick({
        rome_label: true,
        rome_appellation_label: true,
        rome_code: true,
        job_level_label: true,
        job_status: true,
        job_type: true,
        delegations: true,
        is_disabled_elligible: true,
        job_count: true,
        job_duration: true,
        job_rythm: true,
        job_delegation_count: true,
        competences_rome: true,
        offer_title_custom: true,
      }).extend({
        job_start_date: z.coerce.date(),
        job_update_date: z.coerce.date(),
        job_creation_date: z.coerce.date(),
        job_expiration_date: z.coerce.date(),
      }),
      response: {
        "200": z.object({}),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "job:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
    },
    "/formulaire/offre/:jobId/cancel": {
      method: "put",
      path: "/formulaire/offre/:jobId/cancel",
      params: z.object({ jobId: zObjectId }).strict(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: "job:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
    },
    "/formulaire/offre/f/:jobId/cancel": {
      method: "put",
      path: "/formulaire/offre/f/:jobId/cancel",
      params: z.object({ jobId: zObjectId }).strict(),
      body: z
        .object({
          job_status: z.enum([JOB_STATUS.POURVUE, JOB_STATUS.ANNULEE]),
          job_status_comment: z.string(),
        })
        .strict(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "job:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
    },
    "/formulaire/offre/:jobId/provided": {
      method: "put",
      path: "/formulaire/offre/:jobId/provided",
      params: z.object({ jobId: zObjectId }).strict(),
      response: {
        "2xx": z.object({}).strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: "job:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
    },
    "/formulaire/offre/:jobId/extend": {
      method: "put",
      path: "/formulaire/offre/:jobId/extend",
      params: z.object({ jobId: zObjectId }).strict(),
      response: {
        "200": ZJob.strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "job:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
    },
  },
  patch: {
    "/formulaire/offre/:jobId/delegation/view": {
      method: "patch",
      path: "/formulaire/offre/:jobId/delegation/view",
      params: z.object({ jobId: zObjectId }).strict(),
      querystring: z.object({ siret_formateur: z.string() }).strict(),
      response: {
        "200": z.object({}),
      },
      securityScheme: {
        auth: "access-token",
        access: "job:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
    },
  },
  delete: {
    "/formulaire/:establishment_id": {
      method: "delete",
      path: "/formulaire/:establishment_id",
      params: z.object({ establishment_id: z.string() }).strict(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "recruiter:manage",
        resources: {
          recruiter: [{ establishment_id: { type: "params", key: "establishment_id" } }],
        },
      },
    },
  },
} as const satisfies IRoutesDef
