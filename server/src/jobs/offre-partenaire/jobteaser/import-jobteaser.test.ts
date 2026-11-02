import fs from "node:fs"
import { gzipSync } from "node:zlib"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { omit } from "lodash-es"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getJobteaserFlux, importJobteaserRaw, importJobteaserToComputed, type JobteaserFile, selectLatestJobteaserFile } from "./import-jobteaser"
import { processJobteaser } from "./process-jobteaser"

vi.mock("@/common/utils/sentry-utils", () => ({ sentryCaptureException: vi.fn() }))

describe("selectLatestJobteaserFile", () => {
  const file = (name: string, last_modified: string): JobteaserFile => ({ name, last_modified, mode: 420, size: 1000 })

  it("choisit le fichier au last_modified le plus récent dans une liste non triée", () => {
    const list = [file("matin.xml.gz", "2026-09-01T06:00:00Z"), file("midi.xml.gz", "2026-09-01T12:00:00Z"), file("veille.xml.gz", "2026-08-31T06:00:00Z")]

    expect(list.at(-1)?.name).toBe("veille.xml.gz")
    expect(selectLatestJobteaserFile(list)?.name).toBe("midi.xml.gz")
  })

  it("compare les dates et non les chaînes", () => {
    const list = [file("a.xml.gz", "Tue, 01 Sep 2026 12:00:00 GMT"), file("b.xml.gz", "Wed, 26 Aug 2026 06:00:00 GMT")]

    expect(selectLatestJobteaserFile(list)?.name).toBe("a.xml.gz")
  })

  it("se replie sur le dernier fichier listé et le signale quand une date est illisible", async () => {
    const { sentryCaptureException } = await import("@/common/utils/sentry-utils")
    const list = [file("a.xml.gz", "2026-09-01T12:00:00Z"), file("b.xml.gz", "hier")]

    expect(selectLatestJobteaserFile(list)?.name).toBe("b.xml.gz")
    expect(sentryCaptureException).toHaveBeenCalledOnce()
  })

  it("renvoie undefined pour un listing vide", () => {
    expect(selectLatestJobteaserFile([])).toBeUndefined()
  })
})

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("import-jobteaser", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("raw_jobteaser").deleteMany({})
    }
  })

  it("should test the import of Jobteaser data into computed_job_partners", async () => {
    const fileStream = fs.createReadStream("server/src/jobs/offre-partenaire/jobteaser/import-jobteaser.test.input.xml")
    await importJobteaserRaw(fileStream)
    expect.soft(await getDbCollection("raw_jobteaser").countDocuments({})).toBe(2)

    await importJobteaserToComputed()
    const jobs = (
      await getDbCollection("computed_jobs_partners")
        .find({ partner_label: JOBPARTNERS_LABEL.JOBTEASER }, { projection: { _id: 0, created_at: 0 } })
        .toArray()
    ).sort((a, b) => ((a.partner_job_id ?? "") < (b.partner_job_id ?? "") ? -1 : 1))
    const filtered = jobs.map((x) => omit(x, ["offer_creation", "offer_expiration"]))
    expect.soft(jobs.length).toBe(2)
    expect.soft(filtered).toMatchSnapshot()
  })
})

describe("processJobteaser (API Jobteaser simulée)", () => {
  useMongo()

  const INPUT = "server/src/jobs/offre-partenaire/jobteaser/import-jobteaser.test.input.xml"
  const listing: JobteaserFile[] = [{ name: "jobs.xml.gz", last_modified: "2026-11-01T06:00:00Z", mode: 420, size: 1000 }]

  const stubJobteaserApi = ({ token, dirs, file }: { token?: () => Promise<Response>; dirs?: () => Response; file?: () => Response }) => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/token")) return token ? token() : Response.json({ access_token: "jeton", expires_at: "" })
      if (url.endsWith("/dirs")) return dirs ? dirs() : Response.json(listing)
      if (url.includes("/files?path=")) return file ? file() : new Response(gzipSync(fs.readFileSync(INPUT)))
      throw new Error(`URL inattendue : ${url}`)
    })
    vi.stubGlobal("fetch", fetchMock)
    return fetchMock
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)
    return () => {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    }
  })

  it("importe le fichier compressé au run de nuit", async () => {
    stubJobteaserApi({})

    await processJobteaser()

    expect(await getDbCollection("raw_jobteaser").countDocuments({})).toBe(2)
  })

  it("rejette au run de nuit quand le listing échoue (authentification refusée), au lieu de rester en attente", async () => {
    stubJobteaserApi({ dirs: () => Response.json({ error: "unauthorized" }, { status: 401 }) })

    await expect(processJobteaser()).rejects.toThrow("list.map is not a function")
  }, 2_000)

  it("rejette au run de nuit quand le téléchargement du fichier est coupé", async () => {
    const compressed = gzipSync(fs.readFileSync(INPUT))
    stubJobteaserApi({
      file: () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(compressed.subarray(0, 20))
              controller.error(new Error("connexion coupée"))
            },
          })
        ),
    })

    await expect(processJobteaser()).rejects.toThrow("connexion coupée")
    expect(await getDbCollection("raw_jobteaser").countDocuments({})).toBe(0)
  }, 2_000)

  it("retente le listing au téléchargement quand la sonde a échoué sur une erreur passagère", async () => {
    let tokenCalls = 0
    stubJobteaserApi({
      token: async () => {
        tokenCalls++
        if (tokenCalls === 1) throw new TypeError("fetch failed")
        return Response.json({ access_token: "jeton", expires_at: "" })
      },
    })
    const { source } = getJobteaserFlux()

    await expect(source.probe?.()).rejects.toThrow("fetch failed")
    await expect(source.probe?.()).resolves.toMatchObject({ etag: "jobs.xml.gz", content_length: 1000 })
    expect(tokenCalls).toBe(2)
  })
})
