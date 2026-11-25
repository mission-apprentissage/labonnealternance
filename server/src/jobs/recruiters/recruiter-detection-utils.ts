import type { ObjectId } from "mongodb"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"

import config from "@/config"
import { API_KEY_CREATION_REASON } from "@/services/auto-validation-reasons"

// Filtre servi par l'index { authorized_type, createdAt } de rolemanagements.
export const getRolesWindowFilter = (from: Date, to: Date) => ({
  authorized_type: { $in: [AccessEntityType.ENTREPRISE, AccessEntityType.CFA] },
  createdAt: { $gte: from, $lt: to },
})

/**
 * Premier et dernier événement d'un historique par date, à date égale dans l'ordre du tableau, comme le tri stable de
 * getLastStatusEvent. `$sortArray` ne garantit pas l'ordre des égalités : au-delà de 16 éléments, il le mélange (mongod 8.3).
 */
export const firstEventOf = (events: string) => ({ $first: { $filter: { input: events, cond: { $eq: ["$$this.date", { $min: `${events}.date` }] } } } })
export const lastEventOf = (events: string) => ({ $last: { $filter: { input: events, cond: { $eq: ["$$this.date", { $max: `${events}.date` }] } } } })

export const lastStatusOf = (events: string) => ({ $getField: { field: "status", input: lastEventOf(events) } })

export const currentStatus = lastStatusOf("$status")

// Même lecture que classifyRole : la première validation automatique, hors création par clé API, qui ne vérifie rien.
export const autoValidatedOf = (events: string) => ({
  $let: {
    vars: {
      grant: {
        $first: {
          $filter: {
            input: events,
            as: "event",
            cond: { $and: [{ $eq: ["$$event.status", AccessStatus.GRANTED] }, { $eq: ["$$event.validation_type", VALIDATION_UTILISATEUR.AUTO] }] },
          },
        },
      },
    },
    in: { $and: [{ $ne: [{ $type: "$$grant" }, "missing"] }, { $ne: ["$$grant.reason", API_KEY_CREATION_REASON] }] },
  },
})

export const autoValidated = autoValidatedOf("$status")

export const formatParisDate = (date: Date | null) => (date ? date.toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" }) : "n/a")

export const formatParisDay = (date: Date) => date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })

export const accountUrl = (id: ObjectId) => `${config.publicUrl}/espace-pro/administration/users/${id.toHexString()}`
