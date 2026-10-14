import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { ObjectId } from "mongodb"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { createRdvaOptOutUnsubscribePageLink } from "@/services/app-links.service"

useMongo()
const httpClient = useServer()

describe("GET /etablissements/:id", () => {
  const insertEtablissement = async () => {
    const _id = new ObjectId()
    await getDbCollection("etablissements").insertOne({ _id, raison_sociale: "CFA Test", formateur_siret: "42476141900045", gestionnaire_siret: "42476141900045" })
    return _id
  }

  // Jeton tel qu'il part dans l'e-mail d'invitation à l'opt-out
  const tokenFor = (id: ObjectId) => new URL(createRdvaOptOutUnsubscribePageLink("cfa@example.fr", "42476141900045", id.toString())).searchParams.get("token")

  const call = async (id: string, token?: string | null) =>
    httpClient().inject({ method: "GET", url: `/api/etablissements/${id}`, headers: token ? { authorization: `Bearer ${token}` } : {} })

  it("renvoie l'établissement avec le jeton qui lui est destiné", async () => {
    const id = await insertEtablissement()

    const response = await call(id.toString(), tokenFor(id))

    expect.soft(response.statusCode).toBe(200)
    expect.soft(response.json()).toMatchObject({ _id: id.toString(), raison_sociale: "CFA Test" })
  })

  it("répond 404 pour un id inconnu, quel que soit le jeton", async () => {
    const autre = await insertEtablissement()
    const inconnu = new ObjectId()

    expect.soft((await call(inconnu.toString(), tokenFor(autre))).statusCode).toBe(404)
    expect.soft((await call(inconnu.toString())).statusCode).toBe(404)
    expect.soft((await call("id-mal-forme")).statusCode).toBe(404)
  })

  it("répond 401 sans jeton et 403 avec le jeton d'un autre établissement", async () => {
    const id = await insertEtablissement()
    const autre = await insertEtablissement()

    expect.soft((await call(id.toString())).statusCode).toBe(401)
    expect.soft((await call(id.toString(), tokenFor(autre))).statusCode).toBe(403)
  })
})
