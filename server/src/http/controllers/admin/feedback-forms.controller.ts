import { zRoutes } from "shared"

import type { Server } from "@/http/server"
import { getUserFromRequest } from "@/security/authentication.service"
import {
  archiveFeedbackForm,
  createFeedbackForm,
  deleteFeedbackForm,
  getFeedbackFormForAdmin,
  listFeedbackFormsForAdmin,
  updateFeedbackForm,
} from "@/services/feedback-form.service"

export default (server: Server) => {
  server.get(
    "/admin/feedback-forms",
    {
      schema: zRoutes.get["/admin/feedback-forms"],
      onRequest: server.auth(zRoutes.get["/admin/feedback-forms"]),
    },
    async (req, res) => {
      const forms = await listFeedbackFormsForAdmin(req.query.status)
      return res.status(200).send({ forms })
    }
  )

  server.get(
    "/admin/feedback-forms/:slug",
    {
      schema: zRoutes.get["/admin/feedback-forms/:slug"],
      onRequest: server.auth(zRoutes.get["/admin/feedback-forms/:slug"]),
    },
    async (req, res) => {
      const form = await getFeedbackFormForAdmin(req.params.slug)
      return res.status(200).send(form)
    }
  )

  server.post(
    "/admin/feedback-forms",
    {
      schema: zRoutes.post["/admin/feedback-forms"],
      onRequest: server.auth(zRoutes.post["/admin/feedback-forms"]),
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.post["/admin/feedback-forms"]).value
      const form = await createFeedbackForm(req.body, user.email)
      return res.status(200).send(form)
    }
  )

  server.post(
    "/admin/feedback-forms/:slug/archive",
    {
      schema: zRoutes.post["/admin/feedback-forms/:slug/archive"],
      onRequest: server.auth(zRoutes.post["/admin/feedback-forms/:slug/archive"]),
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.post["/admin/feedback-forms/:slug/archive"]).value
      await archiveFeedbackForm(req.params.slug, user.email)
      return res.status(200).send({})
    }
  )

  server.put(
    "/admin/feedback-forms/:slug",
    {
      schema: zRoutes.put["/admin/feedback-forms/:slug"],
      onRequest: server.auth(zRoutes.put["/admin/feedback-forms/:slug"]),
    },
    async (req, res) => {
      const form = await updateFeedbackForm(req.params.slug, req.body)
      return res.status(200).send(form)
    }
  )

  server.delete(
    "/admin/feedback-forms/:slug",
    {
      schema: zRoutes.delete["/admin/feedback-forms/:slug"],
      onRequest: server.auth(zRoutes.delete["/admin/feedback-forms/:slug"]),
    },
    async (req, res) => {
      await deleteFeedbackForm(req.params.slug)
      return res.status(200).send({})
    }
  )
}
