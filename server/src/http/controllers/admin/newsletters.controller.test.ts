import { createAndLogUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { ObjectId } from "mongodb"
import type { INewsletter } from "shared/models/newsletter.model"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"

const input = {
  title: "La lettre de l'alternance — novembre 2026",
  edition_date: "2026-11-15",
  linkedin_url: "https://www.linkedin.com/pulse/la-lettre-de-lalternance-novembre-2026",
  is_visible: true,
}

const buildNewsletter = (overrides: Partial<INewsletter> = {}): INewsletter => ({
  _id: new ObjectId(),
  title: "Édition",
  edition_date: new Date("2026-01-01"),
  linkedin_url: "https://www.linkedin.com/pulse/edition",
  is_visible: true,
  created_at: new Date(),
  updated_at: new Date(),
  created_by: "admin@beta.gouv.fr",
  ...overrides,
})

describe("newsletters controllers", () => {
  useMongo()
  const httpClient = useServer()

  const loginAsAdmin = () => createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })

  describe("admin", () => {
    it("refuse la lecture à un utilisateur non admin", async () => {
      const { bearerToken } = await createAndLogUser(httpClient, "userCfa", { type: "CFA" })

      const response = await httpClient().inject({ method: "GET", path: "/api/admin/newsletters", headers: bearerToken })

      expect(response.statusCode).toEqual(403)
    })

    it("refuse la création à un utilisateur non admin", async () => {
      const { bearerToken } = await createAndLogUser(httpClient, "userCfa", { type: "CFA" })

      const response = await httpClient().inject({ method: "POST", path: "/api/admin/newsletters", headers: bearerToken, body: input })

      expect(response.statusCode).toEqual(403)
      expect(await getDbCollection("newsletters").countDocuments()).toEqual(0)
    })

    it("refuse la suppression à un utilisateur non admin", async () => {
      const existing = buildNewsletter()
      await getDbCollection("newsletters").insertOne(existing)
      const { bearerToken } = await createAndLogUser(httpClient, "userCfa", { type: "CFA" })

      const response = await httpClient().inject({ method: "DELETE", path: `/api/admin/newsletters/${existing._id}`, headers: bearerToken })

      expect(response.statusCode).toEqual(403)
      expect(await getDbCollection("newsletters").countDocuments()).toEqual(1)
    })

    it.each([
      ["un autre domaine", "https://www.example.com/pulse/edition"],
      ["un domaine qui se termine par linkedin.com sans en être un sous-domaine", "https://fakelinkedin.com/pulse/edition"],
      ["un domaine qui contient linkedin.com", "https://linkedin.com.example.com/pulse/edition"],
      ["http", "http://www.linkedin.com/pulse/edition"],
      ["une adresse sans protocole", "www.linkedin.com/pulse/edition"],
    ])("refuse un lien d'édition vers %s", async (_label, linkedin_url) => {
      const { bearerToken } = await loginAsAdmin()

      const response = await httpClient().inject({ method: "POST", path: "/api/admin/newsletters", headers: bearerToken, body: { ...input, linkedin_url } })

      expect(response.statusCode).toEqual(400)
      expect(await getDbCollection("newsletters").countDocuments()).toEqual(0)
    })

    it.each([
      ["absente", undefined],
      ["nulle", null],
      ["invalide", "2026-13-45"],
    ])("refuse une date d'édition %s", async (_label, edition_date) => {
      const { bearerToken } = await loginAsAdmin()

      const response = await httpClient().inject({ method: "POST", path: "/api/admin/newsletters", headers: bearerToken, body: { ...input, edition_date } })

      expect(response.statusCode).toEqual(400)
      expect(await getDbCollection("newsletters").countDocuments()).toEqual(0)
    })

    it("refuse un titre fait d'espaces", async () => {
      const { bearerToken } = await loginAsAdmin()

      const response = await httpClient().inject({ method: "POST", path: "/api/admin/newsletters", headers: bearerToken, body: { ...input, title: "   " } })

      expect(response.statusCode).toEqual(400)
    })

    it("crée une édition au nom de l'admin", async () => {
      const { bearerToken, user } = await loginAsAdmin()

      const response = await httpClient().inject({
        method: "POST",
        path: "/api/admin/newsletters",
        headers: bearerToken,
        body: { ...input, linkedin_url: "https://linkedin.com/newsletters/7123" },
      })

      expect(response.statusCode).toEqual(200)
      const saved = await getDbCollection("newsletters").findOne({})
      expect(saved).toMatchObject({
        title: input.title,
        edition_date: new Date("2026-11-15"),
        linkedin_url: "https://linkedin.com/newsletters/7123",
        is_visible: true,
        created_by: user.email,
      })
    })

    it("liste toutes les éditions, masquées comprises, de la plus récente à la plus ancienne", async () => {
      const older = buildNewsletter({ title: "Ancienne", edition_date: new Date("2026-09-01") })
      const hidden = buildNewsletter({ title: "Masquée", edition_date: new Date("2026-10-01"), is_visible: false })
      const newer = buildNewsletter({ title: "Récente", edition_date: new Date("2026-11-01") })
      await getDbCollection("newsletters").insertMany([older, hidden, newer])
      const { bearerToken } = await loginAsAdmin()

      const response = await httpClient().inject({ method: "GET", path: "/api/admin/newsletters", headers: bearerToken })

      expect(response.statusCode).toEqual(200)
      expect(response.json().newsletters.map(({ title }) => title)).toEqual(["Récente", "Masquée", "Ancienne"])
    })

    it("lit une édition, 404 si elle n'existe pas", async () => {
      const existing = buildNewsletter()
      await getDbCollection("newsletters").insertOne(existing)
      const { bearerToken } = await loginAsAdmin()

      const found = await httpClient().inject({ method: "GET", path: `/api/admin/newsletters/${existing._id}`, headers: bearerToken })
      expect(found.statusCode).toEqual(200)
      expect(found.json()).toMatchObject({ title: existing.title })

      const missing = await httpClient().inject({ method: "GET", path: `/api/admin/newsletters/${new ObjectId()}`, headers: bearerToken })
      expect(missing.statusCode).toEqual(404)
    })

    it("modifie une édition en place", async () => {
      const existing = buildNewsletter({ created_by: "auteur@beta.gouv.fr" })
      await getDbCollection("newsletters").insertOne(existing)
      const { bearerToken } = await loginAsAdmin()

      const response = await httpClient().inject({ method: "PUT", path: `/api/admin/newsletters/${existing._id}`, headers: bearerToken, body: { ...input, is_visible: false } })

      expect(response.statusCode).toEqual(200)
      const saved = await getDbCollection("newsletters").findOne({ _id: existing._id })
      expect(saved).toMatchObject({ title: input.title, linkedin_url: input.linkedin_url, is_visible: false, created_by: "auteur@beta.gouv.fr" })
      expect(saved!.updated_at.getTime()).toBeGreaterThan(existing.updated_at.getTime())
    })

    it("renvoie 404 à la modification d'une édition inconnue, sans la créer", async () => {
      const { bearerToken } = await loginAsAdmin()

      const response = await httpClient().inject({ method: "PUT", path: `/api/admin/newsletters/${new ObjectId()}`, headers: bearerToken, body: input })

      expect(response.statusCode).toEqual(404)
      expect(await getDbCollection("newsletters").countDocuments()).toEqual(0)
    })

    it("supprime une édition, 404 si elle n'existe pas", async () => {
      const existing = buildNewsletter()
      const other = buildNewsletter()
      await getDbCollection("newsletters").insertMany([existing, other])
      const { bearerToken } = await loginAsAdmin()

      const response = await httpClient().inject({ method: "DELETE", path: `/api/admin/newsletters/${existing._id}`, headers: bearerToken })
      expect(response.statusCode).toEqual(200)
      expect(
        await getDbCollection("newsletters")
          .find({})
          .map(({ _id }) => _id.toString())
          .toArray()
      ).toEqual([other._id.toString()])

      const again = await httpClient().inject({ method: "DELETE", path: `/api/admin/newsletters/${existing._id}`, headers: bearerToken })
      expect(again.statusCode).toEqual(404)
    })

    it("renvoie 400 sur un identifiant mal formé", async () => {
      const { bearerToken } = await loginAsAdmin()

      const response = await httpClient().inject({ method: "DELETE", path: "/api/admin/newsletters/pas-un-id", headers: bearerToken })

      expect(response.statusCode).toEqual(400)
    })
  })

  describe("public", () => {
    it("n'expose que les 6 éditions visibles les plus récentes, sans les champs internes", async () => {
      const visible = Array.from({ length: 7 }, (_, index) => buildNewsletter({ title: `Édition ${index + 1}`, edition_date: new Date(2026, index, 1) }))
      // la plus récente de toutes, mais masquée
      const hidden = buildNewsletter({ title: "Masquée", edition_date: new Date(2026, 11, 1), is_visible: false })
      await getDbCollection("newsletters").insertMany([...visible, hidden])

      const response = await httpClient().inject({ method: "GET", path: "/api/newsletters" })

      expect(response.statusCode).toEqual(200)
      const { newsletters } = response.json()
      expect(newsletters.map(({ title }) => title)).toEqual(["Édition 7", "Édition 6", "Édition 5", "Édition 4", "Édition 3", "Édition 2"])
      expect(Object.keys(newsletters[0]).sort()).toEqual(["_id", "edition_date", "linkedin_url", "title"])
    })
  })
})
