import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { CandidaturesCell } from "./OffresTabs"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/context/UserContext", () => ({ useAuth: () => ({ user: { type: "ENTREPRISE" } }) }))

const DAY = 24 * 3600 * 1000
const PENDING_BADGE = /2<span class="fr-sr-only"> en attente<\/span>/

const render = ({ expiresInDays }: { expiresInDays: number }) =>
  renderToStaticMarkup(
    <CandidaturesCell
      job={{ _id: "6ad734de852d3675eb942548", candidatures: 5, candidatures_en_attente: 2, job_expiration_date: new Date(Date.now() + expiresInDays * DAY).toISOString() } as never}
      applicationsPath="/espace-pro/entreprise/offre/6ad734de852d3675eb942548/candidatures"
      userType="entreprise"
    />
  )

describe("CandidaturesCell", () => {
  it("affiche les candidatures en attente d'une offre ouverte", () => {
    expect(render({ expiresInDays: 30 })).toMatch(PENDING_BADGE)
  })

  it("affiche les candidatures en attente d'une offre close tant qu'elles sont consultables", () => {
    const html = render({ expiresInDays: -10 })

    expect(html).toMatch(PENDING_BADGE)
    expect(html).toContain("consultables jusqu’au")
  })

  it("n'affiche plus de compteur en attente une fois le délai de consultation passé", () => {
    const html = render({ expiresInDays: -120 })

    expect(html).not.toContain("en attente")
    expect(html).toContain("plus disponible")
  })
})
