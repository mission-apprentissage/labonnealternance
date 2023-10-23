import { z } from "../helpers/zodWithOpenApi"
import { zObjectId } from "../models/common"
import { ZJob, ZJobWrite } from "../models/job.model"
import { ZRecruiter, ZRecruiterWritable } from "../models/recruiter.model"

import { IRoutesDef } from "./common.routes"

export const zFormulaireRoute = {
  get: {
    "/formulaire/:establishment_id": {
      method: "get",
      path: "/formulaire/:establishment_id",
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      params: z.object({ establishment_id: z.string() }).strict(),
      response: {
        // TODO ANY TO BE FIXED
        "200": z.any(),
        // "2xx": ZRecruiter,
      },
      securityScheme: null,
    },
    "/formulaire/offre/f/:jobId": {
      method: "get",
      path: "/formulaire/offre/f/:jobId",
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      // TODO_SECURITY_FIX faire un ZJobPublic sans la partie delegations
      params: z.object({ jobId: zObjectId }).strict(),
      response: {
        // TODO ANY TO BE FIXED
        // "200": z.any(),
        "2xx": ZJob,
      },
      securityScheme: null,
    },
  },
  post: {
    "/formulaire": {
      method: "post",
      path: "/formulaire",
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      body: z
        .object({
          userRecruteurId: zObjectId,
          establishment_siret: z.string(),
          email: z.string(),
          last_name: z.string(),
          first_name: z.string(),
          phone: z.string(),
          opco: z.string().optional(),
          idcc: z.string().nullish().optional(),
        })
        .strict(),
      response: {
        // TODO ANY TO BE FIXED
        // "2xx": ZRecruiter,
        "2xx": z.any(),
      },
      securityScheme: null,
    },
    "/formulaire/:establishment_id/offre": {
      method: "post",
      path: "/formulaire/:establishment_id/offre",
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX limiter les champs autorisés à la modification. Utiliser un "ZRecruiterNew" (ou un autre nom du genre ZFormulaire)
      params: z.object({ establishment_id: z.string() }).strict(),
      // TODO nonstrict TO BE FIXED on the frontend
      body: ZJobWrite.nonstrict(),
      response: {
        // TODO ANY TO BE FIXED
        // "2xx": ZRecruiter,
        "200": z.any(),
      },
      securityScheme: null,
    },
    "/formulaire/offre/:jobId/delegation": {
      method: "post",
      path: "/formulaire/offre/:jobId/delegation",
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      params: z.object({ jobId: zObjectId }).strict(),
      body: z
        .object({
          etablissementCatalogueIds: z.array(z.string()),
        })
        .strict(),
      response: {
        // TODO ANY TO BE FIXED
        "2xx": z.any(),
        // "2xx": ZRecruiter,
      },
      securityScheme: null,
    },
  },
  put: {
    "/formulaire/:establishment_id": {
      method: "put",
      path: "/formulaire/:establishment_id",
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX réduire aux champs modifiables
      params: z.object({ establishment_id: z.string() }).strict(),
      body: ZRecruiterWritable.partial(),
      response: {
        // TODO ANY TO BE FIXED
        "2xx": z.any(),
        // "2xx": ZRecruiter,
      },
      securityScheme: {
        auth: "cookie-session",
        access: "recruiter:manage",
        ressources: {
          recruiter: [{ establishment_id: { type: "params", key: "establishment_id" } }],
        },
      },
    },
    "/formulaire/offre/:jobId": {
      method: "put",
      path: "/formulaire/offre/:jobId",
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      params: z.object({ jobId: zObjectId }).strict(),
      body: ZJob.pick({
        rome_label: true,
        rome_appellation_label: true,
        rome_code: true,
        job_level_label: true,
        job_description: true,
        job_status: true,
        job_type: true,
        is_multi_published: true,
        delegations: true,
        rome_detail: true,
        is_disabled_elligible: true,
        job_count: true,
        job_duration: true,
        job_rythm: true,
      }).extend({
        job_start_date: z.coerce.date(),
        job_update_date: z.coerce.date(),
        job_creation_date: z.coerce.date(),
        job_expiration_date: z.coerce.date(),
      }),
      response: {
        "2xx": ZRecruiter,
      },
      securityScheme: null,
    },
    "/formulaire/offre/:jobId/cancel": {
      method: "put",
      path: "/formulaire/offre/:jobId/cancel",
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      // TODO_SECURITY_FIX Scinder les routes pour cancel depuis admin OU cancel depuis CTA dans un email (avec jwt)
      params: z.object({ jobId: zObjectId }).strict(),
      response: {
        "2xx": z.object({}).strict(),
      },
      securityScheme: null,
    },
    "/formulaire/offre/f/:jobId/cancel": {
      method: "put",
      path: "/formulaire/offre/f/:jobId/cancel",
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      // TODO_SECURITY_FIX Scinder les routes pour cancel depuis admin OU cancel depuis CTA dans un email (avec jwt)
      params: z.object({ jobId: zObjectId }).strict(),
      body: z
        .object({
          job_status: z.string(),
          job_status_comment: z.string(),
        })
        .strict(),
      response: {
        "2xx": z.object({}).strict(),
      },
      securityScheme: null,
    },
    "/formulaire/offre/:jobId/provided": {
      method: "put",
      path: "/formulaire/offre/:jobId/provided",
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      // TODO_SECURITY_FIX Scinder les routes pour cancel depuis admin OU cancel depuis CTA dans un email (avec jwt)
      params: z.object({ jobId: zObjectId }).strict(),
      response: {
        "2xx": z.object({}).strict(),
      },
      securityScheme: null,
    },
    "/formulaire/offre/:jobId/extend": {
      method: "put",
      path: "/formulaire/offre/:jobId/extend",
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      // TODO_SECURITY_FIX Scinder les routes pour cancel depuis admin OU cancel depuis CTA dans un email (avec jwt)
      params: z.object({ jobId: zObjectId }).strict(),
      response: {
        "200": ZJob.strict(),
      },
      securityScheme: null,
    },
  },
  patch: {
    // KBA 20230922 to be checked, description is false and it only updates delegations
    // TODO_SECURITY_FIX gestion des permissions
    // TODO_SECURITY_FIX session gérée par cookie server
    // TODO_PAS_SECURITY faut la corriger cette route !!!!! (un certain "KB" circa 2023)
    "/formulaire/offre/:jobId": {
      method: "patch",
      path: "/formulaire/offre/:jobId",
      params: z.object({ jobId: zObjectId }).strict(),
      querystring: z.object({ siret_formateur: z.string() }).strict(),
      body: z.object({ cfa_read_company_detail_at: z.string() }).strict(),
      response: {
        "2xx": ZJob.nullable(),
      },
      securityScheme: null,
    },
  },
  delete: {
    "/formulaire/:establishment_id": {
      method: "delete",
      path: "/formulaire/:establishment_id",
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      params: z.object({ establishment_id: z.string() }).strict(),
      response: {
        "2xx": z.object({}).strict(),
      },
      securityScheme: null,
    },
    "/formulaire/delegated/:establishment_siret": {
      method: "delete",
      path: "/formulaire/delegated/:establishment_siret",
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      params: z.object({ establishment_siret: z.string() }).strict(),
      response: {
        "2xx": z.object({}).strict(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
