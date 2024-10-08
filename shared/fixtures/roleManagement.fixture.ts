import { ObjectId } from "mongodb"

import { VALIDATION_UTILISATEUR } from "../constants"
import { AccessEntityType, AccessStatus, IRoleManagement, IRoleManagementEvent } from "../models"

export const generateRoleManagementStatusEventFixture = (props: Partial<IRoleManagementEvent> = {}): IRoleManagementEvent => {
  return {
    date: new Date(),
    reason: "reason",
    status: AccessStatus.GRANTED,
    validation_type: VALIDATION_UTILISATEUR.AUTO,
    ...props,
  }
}

export const generateRoleManagementFixture = (props: Partial<IRoleManagement> = {}): IRoleManagement => {
  const now = new Date()
  return {
    _id: new ObjectId(),
    authorized_id: "noid",
    authorized_type: AccessEntityType.ENTREPRISE,
    createdAt: now,
    updatedAt: now,
    origin: "fixture",
    status: [generateRoleManagementStatusEventFixture()],
    user_id: new ObjectId(),
    ...props,
  }
}
