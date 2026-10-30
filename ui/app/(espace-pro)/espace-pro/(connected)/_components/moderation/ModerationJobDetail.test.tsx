import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { ApiError } from "@/utils/api.utils"
import { ModerationJobDetail } from "./ModerationJobDetail"

const query = vi.hoisted(() => ({ error: null as unknown }))

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: () => ({ isError: true, error: query.error, isLoading: false, data: undefined, refetch: vi.fn() }),
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
  return renderToStaticMarkup(<ModerationJobDetail jobId="6ad734de852d3675eb94254" userType="OPCO" />)
}

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
