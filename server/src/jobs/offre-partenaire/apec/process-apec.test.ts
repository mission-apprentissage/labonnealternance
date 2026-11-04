import fs from "node:fs"
import { Readable } from "node:stream"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getApecJobs, getApecJobsStats } from "@/common/apis/apec/apec.client"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { isFluxSkipped } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { processApec } from "./process-apec"

vi.mock("@/common/apis/apec/apec.client")
vi.mock("@/services/referentiel/commune/commune.referentiel.service", () => ({
  getCodePostalFromInsee: vi.fn().mockResolvedValue(null),
}))

const INPUT = "server/src/jobs/offre-partenaire/apec/import-apec.test.input.xml"
const stats = { mtime: new Date("2026-11-01T03:00:00.000Z"), size: fs.statSync(INPUT).size }

describe("processApec", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2024-07-21T04:49:06.000+02:00"))
    vi.mocked(getApecJobs).mockImplementation(async () => ({ stream: fs.createReadStream(INPUT), stats }))
    vi.mocked(getApecJobsStats).mockResolvedValue(stats)
    return () => vi.useRealTimers()
  })

  it("saute sans télécharger quand la date et la taille du fichier SFTP sont inchangées", async () => {
    await processApec()
    expect(await getDbCollection("raw_apec").countDocuments({})).toBe(5)
    vi.mocked(getApecJobs).mockClear()

    const result = await processApec({ skipIfUnchanged: true })

    expect(result).toEqual({ skipped: true, reason: "validateurs inchangés" })
    expect(getApecJobs).not.toHaveBeenCalled()
  })

  it("retraite quand le fichier SFTP a été réécrit", async () => {
    await processApec()
    vi.mocked(getApecJobsStats).mockResolvedValue({ ...stats, mtime: new Date("2026-11-02T03:00:00.000Z") })
    const rewritten = fs.readFileSync(INPUT, "utf8").replace("</Export_offres>", "<!-- v2 --></Export_offres>")
    vi.mocked(getApecJobs).mockClear()
    vi.mocked(getApecJobs).mockImplementation(async () => ({
      stream: Readable.from([rewritten]),
      stats: { ...stats, mtime: new Date("2026-11-02T03:00:00.000Z") },
    }))

    // rawToComputedJobsPartners distingue le lot en cours du précédent par created_at
    vi.setSystemTime(Date.now() + 60_000)
    const result = await processApec({ skipIfUnchanged: true })

    expect(isFluxSkipped(result)).toBe(false)
    expect(getApecJobs).toHaveBeenCalledTimes(1)
  })
})
