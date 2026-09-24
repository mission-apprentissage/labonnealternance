import { createAndLogUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import type { IFeedbackFormInput } from "shared/models/feedback-form.model"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"

const form = (
  slug: string,
  scope: string[],
  questions: IFeedbackFormInput["questions"] = [{ id: "q1", type: "rating", label: "Utile ?", required: true, scale: "thumbs3" }]
): IFeedbackFormInput => ({
  slug,
  title: `Titre interne ${slug}`,
  trigger: { minInteractions: 2, scope },
  questions,
})

const questions: IFeedbackFormInput["questions"] = [
  { id: "q1", type: "rating", label: "Utile ?", required: true, scale: "thumbs3" },
  {
    id: "q2",
    type: "multi_select",
    label: "Quels filtres ?",
    required: false,
    maxSelections: 2,
    options: [
      { value: "contrat", label: "Contrat" },
      { value: "niveau", label: "Niveau" },
      { value: "date", label: "Date" },
    ],
  },
  { id: "q3", type: "text", label: "Pourquoi ?", required: true, maxLength: 20, showIf: { questionId: "q1", equals: "negative" } },
]

const context = { page: "/formation/:id/:intitule-formation", path_params: { id: "123", "intitule-formation": "cap-cuisine" }, query: { utm_source: "newsletter" } }

describe("public feedback-forms controller", () => {
  useMongo()
  const httpClient = useServer()

  const setup = async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })
    const create = (body: IFeedbackFormInput) => httpClient().inject({ method: "POST", path: "/api/admin/feedback-forms", headers: bearerToken, body })
    const activate = (slug: string) => httpClient().inject({ method: "POST", path: `/api/admin/feedback-forms/${slug}/activate`, headers: bearerToken })
    return { create, activate }
  }

  const display = (slug: string, body: object = context) => httpClient().inject({ method: "POST", path: `/api/feedback-forms/${slug}/displays`, body })
  const start = (slug: string, display_id: string) => httpClient().inject({ method: "POST", path: `/api/feedback-forms/${slug}/responses`, body: { display_id } })
  const progress = (id: string, body: object) => httpClient().inject({ method: "PUT", path: `/api/feedback-responses/${id}`, body })

  const openResponse = async () => {
    const { create, activate } = await setup()
    await create(form("formation", ["/formation/:id/:intitule-formation"], questions))
    await activate("formation")
    const { display_id } = (await display("formation")).json()
    return (await start("formation", display_id)).json() as { response_id: string; token: string }
  }

  describe("formulaires actifs", () => {
    it("ne renvoie que les formulaires actifs, sans les champs internes, sans authentification", async () => {
      const { create, activate } = await setup()
      await create(form("recherche", ["/recherche"]))
      await activate("recherche")
      await create(form("brouillon", ["/formation/:id/:intitule-formation"]))

      const response = await httpClient().inject({ method: "GET", path: "/api/feedback-forms/active" })

      expect(response.statusCode).toEqual(200)
      expect(response.headers["cache-control"]).toEqual("public, max-age=60")
      expect(response.json()).toEqual({
        forms: [
          {
            slug: "recherche",
            trigger: { minInteractions: 2, scope: ["/recherche"] },
            questions: [{ id: "q1", type: "rating", label: "Utile ?", required: true, scale: "thumbs3" }],
          },
        ],
      })
    })

    it("renvoie une liste vide sans formulaire actif", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/feedback-forms/active" })

      expect(response.json()).toEqual({ forms: [] })
    })
  })

  describe("affichages", () => {
    it("enregistre l'affichage avec son contexte filtré et incrémente le compteur du jour", async () => {
      const { create, activate } = await setup()
      await create(form("formation", ["/formation/:id/:intitule-formation"]))
      await activate("formation")

      const first = await display("formation", {
        ...context,
        path_params: { ...context.path_params, intrus: "x" },
        query: { utm_source: "newsletter", token: "secret", contact: "a@b.fr" },
      })
      await display("formation")

      expect(first.statusCode).toEqual(200)
      const saved = await getDbCollection("feedback_displays").findOne({ form_slug: "formation" })
      expect(saved).toMatchObject({ page: context.page, path_params: context.path_params, query: { utm_source: "newsletter" } })
      const counts = await getDbCollection("feedback_display_counts").find({ form_slug: "formation" }).toArray()
      expect(counts).toEqual([{ _id: expect.anything(), form_slug: "formation", day: new Date().toISOString().slice(0, 10), displays: 2 }])
    })

    it("refuse une page qui ne déclenche pas le formulaire, et un formulaire qui n'est pas actif", async () => {
      const { create, activate } = await setup()
      await create(form("formation", ["/formation/:id/:intitule-formation"]))

      expect((await display("formation")).statusCode).toEqual(404)
      await activate("formation")
      expect((await display("formation", { ...context, page: "/recherche" })).statusCode).toEqual(400)
    })
  })

  describe("parcours", () => {
    it("ouvre un parcours qui reprend le contexte de l'affichage", async () => {
      const { response_id, token } = await openResponse()

      const saved = await getDbCollection("feedback_responses").findOne({})
      expect(saved).toMatchObject({
        form_slug: "formation",
        page: context.page,
        path_params: context.path_params,
        query: context.query,
        status: "in_progress",
        answers: [],
        skipped: [],
      })
      expect(saved?._id.toString()).toEqual(response_id)
      expect(saved?.token).toEqual(token)
    })

    it("enregistre l'état du parcours et le termine quand plus rien n'est à poser", async () => {
      const { response_id, token } = await openResponse()

      const partial = await progress(response_id, { token, answers: [{ question_id: "q1", choices: ["negative"] }], skipped: [] })
      expect(partial.json()).toEqual({ status: "in_progress" })

      const done = await progress(response_id, {
        token,
        answers: [
          { question_id: "q1", choices: ["negative"] },
          { question_id: "q3", text: "Trop lent" },
        ],
        skipped: ["q2"],
      })
      expect(done.json()).toEqual({ status: "completed" })
      const saved = await getDbCollection("feedback_responses").findOne({})
      expect(saved).toMatchObject({ status: "completed", skipped: ["q2"], completed_at: expect.any(Date) })
    })

    it("termine sans la question conditionnelle quand sa condition n'est pas remplie", async () => {
      const { response_id, token } = await openResponse()

      const done = await progress(response_id, {
        token,
        answers: [
          { question_id: "q1", choices: ["positive"] },
          { question_id: "q2", choices: ["contrat", "date"] },
        ],
        skipped: [],
      })

      expect(done.json()).toEqual({ status: "completed" })
    })

    it.each([
      ["une option inconnue", { answers: [{ question_id: "q1", choices: ["excellent"] }], skipped: [] }],
      [
        "trop de choix",
        {
          answers: [
            { question_id: "q1", choices: ["positive"] },
            { question_id: "q2", choices: ["contrat", "niveau", "date"] },
          ],
          skipped: [],
        },
      ],
      ["une question obligatoire passée", { answers: [], skipped: ["q1"] }],
      [
        "une question dont la condition n'est pas remplie",
        {
          answers: [
            { question_id: "q1", choices: ["positive"] },
            { question_id: "q3", text: "Tiens" },
          ],
          skipped: [],
        },
      ],
      [
        "un texte trop long",
        {
          answers: [
            { question_id: "q1", choices: ["negative"] },
            { question_id: "q3", text: "x".repeat(21) },
          ],
          skipped: [],
        },
      ],
      ["une question inconnue", { answers: [{ question_id: "q9", choices: ["positive"] }], skipped: [] }],
    ])("refuse %s", async (_label, body) => {
      const { response_id, token } = await openResponse()

      const response = await progress(response_id, { token, ...body })

      expect(response.statusCode).toEqual(400)
    })

    it("répond 404 à un mauvais jeton comme à un parcours inconnu", async () => {
      const { response_id } = await openResponse()

      expect((await progress(response_id, { token: "faux", answers: [], skipped: [] })).statusCode).toEqual(404)
      expect((await progress("inconnu", { token: "faux", answers: [], skipped: [] })).statusCode).toEqual(404)
    })
  })
})
