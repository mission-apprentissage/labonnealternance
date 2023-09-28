import { z } from "zod"

import { zObjectId } from "../models/common"
import { ZJob } from "../models/job.model"
import { ZRecruiter } from "../models/recruiter.model"

import { IRoutesDef } from "./common.routes"

export const zFormulaireRoute = {
  get: {
    "/api/formulaire/:establishment_id": {
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      params: z.object({ establishment_id: z.string() }).strict(),
      response: {
        // TODO ANY TO BE FIXED
        "200": z.any(),
        // "2xx": ZRecruiter,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/formulaire/offre/f/:jobId": {
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      // TODO_SECURITY_FIX faire un ZJobPublic sans la partie delegations
      params: z.object({ jobId: zObjectId }).strict(),
      response: {
        // TODO ANY TO BE FIXED
        // "200": z.any(),
        "2xx": ZJob,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  post: {
    "/api/formulaire": {
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
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/formulaire/:establishment_id/offre": {
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      // TODO_SECURITY_FIX limiter les champs autorisés à la modification. Utiliser un "ZRecruiterNew" (ou un autre nom du genre ZFormulaire)
      params: z.object({ establishment_id: z.string() }).strict(),
      // TODO ANY TO BE FIXED
      // body: ZJobWithoutId,
      body: z.any(),
      response: {
        // TODO ANY TO BE FIXED
        // "2xx": ZRecruiter,
        "2xx": z.any(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/formulaire/offre/:jobId/delegation": {
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      params: z.object({ jobId: z.string() }).strict(),
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
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  put: {
    "/api/formulaire/:establishment_id": {
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      // TODO_SECURITY_FIX réduire aux champs modifiables
      params: z.object({ establishment_id: z.string() }).strict(),
      body: ZRecruiter.partial(),
      response: {
        // TODO ANY TO BE FIXED
        "2xx": z.any(),
        // "2xx": ZRecruiter,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/formulaire/offre/:jobId": {
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
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/formulaire/offre/:jobId/cancel": {
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      // TODO_SECURITY_FIX Scinder les routes pour cancel depuis admin OU cancel depuis CTA dans un email (avec jwt)
      params: z.object({ jobId: zObjectId }).strict(),
      response: {
        "2xx": z.undefined(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/formulaire/offre/:jobId/provided": {
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      // TODO_SECURITY_FIX Scinder les routes pour cancel depuis admin OU cancel depuis CTA dans un email (avec jwt)
      params: z.object({ jobId: zObjectId }).strict(),
      response: {
        "2xx": z.undefined(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  patch: {
    // KBA 20230922 to be checked, description is false and it only updates delegations
    // TODO_SECURITY_FIX gestion des permissions
    // TODO_SECURITY_FIX session gérée par cookie server
    // TODO_PAS_SECURITY faut la corriger cette route !!!!! (un certain "KB" circa 2023)
    "/api/formulaire/offre/:jobId": {
      params: z.object({ jobId: zObjectId }).strict(),
      querystring: z.object({ siret_formateur: z.string() }).strict(),
      body: z.object({ cfa_read_company_detail_at: z.date() }).strict(),
      response: {
        "2xx": z.union([ZJob, z.null()]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  delete: {
    "/api/formulaire/:establishment_id": {
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      params: z.object({ establishment_id: z.string() }).strict(),
      response: {
        "2xx": z.undefined(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/formulaire/delegated/:establishment_siret": {
      // TODO_SECURITY_FIX gestion des permissions
      // TODO_SECURITY_FIX session gérée par cookie server
      params: z.object({ establishment_siret: z.string() }).strict(),
      response: {
        "2xx": z.undefined(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
