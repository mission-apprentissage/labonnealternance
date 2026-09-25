import { createAndLogUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import type { IFeedbackFormInput } from "shared/models/feedback-form.model"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"

const generalInfoOnly: IFeedbackFormInput = {
  slug: "page_entreprise_v1",
  title: "Fiche entreprise — utilité des informations",
  trigger: { type: "interactions", minInteractions: 1, scope: ["/formation/:id/:intitule-formation"] },
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

  it("lit un formulaire qui porte un champ retiré du modèle, sans le renvoyer", async () => {
    const { bearerToken } = await loginAsAdmin()
    await createForm(bearerToken)
    await getDbCollection("feedback_forms").updateOne({ slug: "page_entreprise_v1" }, { $set: { version: 1 } as object })

    const response = await httpClient().inject({ method: "GET", path: "/api/admin/feedback-forms", headers: bearerToken })

    expect(response.statusCode).toEqual(200)
    expect(response.json().forms[0].slug).toEqual("page_entreprise_v1")
    expect(response.json().forms[0]).not.toHaveProperty("version")
  })

  it("refuse la création à un utilisateur non admin", async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "userCfa", { type: "CFA" })

    const response = await createForm(bearerToken)

    expect(response.statusCode).toEqual(403)
  })

  it("crée un formulaire en brouillon, tracé au nom de l'admin", async () => {
    const { bearerToken, user } = await loginAsAdmin()

    const response = await createForm(bearerToken)

    expect(response.statusCode).toEqual(200)
    expect(response.json()).toMatchObject({
      slug: "page_entreprise_v1",
      title: "Fiche entreprise — utilité des informations",
      status: "draft",
      created_by: user.email,
    })

    const saved = await getDbCollection("feedback_forms").findOne({ slug: "page_entreprise_v1" })
    expect(saved?.status).toEqual("draft")
    expect(saved?.status_history).toEqual([{ status: "draft", date: expect.any(Date), granted_by: user.email }])
  })

  it("accepte un brouillon sans question", async () => {
    const { bearerToken } = await loginAsAdmin()

    const response = await createForm(bearerToken, { ...generalInfoOnly, questions: [] })

    expect(response.statusCode).toEqual(200)
    expect(response.json()).toMatchObject({ status: "draft", questions: [] })
  })

  it("refuse un formulaire sans page de déclenchement", async () => {
    const { bearerToken } = await loginAsAdmin()

    const response = await createForm(bearerToken, { ...generalInfoOnly, trigger: { type: "interactions", minInteractions: 1, scope: [] } })

    expect(response.statusCode).toEqual(400)
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

    const response = await createForm(bearerToken, { ...generalInfoOnly, trigger: { type: "interactions", minInteractions: 1, scope: ["/page-qui-nexiste-pas"] } })

    expect(response.statusCode).toEqual(400)
  })

  it("enregistre les questions de chaque type", async () => {
    const { bearerToken } = await loginAsAdmin()
    const questions: IFeedbackFormInput["questions"] = [
      { id: "q1", type: "rating", label: "Ces informations vous ont-elles été utiles ?", required: true, scale: "thumbs3" },
      {
        id: "q2",
        type: "multi_select",
        label: "Quelles informations vous ont manqué ?",
        required: false,
        options: [
          { value: "contact_recruteur", label: "Contact recruteur" },
          { value: "offres_en_cours", label: "Offres en cours" },
        ],
      },
      { id: "q3", type: "text", label: "Un commentaire ?", required: false, maxLength: 500 },
    ]

    const response = await createForm(bearerToken, { ...generalInfoOnly, questions })

    expect(response.statusCode).toEqual(200)
    const saved = await getDbCollection("feedback_forms").findOne({ slug: "page_entreprise_v1" })
    expect(saved?.questions).toMatchObject(questions)
  })

  it("refuse une question sans libellé", async () => {
    const { bearerToken } = await loginAsAdmin()

    const response = await createForm(bearerToken, { ...generalInfoOnly, questions: [{ id: "q1", type: "rating", label: "", required: false, scale: "thumbs3" }] })

    expect(response.statusCode).toEqual(400)
  })

  it("refuse deux options indiscernables dans les réponses", async () => {
    const { bearerToken } = await loginAsAdmin()
    const options = [
      { value: "contact", label: "Contact" },
      { value: "contact", label: "contact" },
    ]

    const response = await createForm(bearerToken, { ...generalInfoOnly, questions: [{ id: "q1", type: "single_select", label: "Pourquoi ?", required: false, options }] })

    expect(response.statusCode).toEqual(400)
  })

  it("refuse deux questions portant le même identifiant", async () => {
    const { bearerToken } = await loginAsAdmin()
    const question = { id: "q1", type: "rating" as const, label: "Utile ?", required: false, scale: "thumbs3" as const }

    const response = await createForm(bearerToken, { ...generalInfoOnly, questions: [question, { ...question, label: "Autre" }] })

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

    const several = await httpClient().inject({ method: "GET", path: "/api/admin/feedback-forms?status=draft&status=active", headers: bearerToken })
    expect(several.json().forms).toHaveLength(1)
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

  it("met à jour un brouillon en place", async () => {
    const { bearerToken } = await loginAsAdmin()
    await createForm(bearerToken)

    const response = await httpClient().inject({
      method: "PUT",
      path: "/api/admin/feedback-forms/page_entreprise_v1",
      headers: bearerToken,
      body: { title: "Titre corrigé", trigger: { type: "interactions", minInteractions: 3, scope: ["/recherche", "/guide-alternant/*"] }, questions: [] },
    })

    expect(response.statusCode).toEqual(200)
    const saved = await getDbCollection("feedback_forms").findOne({ slug: "page_entreprise_v1" })
    expect(saved).toMatchObject({
      title: "Titre corrigé",
      status: "draft",
      trigger: { type: "interactions", minInteractions: 3, scope: ["/recherche", "/guide-alternant/*"] },
    })
  })

  it("supprime un brouillon", async () => {
    const { bearerToken } = await loginAsAdmin()
    await createForm(bearerToken)

    const response = await httpClient().inject({ method: "DELETE", path: "/api/admin/feedback-forms/page_entreprise_v1", headers: bearerToken })

    expect(response.statusCode).toEqual(200)
    expect(await getDbCollection("feedback_forms").countDocuments({ slug: "page_entreprise_v1" })).toEqual(0)
  })

  it("supprime un formulaire archivé", async () => {
    const { bearerToken } = await loginAsAdmin()
    await createForm(bearerToken)
    await getDbCollection("feedback_forms").updateOne({ slug: "page_entreprise_v1" }, { $set: { status: "archived" } })

    const response = await httpClient().inject({ method: "DELETE", path: "/api/admin/feedback-forms/page_entreprise_v1", headers: bearerToken })

    expect(response.statusCode).toEqual(200)
    expect(await getDbCollection("feedback_forms").countDocuments({ slug: "page_entreprise_v1" })).toEqual(0)
  })

  it("refuse de supprimer un formulaire actif", async () => {
    const { bearerToken } = await loginAsAdmin()
    await createForm(bearerToken)
    await getDbCollection("feedback_forms").updateOne({ slug: "page_entreprise_v1" }, { $set: { status: "active" } })

    const response = await httpClient().inject({ method: "DELETE", path: "/api/admin/feedback-forms/page_entreprise_v1", headers: bearerToken })

    expect(response.statusCode).toEqual(409)
    expect(await getDbCollection("feedback_forms").countDocuments({ slug: "page_entreprise_v1" })).toEqual(1)
  })

  it("renvoie 404 à la suppression d'un formulaire inconnu", async () => {
    const { bearerToken } = await loginAsAdmin()

    const response = await httpClient().inject({ method: "DELETE", path: "/api/admin/feedback-forms/inconnu", headers: bearerToken })

    expect(response.statusCode).toEqual(404)
  })

  it("refuse la suppression à un utilisateur non admin", async () => {
    const { bearerToken: adminToken } = await loginAsAdmin()
    await createForm(adminToken)
    const { bearerToken } = await createAndLogUser(httpClient, "userCfa", { type: "CFA" })

    const response = await httpClient().inject({ method: "DELETE", path: "/api/admin/feedback-forms/page_entreprise_v1", headers: bearerToken })

    expect(response.statusCode).toEqual(403)
  })

  it("archive un formulaire et trace le changement de statut", async () => {
    const { bearerToken, user } = await loginAsAdmin()
    await createForm(bearerToken)

    const response = await httpClient().inject({ method: "POST", path: "/api/admin/feedback-forms/page_entreprise_v1/archive", headers: bearerToken })

    expect(response.statusCode).toEqual(200)
    const saved = await getDbCollection("feedback_forms").findOne({ slug: "page_entreprise_v1" })
    expect(saved?.status).toEqual("archived")
    expect(saved?.status_history.map(({ status, granted_by }) => ({ status, granted_by }))).toEqual([
      { status: "draft", granted_by: user.email },
      { status: "archived", granted_by: user.email },
    ])
  })

  it("refuse d'archiver un formulaire déjà archivé, puis de le modifier", async () => {
    const { bearerToken } = await loginAsAdmin()
    await createForm(bearerToken)
    await httpClient().inject({ method: "POST", path: "/api/admin/feedback-forms/page_entreprise_v1/archive", headers: bearerToken })

    const archiveAgain = await httpClient().inject({ method: "POST", path: "/api/admin/feedback-forms/page_entreprise_v1/archive", headers: bearerToken })
    expect(archiveAgain.statusCode).toEqual(409)

    const update = await httpClient().inject({
      method: "PUT",
      path: "/api/admin/feedback-forms/page_entreprise_v1",
      headers: bearerToken,
      body: { title: "Titre", trigger: generalInfoOnly.trigger, questions: [] },
    })
    expect(update.statusCode).toEqual(409)
  })

  it("refuse l'archivage à un utilisateur non admin", async () => {
    const { bearerToken: adminToken } = await loginAsAdmin()
    await createForm(adminToken)
    const { bearerToken } = await createAndLogUser(httpClient, "userCfa", { type: "CFA" })

    const response = await httpClient().inject({ method: "POST", path: "/api/admin/feedback-forms/page_entreprise_v1/archive", headers: bearerToken })

    expect(response.statusCode).toEqual(403)
  })

  describe("affichage conditionnel", () => {
    const rating: IFeedbackFormInput["questions"][number] = { id: "q1", type: "rating", label: "Utile ?", required: true, scale: "thumbs3" }
    const conditional = (showIf: { questionId: string; equals: string }): IFeedbackFormInput["questions"][number] => ({
      id: "q2",
      type: "text",
      label: "Pourquoi ?",
      required: false,
      maxLength: 500,
      showIf,
    })

    it("enregistre une condition sur une réponse d'une question précédente", async () => {
      const { bearerToken } = await loginAsAdmin()

      const response = await createForm(bearerToken, { ...generalInfoOnly, questions: [rating, conditional({ questionId: "q1", equals: "negative" })] })

      expect(response.statusCode).toEqual(200)
      const saved = await getDbCollection("feedback_forms").findOne({ slug: "page_entreprise_v1" })
      expect(saved?.questions[1].showIf).toEqual({ questionId: "q1", equals: "negative" })
    })

    it("refuse une condition sur une réponse qui n'existe pas", async () => {
      const { bearerToken } = await loginAsAdmin()

      const response = await createForm(bearerToken, { ...generalInfoOnly, questions: [rating, conditional({ questionId: "q1", equals: "supprimee" })] })

      expect(response.statusCode).toEqual(400)
    })

    it("refuse une condition sur une question posée après, ou inexistante", async () => {
      const { bearerToken } = await loginAsAdmin()

      const after = await createForm(bearerToken, { ...generalInfoOnly, questions: [conditional({ questionId: "q1", equals: "negative" }), rating] })
      expect(after.statusCode).toEqual(400)

      const missing = await createForm(bearerToken, { ...generalInfoOnly, questions: [rating, conditional({ questionId: "q9", equals: "negative" })] })
      expect(missing.statusCode).toEqual(400)
    })

    it("refuse une condition sur la première question", async () => {
      const { bearerToken } = await loginAsAdmin()

      const response = await createForm(bearerToken, { ...generalInfoOnly, questions: [{ ...rating, showIf: { questionId: "q1", equals: "negative" } }] })

      expect(response.statusCode).toEqual(400)
      expect(response.json().message).toContain("La première question ne peut pas être conditionnelle")
    })
  })

  describe("activation", () => {
    const withQuestion: IFeedbackFormInput = { ...generalInfoOnly, questions: [{ id: "q1", type: "rating", label: "Utile ?", required: true, scale: "thumbs3" }] }
    const post = (headers: Record<string, string>, slug: string, action: "activate" | "deactivate") =>
      httpClient().inject({ method: "POST", path: `/api/admin/feedback-forms/${slug}/${action}`, headers })

    it("active un brouillon publiable et trace le changement de statut", async () => {
      const { bearerToken, user } = await loginAsAdmin()
      await createForm(bearerToken, withQuestion)

      const response = await post(bearerToken, "page_entreprise_v1", "activate")

      expect(response.statusCode).toEqual(200)
      const saved = await getDbCollection("feedback_forms").findOne({ slug: "page_entreprise_v1" })
      expect(saved?.status).toEqual("active")
      expect(saved?.status_history.at(-1)).toMatchObject({ status: "active", granted_by: user.email })
    })

    it("refuse d'activer un formulaire sans question", async () => {
      const { bearerToken } = await loginAsAdmin()
      await createForm(bearerToken)

      const response = await post(bearerToken, "page_entreprise_v1", "activate")

      expect(response.statusCode).toEqual(400)
      expect(response.json().message).toContain("Au moins une question est nécessaire")
    })

    it("refuse d'activer un formulaire sur un chemin où un autre est déjà actif", async () => {
      const { bearerToken } = await loginAsAdmin()
      await createForm(bearerToken, withQuestion)
      await post(bearerToken, "page_entreprise_v1", "activate")
      await createForm(bearerToken, { ...withQuestion, slug: "autre_formulaire", title: "Autre formulaire" })

      const response = await post(bearerToken, "autre_formulaire", "activate")

      expect(response.statusCode).toEqual(409)
      expect(response.json().message).toContain("Fiche entreprise — utilité des informations")
    })

    it("refuse d'activer un formulaire dont un motif recouvre le chemin d'un autre formulaire actif", async () => {
      const { bearerToken } = await loginAsAdmin()
      await createForm(bearerToken, withQuestion)
      await post(bearerToken, "page_entreprise_v1", "activate")
      await createForm(bearerToken, {
        ...withQuestion,
        slug: "toutes_formations",
        title: "Toutes les formations",
        trigger: { type: "interactions", minInteractions: 1, scope: ["/recherche", "/formation/*"] },
      })

      const response = await post(bearerToken, "toutes_formations", "activate")

      expect(response.statusCode).toEqual(409)
      expect(response.json().message).toContain("/formation/:id/:intitule-formation")
    })

    it("active un formulaire dont les chemins ne recouvrent aucun formulaire actif", async () => {
      const { bearerToken } = await loginAsAdmin()
      await createForm(bearerToken, withQuestion)
      await post(bearerToken, "page_entreprise_v1", "activate")
      await createForm(bearerToken, { ...withQuestion, slug: "recherche", title: "Recherche", trigger: { type: "interactions", minInteractions: 2, scope: ["/recherche"] } })

      const response = await post(bearerToken, "recherche", "activate")

      expect(response.statusCode).toEqual(200)
    })

    it("refuse de modifier un formulaire actif pour lui retirer ses questions ou le poser sur la page d'un autre", async () => {
      const { bearerToken } = await loginAsAdmin()
      await createForm(bearerToken, withQuestion)
      await post(bearerToken, "page_entreprise_v1", "activate")
      await createForm(bearerToken, { ...withQuestion, slug: "recherche", title: "Recherche", trigger: { type: "interactions", minInteractions: 1, scope: ["/recherche"] } })
      await post(bearerToken, "recherche", "activate")
      const put = (body: Omit<IFeedbackFormInput, "slug">) => httpClient().inject({ method: "PUT", path: "/api/admin/feedback-forms/recherche", headers: bearerToken, body })

      const emptied = await put({ title: "Recherche", trigger: { type: "interactions", minInteractions: 1, scope: ["/recherche"] }, questions: [] })
      expect(emptied.statusCode).toEqual(400)
      expect(emptied.json().message).toContain("Au moins une question est nécessaire")

      const moved = await put({ title: "Recherche", trigger: { type: "interactions", minInteractions: 1, scope: ["/formation/*"] }, questions: withQuestion.questions })
      expect(moved.statusCode).toEqual(409)
      expect(moved.json().message).toContain("Fiche entreprise — utilité des informations")
    })

    it("désactive un formulaire actif, puis permet de le réactiver", async () => {
      const { bearerToken } = await loginAsAdmin()
      await createForm(bearerToken, withQuestion)
      await post(bearerToken, "page_entreprise_v1", "activate")

      const deactivation = await post(bearerToken, "page_entreprise_v1", "deactivate")
      expect(deactivation.statusCode).toEqual(200)
      expect((await getDbCollection("feedback_forms").findOne({ slug: "page_entreprise_v1" }))?.status).toEqual("inactive")

      const reactivation = await post(bearerToken, "page_entreprise_v1", "activate")
      expect(reactivation.statusCode).toEqual(200)
    })

    it("refuse de désactiver un brouillon", async () => {
      const { bearerToken } = await loginAsAdmin()
      await createForm(bearerToken, withQuestion)

      const response = await post(bearerToken, "page_entreprise_v1", "deactivate")

      expect(response.statusCode).toEqual(409)
    })
  })
  describe("formulaire qui a des réponses", () => {
    const withQuestion: IFeedbackFormInput = { ...generalInfoOnly, questions: [{ id: "q1", type: "rating", label: "Utile ?", required: true, scale: "thumbs3" }] }

    const answerOnce = async (headers: Record<string, string>) => {
      await createForm(headers, withQuestion)
      await httpClient().inject({ method: "POST", path: "/api/admin/feedback-forms/page_entreprise_v1/activate", headers })
      const context = { page: "/formation/:id/:intitule-formation", path_params: { id: "1", "intitule-formation": "cap" }, query: {} }
      const { display_id } = (await httpClient().inject({ method: "POST", path: "/api/feedback-forms/page_entreprise_v1/displays", body: context })).json()
      const { response_id, token } = (await httpClient().inject({ method: "POST", path: "/api/feedback-forms/page_entreprise_v1/responses", body: { display_id } })).json()
      await httpClient().inject({
        method: "PUT",
        path: `/api/feedback-responses/${response_id}`,
        body: { token, answers: [{ question_id: "q1", choices: ["positive"] }], skipped: [] },
      })
    }

    it("compte ses réponses et refuse de le modifier", async () => {
      const { bearerToken } = await loginAsAdmin()
      await answerOnce(bearerToken)

      const detail = await httpClient().inject({ method: "GET", path: "/api/admin/feedback-forms/page_entreprise_v1", headers: bearerToken })
      expect(detail.json().responses_count).toEqual(1)

      const response = await httpClient().inject({
        method: "PUT",
        path: "/api/admin/feedback-forms/page_entreprise_v1",
        headers: bearerToken,
        body: { title: "Autre titre", trigger: withQuestion.trigger, questions: withQuestion.questions },
      })
      expect(response.statusCode).toEqual(409)
      expect(response.json().message).toContain("nouveau formulaire")
    })

    it("supprime ses affichages et ses réponses avec lui", async () => {
      const { bearerToken } = await loginAsAdmin()
      await answerOnce(bearerToken)
      await httpClient().inject({ method: "POST", path: "/api/admin/feedback-forms/page_entreprise_v1/archive", headers: bearerToken })

      const response = await httpClient().inject({ method: "DELETE", path: "/api/admin/feedback-forms/page_entreprise_v1", headers: bearerToken })

      expect(response.statusCode).toEqual(200)
      expect(await getDbCollection("feedback_responses").countDocuments({})).toEqual(0)
      expect(await getDbCollection("feedback_displays").countDocuments({})).toEqual(0)
      expect(await getDbCollection("feedback_display_counts").countDocuments({})).toEqual(0)
    })
  })

  describe("résultats", () => {
    const resultsForm: IFeedbackFormInput = {
      ...generalInfoOnly,
      questions: [
        { id: "q1", type: "rating", label: "Utile ?", required: true, scale: "thumbs3" },
        {
          id: "q2",
          type: "multi_select",
          label: "Filtres ?",
          required: false,
          options: [
            { value: "contrat", label: "Contrat" },
            { value: "niveau", label: "Niveau" },
          ],
        },
        { id: "q3", type: "text", label: "Pourquoi ?", required: false, maxLength: 200 },
      ],
    }
    const context = { page: "/formation/:id/:intitule-formation", path_params: { id: "1", "intitule-formation": "cap" }, query: {} }

    const answer = async (answers: object[], skipped: string[] = []) => {
      const { display_id } = (await httpClient().inject({ method: "POST", path: "/api/feedback-forms/page_entreprise_v1/displays", body: context })).json()
      const { response_id, token } = (await httpClient().inject({ method: "POST", path: "/api/feedback-forms/page_entreprise_v1/responses", body: { display_id } })).json()
      if (answers.length || skipped.length) {
        await httpClient().inject({ method: "PUT", path: `/api/feedback-responses/${response_id}`, body: { token, answers, skipped } })
      }
    }

    it("renvoie des résultats vides pour un formulaire sans affichage", async () => {
      const { bearerToken } = await loginAsAdmin()
      await createForm(bearerToken, resultsForm)

      const response = await httpClient().inject({ method: "GET", path: "/api/admin/feedback-forms/page_entreprise_v1/results", headers: bearerToken })

      expect(response.statusCode).toEqual(200)
      expect(response.json()).toEqual({
        displays: { total: 0, since: null },
        responses: { started: 0, completed: 0 },
        questions: [
          { question_id: "q1", answered: 0, choices: [], comments: null },
          { question_id: "q2", answered: 0, choices: [], comments: null },
          { question_id: "q3", answered: 0, choices: [], comments: { total: 0, latest: [] } },
        ],
      })
    })

    it("compte affichages, parcours commencés et terminés, sélections et commentaires", async () => {
      const { bearerToken } = await loginAsAdmin()
      await createForm(bearerToken, resultsForm)
      await httpClient().inject({ method: "POST", path: "/api/admin/feedback-forms/page_entreprise_v1/activate", headers: bearerToken })

      await answer([
        { question_id: "q1", choices: ["positive"] },
        { question_id: "q2", choices: ["contrat", "niveau"] },
        { question_id: "q3", text: "Très clair" },
      ])
      await answer(
        [
          { question_id: "q1", choices: ["negative"] },
          { question_id: "q2", choices: ["contrat"] },
        ],
        ["q3"]
      )
      await answer([{ question_id: "q1", choices: ["negative"] }])
      await answer([])

      const response = await httpClient().inject({ method: "GET", path: "/api/admin/feedback-forms/page_entreprise_v1/results", headers: bearerToken })
      const results = response.json()

      expect(results.displays).toEqual({ total: 4, since: new Date().toISOString().slice(0, 10) })
      expect(results.responses).toEqual({ started: 3, completed: 2 })
      const [rating, multi, text] = results.questions
      expect(rating.answered).toEqual(3)
      expect(rating.choices).toEqual(
        expect.arrayContaining([
          { value: "positive", count: 1 },
          { value: "negative", count: 2 },
        ])
      )
      expect(multi.answered).toEqual(2)
      expect(multi.choices).toEqual(
        expect.arrayContaining([
          { value: "contrat", count: 2 },
          { value: "niveau", count: 1 },
        ])
      )
      expect(text).toMatchObject({ answered: 1, choices: [], comments: { total: 1, latest: [{ text: "Très clair", rating: "positive", date: expect.any(String) }] } })
    })
  })

  describe("déclencheurs", () => {
    it("enregistre un déclencheur par temps en ne gardant que ses paramètres", async () => {
      const { bearerToken } = await loginAsAdmin()

      const response = await createForm(bearerToken, { ...generalInfoOnly, trigger: { type: "delay", delaySeconds: 30, minInteractions: 4, scope: ["/recherche"] } })

      expect(response.statusCode).toEqual(200)
      const saved = await getDbCollection("feedback_forms").findOne({ slug: "page_entreprise_v1" })
      expect(saved?.trigger).toEqual({ type: "delay", delaySeconds: 30, scope: ["/recherche"] })
    })

    it("enregistre un déclencheur sur l'abandon d'une candidature", async () => {
      const { bearerToken } = await loginAsAdmin()

      const response = await createForm(bearerToken, {
        ...generalInfoOnly,
        trigger: { type: "event", event: "application_abandoned", scope: ["/emploi/:type/:id/:intitule-offre"] },
      })

      expect(response.statusCode).toEqual(200)
      const saved = await getDbCollection("feedback_forms").findOne({ slug: "page_entreprise_v1" })
      expect(saved?.trigger).toEqual({ type: "event", event: "application_abandoned", scope: ["/emploi/:type/:id/:intitule-offre"] })
    })

    it.each([
      ["un temps sans durée", { type: "delay", scope: ["/recherche"] }, "Indiquez une durée en secondes"],
      ["un temps trop court", { type: "delay", delaySeconds: 2, scope: ["/recherche"] }, "Au moins 5 secondes"],
      ["un événement sans événement", { type: "event", scope: ["/recherche"] }, "Choisissez un événement"],
      ["des interactions sans nombre", { type: "interactions", scope: ["/recherche"] }, "Indiquez un nombre d'interactions"],
    ])("refuse %s", async (_label, trigger, message) => {
      const { bearerToken } = await loginAsAdmin()

      const response = await createForm(bearerToken, { ...generalInfoOnly, trigger } as IFeedbackFormInput)

      expect(response.statusCode).toEqual(400)
      expect(response.json().message).toContain(message)
    })

    it("lit et active un formulaire enregistré sans type de déclencheur", async () => {
      const { bearerToken } = await loginAsAdmin()
      await createForm(bearerToken, { ...generalInfoOnly, questions: [{ id: "q1", type: "rating", label: "Utile ?", required: true, scale: "thumbs3" }] })
      await getDbCollection("feedback_forms").updateOne({ slug: "page_entreprise_v1" }, { $unset: { "trigger.type": "" } })

      const read = await httpClient().inject({ method: "GET", path: "/api/admin/feedback-forms/page_entreprise_v1", headers: bearerToken })
      expect(read.statusCode).toEqual(200)
      expect(read.json().trigger).toEqual({ minInteractions: 1, scope: generalInfoOnly.trigger.scope })

      const activation = await httpClient().inject({ method: "POST", path: "/api/admin/feedback-forms/page_entreprise_v1/activate", headers: bearerToken })
      expect(activation.statusCode).toEqual(200)
    })
  })
})
