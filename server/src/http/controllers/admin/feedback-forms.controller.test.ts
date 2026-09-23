import { createAndLogUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import type { IFeedbackFormInput } from "shared/models/feedback-form.model"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"

const generalInfoOnly: IFeedbackFormInput = {
  slug: "page_entreprise_v1",
  title: "Fiche entreprise — utilité des informations",
  trigger: { minInteractions: 1, scope: ["/formation/:id/:intitule-formation"] },
  questions: [],
}

describe("admin feedback-forms controller", () => {
  useMongo()
  const httpClient = useServer()

  const loginAsAdmin = () => createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })

  const createForm = async (headers: Record<string, string>, body: IFeedbackFormInput = generalInfoOnly) =>
    httpClient().inject({ method: "POST", path: "/api/admin/feedback-forms", headers, body })

  it("refuse la lecture à un utilisateur non admin", async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "userCfa", { type: "CFA" })

    const response = await httpClient().inject({ method: "GET", path: "/api/admin/feedback-forms", headers: bearerToken })

    expect(response.statusCode).toEqual(403)
  })

  it("refuse la création à un utilisateur non admin", async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "userCfa", { type: "CFA" })

    const response = await createForm(bearerToken)

    expect(response.statusCode).toEqual(403)
  })

  it("crée un formulaire en brouillon, en version 1, tracé au nom de l'admin", async () => {
    const { bearerToken, user } = await loginAsAdmin()

    const response = await createForm(bearerToken)

    expect(response.statusCode).toEqual(200)
    expect(response.json()).toMatchObject({
      slug: "page_entreprise_v1",
      title: "Fiche entreprise — utilité des informations",
      status: "draft",
      version: 1,
      created_by: user.email,
    })

    const saved = await getDbCollection("feedback_forms").findOne({ slug: "page_entreprise_v1" })
    expect(saved?.status).toEqual("draft")
    expect(saved?.version).toEqual(1)
    expect(saved?.status_history).toEqual([{ status: "draft", date: expect.any(Date), granted_by: user.email }])
  })

  it("accepte un brouillon sans question ni page de déclenchement", async () => {
    const { bearerToken } = await loginAsAdmin()

    const response = await createForm(bearerToken, { ...generalInfoOnly, trigger: { minInteractions: 1, scope: [] }, questions: [] })

    expect(response.statusCode).toEqual(200)
    expect(response.json()).toMatchObject({ status: "draft", questions: [], trigger: { scope: [] } })
  })

  it("refuse un slug déjà utilisé", async () => {
    const { bearerToken } = await loginAsAdmin()
    await createForm(bearerToken)

    const response = await createForm(bearerToken, { ...generalInfoOnly, title: "Un autre titre" })

    expect(response.statusCode).toEqual(409)
  })

  it("refuse un slug au format invalide", async () => {
    const { bearerToken } = await loginAsAdmin()

    const response = await createForm(bearerToken, { ...generalInfoOnly, slug: "Slug Invalide" })

    expect(response.statusCode).toEqual(400)
  })

  it("refuse un chemin de déclenchement qui ne correspond à aucune page du site", async () => {
    const { bearerToken } = await loginAsAdmin()

    const response = await createForm(bearerToken, { ...generalInfoOnly, trigger: { minInteractions: 1, scope: ["/page-qui-nexiste-pas"] } })

    expect(response.statusCode).toEqual(400)
  })

  it("liste les formulaires du plus récemment modifié au plus ancien, avec leur nombre de réponses", async () => {
    const { bearerToken } = await loginAsAdmin()
    await createForm(bearerToken)
    await createForm(bearerToken, { ...generalInfoOnly, slug: "search_v2_launch", title: "Nouveau moteur de recherche" })

    const response = await httpClient().inject({ method: "GET", path: "/api/admin/feedback-forms", headers: bearerToken })

    expect(response.statusCode).toEqual(200)
    const { forms } = response.json()
    expect(forms.map((form) => form.slug)).toEqual(["search_v2_launch", "page_entreprise_v1"])
    expect(forms.every((form) => form.responses_count === 0)).toBe(true)
  })

  it("filtre la liste par statut", async () => {
    const { bearerToken } = await loginAsAdmin()
    await createForm(bearerToken)

    const drafts = await httpClient().inject({ method: "GET", path: "/api/admin/feedback-forms?status=draft", headers: bearerToken })
    expect(drafts.json().forms).toHaveLength(1)

    const actives = await httpClient().inject({ method: "GET", path: "/api/admin/feedback-forms?status=active", headers: bearerToken })
    expect(actives.json().forms).toHaveLength(0)
  })

  it("renvoie le détail d'un formulaire, et 404 si le slug est inconnu", async () => {
    const { bearerToken } = await loginAsAdmin()
    await createForm(bearerToken)

    const found = await httpClient().inject({ method: "GET", path: "/api/admin/feedback-forms/page_entreprise_v1", headers: bearerToken })
    expect(found.statusCode).toEqual(200)
    expect(found.json()).toMatchObject({ slug: "page_entreprise_v1", responses_count: 0 })

    const missing = await httpClient().inject({ method: "GET", path: "/api/admin/feedback-forms/inconnu", headers: bearerToken })
    expect(missing.statusCode).toEqual(404)
  })

  it("met à jour un brouillon en place, sans changer sa version", async () => {
    const { bearerToken } = await loginAsAdmin()
    await createForm(bearerToken)

    const response = await httpClient().inject({
      method: "PUT",
      path: "/api/admin/feedback-forms/page_entreprise_v1",
      headers: bearerToken,
      body: { title: "Titre corrigé", trigger: { minInteractions: 3, scope: ["/recherche", "/guide-alternant/*"] }, questions: [] },
    })

    expect(response.statusCode).toEqual(200)
    const saved = await getDbCollection("feedback_forms").findOne({ slug: "page_entreprise_v1" })
    expect(saved).toMatchObject({
      title: "Titre corrigé",
      status: "draft",
      version: 1,
      trigger: { minInteractions: 3, scope: ["/recherche", "/guide-alternant/*"] },
    })
  })
})
