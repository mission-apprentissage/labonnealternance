import { forbidden } from "boom"
import { FastifyRequest } from "fastify"

import { IRole, ROLES } from "@/services/constant.service"

export function permissionsMiddleware(role: IRole) {
  return async (req: FastifyRequest) => {
    if (!req.user) {
      throw forbidden()
    }
    if (!("role" in req.user)) {
      throw forbidden()
    }
    if (req.user.role !== role) {
      throw forbidden()
    }
  }
}

export const administratorOnly = permissionsMiddleware(ROLES.administrator)
