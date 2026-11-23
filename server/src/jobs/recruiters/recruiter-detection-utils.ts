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

// Statut courant : le dernier événement par date, cf. getLastStatusEvent.
export const lastStatusOf = (events: string) => ({ $getField: { field: "status", input: { $last: { $sortArray: { input: events, sortBy: { date: 1 } } } } } })

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

export const accountUrl = (id: ObjectId) => `${config.publicUrl}/espace-pro/administration/users/${id.toHexString()}`
