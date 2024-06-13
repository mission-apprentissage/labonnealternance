import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export enum ERecruteurLbaUpdateEventType {
  DELETE_PHONE = "DELETE_PHONE",
  DELETE_EMAIL = "DELETE_EMAIL",
  UPDATE_PHONE = "UPDATE_PHONE",
  UPDATE_EMAIL = "UPDATE_EMAIL",
}

export const ZRecruteurLbaUpdateEvent = z
  .object({
    siret: z.string().describe("Le Siret de la société"),
    event: z.enum([Object.values(ERecruteurLbaUpdateEventType)[0], ...Object.values(ERecruteurLbaUpdateEventType).slice(1)]).describe("Le type d'événement"),
    value: z.string().describe("La nouvelle valeur"),
    created_at: z.date().describe("La date création de la demande"),
    _id: zObjectId,
  })
  .strict()

export const ZRecruteurLbaUpdateEventNew = ZRecruteurLbaUpdateEvent.omit({
  _id: true,
  created_at: true,
}).strict()

export type IRecruteurLbaUpdateEvent = z.output<typeof ZRecruteurLbaUpdateEvent>
export type IRecruteurLbaUpdateEventNew = z.output<typeof ZRecruteurLbaUpdateEventNew>
