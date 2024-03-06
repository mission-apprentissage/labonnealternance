import Boom from "boom"
import { IRoleManagement, IRoleManagementEvent } from "shared/models/roleManagement.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { RoleManagement } from "@/common/model"

export const modifyPermissionToUser = async (
  props: Pick<IRoleManagement, "authorized_id" | "authorized_type" | "user_id" | "origin">,
  eventProps: Pick<IRoleManagementEvent, "reason" | "validation_type" | "granted_by" | "status">
): Promise<IRoleManagement> => {
  const event: IRoleManagementEvent = {
    ...eventProps,
    date: new Date(),
  }
  const { authorized_id, authorized_type, user_id } = props
  const role = await RoleManagement.findOne({ authorized_id, authorized_type, user_id }).lean()
  if (role) {
    const lastEvent = getLastStatusEvent(role.status)
    if (lastEvent?.status === eventProps.status) {
      return role
    }
    const newRole = await RoleManagement.findOneAndUpdate({ _id: role._id }, { $push: { status: event } }, { new: true }).lean()
    if (!newRole) {
      throw Boom.internal("inattendu")
    }
    return newRole
  } else {
    const newRole: Omit<IRoleManagement, "_id" | "updatedAt" | "createdAt"> = {
      ...props,
      status: [event],
    }
    const role = await RoleManagement.create(newRole)
    return role
  }
}
