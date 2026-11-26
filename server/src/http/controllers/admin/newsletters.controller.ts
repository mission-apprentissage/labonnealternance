import { zRoutes } from "shared"

import type { Server } from "@/http/server"
import { getUserFromRequest } from "@/security/authentication.service"
import { createNewsletter, deleteNewsletter, getNewsletter, listNewslettersForAdmin, updateNewsletter } from "@/services/newsletter.service"

export default (server: Server) => {
  server.get(
    "/admin/newsletters",
    {
      schema: zRoutes.get["/admin/newsletters"],
      onRequest: server.auth(zRoutes.get["/admin/newsletters"]),
    },
    async (_req, res) => {
      const newsletters = await listNewslettersForAdmin()
      return res.status(200).send({ newsletters })
    }
  )

  server.get(
    "/admin/newsletters/:id",
    {
      schema: zRoutes.get["/admin/newsletters/:id"],
      onRequest: server.auth(zRoutes.get["/admin/newsletters/:id"]),
    },
    async (req, res) => {
      const newsletter = await getNewsletter(req.params.id)
      return res.status(200).send(newsletter)
    }
  )

  server.post(
    "/admin/newsletters",
    {
      schema: zRoutes.post["/admin/newsletters"],
      onRequest: server.auth(zRoutes.post["/admin/newsletters"]),
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.post["/admin/newsletters"]).value
      const newsletter = await createNewsletter(req.body, user.email)
      return res.status(200).send(newsletter)
    }
  )

  server.put(
    "/admin/newsletters/:id",
    {
      schema: zRoutes.put["/admin/newsletters/:id"],
      onRequest: server.auth(zRoutes.put["/admin/newsletters/:id"]),
    },
    async (req, res) => {
      const newsletter = await updateNewsletter(req.params.id, req.body)
      return res.status(200).send(newsletter)
    }
  )

  server.delete(
    "/admin/newsletters/:id",
    {
      schema: zRoutes.delete["/admin/newsletters/:id"],
      onRequest: server.auth(zRoutes.delete["/admin/newsletters/:id"]),
    },
    async (req, res) => {
      await deleteNewsletter(req.params.id)
      return res.status(200).send({})
    }
  )
}
