import { zRoutes } from "shared"

import type { Server } from "@/http/server"
import { getUserFromRequest } from "@/security/authentication.service"
import { eraseRgpdUser, previewRgpdErasure } from "@/services/rgpd-erasure/rgpd-erasure.service"

/** Effacement des données d'un utilisateur à sa demande (RGPD), réservé aux administrateurs. */
export default (server: Server) => {
  server.post(
    "/admin/rgpd/preview",
    {
      schema: zRoutes.post["/admin/rgpd/preview"],
      onRequest: server.auth(zRoutes.post["/admin/rgpd/preview"]),
    },
    async (req, res) => {
      const admin = getUserFromRequest(req, zRoutes.post["/admin/rgpd/preview"]).value
      const { user_type, email, mode } = req.body
      return res.status(200).send(await previewRgpdErasure({ userType: user_type, email, mode, requestedBy: admin._id }))
    }
  )

  server.post(
    "/admin/rgpd/erase",
    {
      schema: zRoutes.post["/admin/rgpd/erase"],
      onRequest: server.auth(zRoutes.post["/admin/rgpd/erase"]),
    },
    async (req, res) => {
      const admin = getUserFromRequest(req, zRoutes.post["/admin/rgpd/erase"]).value
      const { user_type, email, mode, request_ref } = req.body
      const report = await eraseRgpdUser({ userType: user_type, query: { email }, mode, requestRef: request_ref, requestedBy: admin._id })
      return res.status(200).send(report)
    }
  )
}
