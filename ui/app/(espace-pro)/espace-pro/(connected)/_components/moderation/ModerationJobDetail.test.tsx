import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { ApiError } from "@/utils/api.utils"
import { ModerationJobDetail } from "./ModerationJobDetail"
import type { IModerationJobDetailJson } from "./moderation.types"

const query = vi.hoisted(() => ({ error: null as unknown, data: undefined as unknown }))

// Seule la requête de la fiche est simulée : les offres voisines (ModerationJobNavigation) restent sans réponse.
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: ({ queryKey }: { queryKey: unknown[] }) =>
    queryKey[0] === "moderation-neighbors" ? { data: undefined } : { isError: Boolean(query.error), error: query.error, isLoading: false, data: query.data, refetch: vi.fn() },
}))

const renderWithError = (statusCode: number) => {
  query.error = new ApiError({
    path: "/moderation/jobs/:id",
    params: {},
    querystring: {},
    requestHeaders: {},
    statusCode,
    message: "",
    name: "",
    responseHeaders: {},
    errorData: null,
  })
  query.data = undefined
  return renderToStaticMarkup(<ModerationJobDetail jobId="6ad734de852d3675eb94254" userType="OPCO" />)
}

const detail = {
  offer: {
    _id: "6ad734de852d3675eb942548",
    offer_title: "Assistant commercial",
    offer_rome_appellation: "Assistant / Assistante commercial",
    contract_type: ["Apprentissage"],
    offer_status: "InReview",
    offer_moderation_verdict: "non_conforme",
    offer_moderation_status: "ok",
    offer_moderation_review: null,
  },
  recruiter: { account_type: "ENTREPRISE", account_status: "ACTIF" },
  partner_company: { raison_sociale: "Partenaire" },
  moderation: { _id: "6ad734de852d3675eb942549", findings: [], review: null },
  decision_blocked_reason: null,
  can_reclassify: true,
  reports_count: 0,
} as unknown as IModerationJobDetailJson

describe("ModerationJobDetail, offre non chargée", () => {
  it.each([400, 404])("affiche « Offre introuvable » sur une erreur %i", (statusCode) => {
    const html = renderWithError(statusCode)

    expect(html).toContain("Offre introuvable")
    expect(html).not.toContain("Réessayez dans un instant.")
    expect(html).toContain("Retour aux offres en modération")
  })

  it("invite à réessayer sur une erreur serveur", () => {
    const html = renderWithError(500)

    expect(html).toContain("La page de modération n’a pas pu être chargée")
    expect(html).toContain("Réessayez dans un instant.")
  })
})

describe("ModerationJobDetail, offre chargée", () => {
  it("ouvre le plan de titres sur le h1 et titre chaque carte du compte en h2 (RGAA 9.1)", () => {
    query.error = null
    query.data = detail
    const html = renderToStaticMarkup(<ModerationJobDetail jobId="6ad734de852d3675eb942548" userType="OPCO" />)
    const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([^<]*)<\/h\1>/g)].map(([, level, text]) => `h${level} ${text}`)

    expect(headings[0]).toBe("h1 Assistant commercial")
    expect(headings).toContain("h2 Compte recruteur")
    expect(headings).toContain("h2 Entreprise partenaire :")
  })

  it("affiche le titre de l'offre et son métier avant les cartes du compte, dans l'ordre visuel", () => {
    query.error = null
    query.data = detail
    const html = renderToStaticMarkup(<ModerationJobDetail jobId="6ad734de852d3675eb942548" userType="OPCO" />)
    const positions = ["Assistant commercial</h1>", "Assistant / Assistante commercial", "Compte recruteur", "La présentation de l’entreprise"].map((text) => html.indexOf(text))

    expect(positions).not.toContain(-1)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(html).not.toContain("order:-1")
  })
})
