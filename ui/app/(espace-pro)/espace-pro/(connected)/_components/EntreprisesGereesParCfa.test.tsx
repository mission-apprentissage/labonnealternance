import { renderToStaticMarkup } from "react-dom/server"
import { JOB_STATUS } from "shared/models/job.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { EntreprisesGereesParCfa } from "./EntreprisesGereesParCfa"

const state = vi.hoisted(() => ({ userType: "ADMIN", counterFails: false, queries: [] as { queryKey: unknown[]; enabled: boolean }[] }))
const SIRET_NON_CONFORME = "11000001500013"
const SIRET_CONFORME = "11000001500021"
const JOB_STATUSES = [JOB_STATUS.ACTIVE, JOB_STATUS.ACTIVE, JOB_STATUS.EN_MODERATION, JOB_STATUS.EN_ATTENTE, JOB_STATUS.POURVUE, JOB_STATUS.ANNULEE]

vi.mock("@/context/UserContext", () => ({ useAuth: () => ({ user: { type: state.userType } }) }))
vi.mock("./EntreprisesGereesParCfaMenu", () => ({ EntreprisesGereesParCfaMenu: () => null }))
vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey, enabled }: { queryKey: unknown[]; enabled: boolean }) => {
    state.queries.push({ queryKey, enabled })
    if (queryKey.includes("non-conformes")) {
      if (!enabled || state.counterFails) return { data: undefined, isSuccess: false, isError: state.counterFails }
      return { data: { entreprises: [{ siret: SIRET_NON_CONFORME, non_conformes: 3 }] }, isSuccess: true }
    }
    // Quatre offres non closes par entreprise : la colonne « Offres actives » n'affiche pas de 0 qui se confondrait avec
    // celui des non conformes, ni le 3 de leur badge.
    return {
      isLoading: false,
      data: [SIRET_NON_CONFORME, SIRET_CONFORME].map((siret) => ({
        establishment_siret: siret,
        establishment_raison_sociale: `Entreprise ${siret}`,
        jobs: JOB_STATUSES.map((job_status) => ({ job_status })),
        createdAt: "2026-10-01",
      })),
    }
  },
}))

const render = (userType: string, { counterFails = false } = {}) => {
  state.userType = userType
  state.counterFails = counterFails
  state.queries = []
  return renderToStaticMarkup(<EntreprisesGereesParCfa cfaId="6ad734de852d3675eb942548" userId="6ad734de852d3675eb942549" />)
}
const counterQuery = () => state.queries.find(({ queryKey }) => queryKey.includes("non-conformes"))

describe("EntreprisesGereesParCfa, colonne « Non conformes » (#5757)", () => {
  beforeEach(() => {
    state.queries = []
  })

  it("affiche à un administrateur le nombre d'offres non conformes de chaque entreprise, 0 sans offre non conforme", () => {
    const html = render("ADMIN")

    expect(counterQuery()?.enabled).toBe(true)
    expect(html).toContain("Non conformes")
    expect(html).toMatch(/fr-badge[^>]*>3<span class="fr-sr-only"> offres non conformes<\/span>/)
    expect(html).toMatch(/>0</)
    expect(html).not.toContain("Nombre indisponible")
  })

  it("affiche « — » et non 0 quand le compteur est indisponible", () => {
    const html = render("ADMIN", { counterFails: true })

    expect(html).toContain("Non conformes")
    expect(html.match(/<span aria-hidden="true">—<\/span><span class="fr-sr-only">Nombre indisponible<\/span>/g)).toHaveLength(2)
    expect(html).not.toMatch(/>0</)
    expect(html).not.toContain("fr-badge")
  })

  it.each(["CFA", "OPCO", "ENTREPRISE"])("ne demande pas le compteur pour un %s, dont la session serait fermée par le refus", (userType) => {
    const html = render(userType)

    expect(counterQuery()?.enabled).toBe(false)
    expect(html).not.toContain("Non conformes")
  })
})

describe("EntreprisesGereesParCfa, colonne « Offres actives » (#5757)", () => {
  it.each(["ADMIN", "OPCO"])("compte pour un %s les offres publiées, en modération et en attente, pas les offres pourvues ni annulées", (userType) => {
    const html = render(userType)

    expect(html).toContain("Offres actives")
    expect(html.match(/<td[^>]*>4<\/td>/g)).toHaveLength(2)
    expect(html).not.toMatch(/>6</)
  })
})
