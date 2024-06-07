import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export enum ELbaCompanyUpdateEventType {
  DELETE_PHONE = "DELETE_PHONE",
  DELETE_EMAIL = "DELETE_EMAIL",
  UPDATE_PHONE = "UPDATE_PHONE",
  UPDATE_EMAIL = "UPDATE_EMAIL",
}

export const ZLbaCompanyUpdateEvent = z
  .object({
    siret: z.string().describe("Le Siret de la société"),
    event: z.enum([Object.values(ELbaCompanyUpdateEventType)[0], ...Object.values(ELbaCompanyUpdateEventType).slice(1)]).describe("Le type d'événement"),
    value: z.string().describe("La nouvelle valeur"),
    created_at: z.date().describe("La date création de la demande"),
    _id: zObjectId,
  })
  .strict()

export const ZLbaCompanyUpdateEventNew = ZLbaCompanyUpdateEvent.omit({
  _id: true,
  created_at: true,
}).strict()

export type ILbaCompanyUpdateEvent = z.output<typeof ZLbaCompanyUpdateEvent>
export type ILbaCompanyUpdateEventNew = z.output<typeof ZLbaCompanyUpdateEventNew>
