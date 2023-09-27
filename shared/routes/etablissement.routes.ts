import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { ZAppointment, ZEtablissement } from "../models"
import { zObjectId } from "../models/common"

import { IRoutesDef } from "./common.routes"

export const zEtablissementRoutes = {
  get: {
    "/api/admin/etablissements": {
      querystring: z
        .object({
          query: z.string().optional(),
          limit: z.coerce.number().optional().default(50),
          page: z.coerce.number().optional().default(1),
        })
        .strict(),
      response: {
        "2xx": z
          .object({
            etablissements: z.array(ZEtablissement),
            pagination: z.object({
              page: z.number().optional(),
              resultats_par_page: z.number(),
              nombre_de_page: z.number().optional(),
              total: z.number().optional(),
            }),
          })
          .strict(),
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "administrator",
      },
    },
    "/api/admin/etablissements/siret-formateur/:siret": {
      params: z.object({ siret: extensions.siret() }),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "administrator",
      },
    },
    "/api/admin/etablissements/:id": {
      params: z.object({ id: zObjectId }),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "administrator",
      },
    },
    "/api/etablissements/:id": {
      // TODO_SECURITY_FIX faire en sorte qu'il n'y ait pas les adresses emails du catalogue exposées au publlic (définir un ZEtablissementPublic)
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  post: {
    "/api/admin/etablissements": {
      body: z
        .object({
          etablissements: z.array(
            ZEtablissement.pick({
              formateur_siret: true,
              gestionnaire_siret: true,
              raison_sociale: true,
              adresse: true,
              formateur_address: true,
              formateur_zip_code: true,
              formateur_city: true,
              gestionnaire_email: true,
              premium_invitation_date: true,
              premium_activation_date: true,
              premium_refusal_date: true,
              premium_affelnet_invitation_date: true,
              premium_affelnet_activation_date: true,
              premium_affelnet_refusal_date: true,
              optout_invitation_date: true,
              optout_activation_scheduled_date: true,
              optout_activation_date: true,
              optout_refusal_date: true,
              mailing: true,
              last_catalogue_sync_date: true,
              created_at: true,
              affelnet_perimetre: true,
              to_etablissement_emails: true,
            })
          ),
        })
        .strict(),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "administrator",
      },
    },
    "/api/etablissements/:id/premium/affelnet/accept": {
      // TODO_SECURITY_FIX ajouter un jwt
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/etablissements/:id/premium/accept": {
      // TODO_SECURITY_FIX ajouter un jwt
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/etablissements/:id/premium/affelnet/refuse": {
      // TODO_SECURITY_FIX ajouter un jwt
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/etablissements/:id/premium/refuse": {
      // TODO_SECURITY_FIX ajouter un jwt
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/etablissements/:id/opt-out/unsubscribe": {
      // TODO_SECURITY_FIX ajouter un jwt
      params: z.object({ id: zObjectId }).strict(),
      body: z.object({ opt_out_question: z.string() }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  patch: {
    "/api/admin/etablissements/:id": {
      params: z.object({ id: zObjectId }).strict(),
      body: ZEtablissement.pick({
        gestionnaire_email: true,
      }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "administrator",
      },
    },
    "/api/etablissements/:id/appointments/:appointmentId": {
      // TODO_SECURITY_FIX ajouter un jwt
      body: z.object({ has_been_read: z.string() }).strict(),
      params: z.object({ id: zObjectId, appointmentId: zObjectId }).strict(),
      response: {
        "2xx": ZAppointment,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
