import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { saveDbEntity } from "@tests/utils/user.test.utils"
import { ZReferentielRome, zFormationCatalogueSchema } from "shared/models/index"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { resetPartnerSearchLinkCaches } from "@/services/search/partner-search-link.service"

const PATH = "/api/_private/search/partner-link"
const PUBLIC_IP = "203.0.113.10"
const PROXY_IP = "172.18.0.1"

describe("GET /_private/search/partner-link", () => {
  useMongo()
  const httpClient = useServer()

  beforeEach(async () => {
    resetPartnerSearchLinkCaches()
    await saveDbEntity(ZReferentielRome, (item) => getDbCollection("referentielromes").insertOne(item), {
      rome: { code_rome: "M1805", intitule: "Études et développement informatique", code_ogr: "M1805" },
    })
    await saveDbEntity(zFormationCatalogueSchema, (item) => getDbCollection("formationcatalogues").insertOne(item), {
      cle_ministere_educatif: "CLE1",
      rncp_code: "RNCP37873",
      rome_codes: ["M1805"],
    })
  })

  it("résout un RNCP pour le rendu serveur de l'UI relayé par le proxy", async () => {
    const response = await httpClient().inject({
      method: "GET",
      path: `${PATH}?partner=monmaster&code=RNCP37873`,
      remoteAddress: PROXY_IP,
      headers: { "x-forwarded-for": PROXY_IP },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ q: "Études et développement informatique", lieu_label: null })
  })

  it.each([
    ["requête valide", "?partner=monmaster&code=RNCP37873"],
    ["paramètres invalides (pas de 400 révélateur)", "?partner=inconnu&code=x&foo=bar"],
    ["sans paramètre", ""],
  ])("répond 404 à une IP publique : %s", async (_label, query) => {
    const response = await httpClient().inject({ method: "GET", path: `${PATH}${query}`, remoteAddress: PUBLIC_IP })
    expect(response.statusCode).toBe(404)
  })

  it("répond 404 quand un X-Forwarded-For privé est forgé devant une IP publique", async () => {
    const response = await httpClient().inject({
      method: "GET",
      path: `${PATH}?partner=monmaster&code=RNCP37873`,
      remoteAddress: PROXY_IP,
      headers: { "x-forwarded-for": `10.0.0.1, ${PUBLIC_IP}` },
    })
    expect(response.statusCode).toBe(404)
  })

  it("rejette un paramètre hors schéma depuis le réseau privé (400)", async () => {
    const response = await httpClient().inject({ method: "GET", path: `${PATH}?partner=monmaster&code=RNCP37873&radius=10` })
    expect(response.statusCode).toBe(400)
  })
})
