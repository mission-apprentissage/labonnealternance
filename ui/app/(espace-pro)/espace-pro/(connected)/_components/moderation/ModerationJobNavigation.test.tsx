import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ModerationJobNavigation, ModerationJobNavigationLinks } from "./ModerationJobNavigation"

const PREVIOUS = "6ad734de852d3675eb942548"
const NEXT = "6ad734de852d3675eb942549"
const JOB_ID = "6ad734de852d3675eb94254a"

const mocks = vi.hoisted(() => ({
  options: null as null | { enabled: boolean; queryFn: () => unknown },
  data: undefined as unknown,
  getModerationQueueNeighbors: vi.fn(),
}))

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: (options: { enabled: boolean; queryFn: () => unknown }) => {
    mocks.options = options
    return { data: mocks.data }
  },
}))

vi.mock("@/utils/api", () => ({ getModerationQueueNeighbors: mocks.getModerationQueueNeighbors }))

const stubStoredQueue = (state: object | null) =>
  vi.stubGlobal("window", {
    sessionStorage: { getItem: (key: string) => (state && key === "lba:moderation-queue:ADMIN" ? JSON.stringify(state) : null), setItem: vi.fn() },
  })

beforeEach(() => {
  mocks.options = null
  mocks.data = undefined
  mocks.getModerationQueueNeighbors.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("ModerationJobNavigationLinks", () => {
  it("lie les offres voisines vers la page de modération du bon espace", () => {
    const admin = renderToStaticMarkup(<ModerationJobNavigationLinks previous={PREVIOUS} next={NEXT} userType="ADMIN" />)
    const opco = renderToStaticMarkup(<ModerationJobNavigationLinks previous={PREVIOUS} next={NEXT} userType="OPCO" />)

    expect(admin).toContain(`href="/espace-pro/administration/offres-a-moderer/${PREVIOUS}"`)
    expect(admin).toContain(`href="/espace-pro/administration/offres-a-moderer/${NEXT}"`)
    expect(opco).toContain(`href="/espace-pro/opco/offres-a-moderer/${NEXT}"`)
    expect(admin).not.toContain("disabled")
  })

  it("désactive le bouton de l'extrémité atteinte, sans lien", () => {
    const html = renderToStaticMarkup(<ModerationJobNavigationLinks previous={null} next={NEXT} userType="ADMIN" />)

    expect(html).toMatch(/<button[^>]*disabled[^>]*>Offre précédente<\/button>/)
    expect(html).toMatch(/<a[^>]*href="\/espace-pro\/administration\/offres-a-moderer\/6ad734de852d3675eb942549"[^>]*>Offre suivante<\/a>/)
    expect(html.match(/href=/g)).toHaveLength(1)
  })
})

describe("ModerationJobNavigation", () => {
  it("demande les voisines avec les filtres et le tri laissés sur la file", () => {
    stubStoredQueue({ conformity: ["non_conforme"], account_status: [], account_type: [], opco: [], search: "", sort: "offer_title", order: "asc", offset: 50 })

    renderToStaticMarkup(<ModerationJobNavigation jobId={JOB_ID} userType="ADMIN" />)
    mocks.options?.queryFn()

    expect(mocks.options?.enabled).toBe(true)
    expect(mocks.getModerationQueueNeighbors).toHaveBeenCalledWith(JOB_ID, {
      conformity: ["non_conforme"],
      account_status: undefined,
      account_type: undefined,
      opco: undefined,
      search: undefined,
      sort: "offer_title",
      order: "asc",
    })
  })

  it("suit l'ordre par défaut de la file sans état enregistré", () => {
    stubStoredQueue(null)

    renderToStaticMarkup(<ModerationJobNavigation jobId={JOB_ID} userType="ADMIN" />)
    mocks.options?.queryFn()

    expect(mocks.getModerationQueueNeighbors).toHaveBeenCalledWith(JOB_ID, {})
  })

  it("n'interroge pas l'API au rendu serveur", () => {
    renderToStaticMarkup(<ModerationJobNavigation jobId={JOB_ID} userType="ADMIN" />)

    expect(mocks.options?.enabled).toBe(false)
  })

  it("n'affiche aucun bouton tant que les voisines ne sont pas connues, chargement ou erreur", () => {
    stubStoredQueue(null)

    expect(renderToStaticMarkup(<ModerationJobNavigation jobId={JOB_ID} userType="ADMIN" />)).toBe("")
  })

  it("affiche les boutons une fois les voisines connues", () => {
    stubStoredQueue(null)
    mocks.data = { previous: null, next: NEXT }

    const html = renderToStaticMarkup(<ModerationJobNavigation jobId={JOB_ID} userType="ADMIN" />)

    expect(html).toMatch(/<button[^>]*disabled[^>]*>Offre précédente<\/button>/)
    expect(html).toContain(`href="/espace-pro/administration/offres-a-moderer/${NEXT}"`)
  })
})
