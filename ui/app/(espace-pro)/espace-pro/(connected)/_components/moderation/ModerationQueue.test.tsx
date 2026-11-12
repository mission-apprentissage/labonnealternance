import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { IModerationQueueState } from "./moderation-queue-state"

const mocks = vi.hoisted(() => ({
  queries: [] as { queryKey: unknown[]; queryFn: () => unknown }[],
  getModerationQueue: vi.fn(),
}))

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: (options: { queryKey: unknown[]; queryFn: () => unknown }) => {
    mocks.queries.push(options)
    return { data: undefined, isLoading: true, isError: false, isPlaceholderData: false, isFetching: true }
  },
}))

vi.mock("@/utils/api", () => ({
  getModerationQueue: mocks.getModerationQueue,
  getModerationSummaries: vi.fn(),
  reclassifyFailedModerationJobs: vi.fn(),
}))

const { ModerationQueueContent } = await import("./ModerationQueue")

const RESTORED: IModerationQueueState = {
  conformity: ["a_verifier"],
  account_status: [],
  account_type: ["CFA"],
  opco: [],
  search: "Menuiserie",
  sort: "recruiter",
  order: "asc",
  offset: 50,
}

const queueQuery = () => mocks.queries.find(({ queryKey }) => queryKey[0] === "moderation-queue")

beforeEach(() => {
  mocks.queries = []
  mocks.getModerationQueue.mockReset()
})

describe("ModerationQueueContent", () => {
  it("reprend les filtres, le tri et la page de l'état relu", () => {
    const html = renderToStaticMarkup(<ModerationQueueContent userType="ADMIN" initialState={RESTORED} />)
    queueQuery()?.queryFn()

    expect(html).toContain('value="Menuiserie"')
    expect(mocks.getModerationQueue).toHaveBeenCalledWith({
      conformity: ["a_verifier"],
      account_status: undefined,
      account_type: ["CFA"],
      opco: undefined,
      search: "Menuiserie",
      sort: "recruiter",
      order: "asc",
      limit: 50,
      offset: 50,
    })
  })

  it("part de la file par défaut sans état relu", () => {
    const html = renderToStaticMarkup(<ModerationQueueContent userType="ADMIN" initialState={null} />)
    queueQuery()?.queryFn()

    expect(html).not.toContain('value="Menuiserie"')
    expect(mocks.getModerationQueue).toHaveBeenCalledWith(expect.objectContaining({ sort: "created_at", order: "desc", offset: 0, search: undefined, conformity: undefined }))
  })
})
