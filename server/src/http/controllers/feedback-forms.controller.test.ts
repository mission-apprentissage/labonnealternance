import { createAndLogUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import type { IFeedbackFormInput } from "shared/models/feedback-form.model"
import { describe, expect, it } from "vitest"

const form = (slug: string, scope: string[]): IFeedbackFormInput => ({
  slug,
  title: `Titre interne ${slug}`,
  trigger: { minInteractions: 2, scope },
  questions: [{ id: "q1", type: "rating", label: "Utile ?", required: true, scale: "thumbs3" }],
})

describe("public feedback-forms controller", () => {
  useMongo()
  const httpClient = useServer()

  const setup = async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })
    const create = (body: IFeedbackFormInput) => httpClient().inject({ method: "POST", path: "/api/admin/feedback-forms", headers: bearerToken, body })
    const activate = (slug: string) => httpClient().inject({ method: "POST", path: `/api/admin/feedback-forms/${slug}/activate`, headers: bearerToken })
    return { create, activate }
  }

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
          version: 1,
          trigger: { minInteractions: 2, scope: ["/recherche"] },
          questions: [{ id: "q1", type: "rating", label: "Utile ?", required: true, scale: "thumbs3" }],
        },
      ],
    })
  })

  it("renvoie une liste vide sans formulaire actif", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/feedback-forms/active" })

    expect(response.statusCode).toEqual(200)
    expect(response.json()).toEqual({ forms: [] })
  })
})
