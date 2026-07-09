import type { Jsonify } from "type-fest"
import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { ZJobsPartnersOfferPrivate } from "../models/jobsPartners.model.js"

import type { IRoutesDef } from "./common.routes.js"

export const ZLbaCompanyForContactUpdate = z.object({
  siret: z.string().describe("Le Siret de la société"), // use extension.siret
  enseigne: z.string().nullish().describe("Enseigne de l'entreprise"),
  email: z.string().nullish().describe("Adresse email de contact"),
  phone: extensions.phone().nullish().describe("Numéro de téléphone de contact"),
  active: z.boolean().describe("société présente dans recruteurslba ou non"),
})
export type ILbaCompanyForContactUpdate = z.output<typeof ZLbaCompanyForContactUpdate>

export const ZLbaCompanyForAdminSearch = z.object({
  siret: z.string().describe("Le Siret de la société"),
  raison_sociale: z.string().nullish().describe("Raison sociale (workplace_legal_name)"),
  enseigne: z.string().nullish().describe("Enseigne commerciale (workplace_brand)"),
  opco: z.string().nullish().describe("OPCO (workplace_opco)"),
  address: z.string().nullish().describe("Adresse complète (workplace_address_label)"),
  email: z.string().nullish().describe("Adresse email de contact (apply_email)"),
  phone: extensions.phone().nullish().describe("Numéro de téléphone de contact (apply_phone)"),
  created_at: z.coerce.date().nullish().describe("Date de création"),
})
export type ILbaCompanyForAdminSearch = z.output<typeof ZLbaCompanyForAdminSearch>
export type ILbaCompanyForAdminSearchJSON = Jsonify<z.output<typeof ZLbaCompanyForAdminSearch>>

export const LBA_COMPANY_SEARCH_FIELDS = ["workplace_legal_name", "workplace_brand", "apply_email", "apply_phone", "workplace_siret"] as const
export const ZLbaCompanySearchField = z.enum(LBA_COMPANY_SEARCH_FIELDS)
export type ILbaCompanySearchField = z.output<typeof ZLbaCompanySearchField>

export const zUpdateLbaCompanyRoutes = {
  get: {
    "/admin/lba-companies": {
      method: "get",
      path: "/admin/lba-companies",
      querystring: z
        .object({
          search: z.string().min(2),
          field: ZLbaCompanySearchField.default("workplace_legal_name"),
        })
        .strict(),
      response: {
        "200": z.array(ZLbaCompanyForAdminSearch),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
    "/lbacompany/:siret/contactInfo": {
      method: "get",
      path: "/lbacompany/:siret/contactInfo",
      params: z
        .object({
          siret: extensions.siret,
        })
        .strict(),
      response: {
        "200": ZLbaCompanyForContactUpdate,
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },

  put: {
    "/lbacompany/:siret/contactInfo": {
      method: "put",
      path: "/lbacompany/:siret/contactInfo",
      params: z
        .object({
          siret: extensions.siret,
        })
        .strict(),
      body: z.object({
        email: ZJobsPartnersOfferPrivate.shape.apply_email,
        phone: ZJobsPartnersOfferPrivate.shape.apply_phone,
      }),
      response: {
        "200": ZLbaCompanyForContactUpdate,
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
