import { createComputedJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { addJob } from "job-processor"
import type { Filter } from "mongodb"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { acquirePartnerLock, releasePartnerLock } from "./partner-processing-lock"
import { PROCESS_WITH_FILTER_RETRY_DELAY_MS, processJobPartnersWithFilter } from "./process-job-partners-for-api"

vi.mock("job-processor", async (importOriginal) => ({ ...(await importOriginal<typeof import("job-processor")>()), addJob: vi.fn() }))
// Cf. process-job-partners-for-api.test.ts : les documents du test sont déjà validés.
vi.mock("./fill-computed-jobs-partners", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./fill-computed-jobs-partners")>()),
  fillComputedJobsPartners: vi.fn(async () => ({})),
}))

useMongo()

const A = JOBPARTNERS_LABEL.JOBTEASER
const B = JOBPARTNERS_LABEL.KELIO

const isPublished = async (partner_label: string, partner_job_id: string) => (await getDbCollection("jobs_partners").countDocuments({ partner_label, partner_job_id })) === 1

describe("processJobPartnersWithFilter (reprise après classification batch) et verrou par partenaire", () => {
  beforeEach(() => {
    vi.mocked(addJob).mockReset()
  })

  it("ne traite pas un partenaire en plein cycle, traite les autres, et replanifie la part verrouillée qui est reprise ensuite", async () => {
    const enCycle = await createComputedJobPartner({ partner_label: A, partner_job_id: "classee_pendant_le_cycle", validated: true })
    const libre = await createComputedJobPartner({ partner_label: B, partner_job_id: "classee_libre", validated: true })
    const filter: Filter<IComputedJobsPartners> = { _id: { $in: [enCycle._id, libre._id] } }
    await acquirePartnerLock(A, "cycle de journée")
    const before = Date.now()

    await processJobPartnersWithFilter(filter)

    expect.soft(await isPublished(B, "classee_libre")).toBe(true)
    expect.soft(await isPublished(A, "classee_pendant_le_cycle")).toBe(false)
    // computed conservé : l'annulation du cycle en cours en a besoin
    expect.soft(await getDbCollection("computed_jobs_partners").countDocuments({ _id: enCycle._id })).toBe(1)
    expect.soft(addJob).toHaveBeenCalledTimes(1)
    const [{ name, payload, queued, scheduled_for }] = vi.mocked(addJob).mock.calls[0]
    expect.soft({ name, payload, queued }).toEqual({ name: "processJobPartnersWithFilter", payload: { $and: [filter, { partner_label: { $in: [A] } }] }, queued: true })
    expect.soft(scheduled_for!.getTime()).toBeGreaterThanOrEqual(before + PROCESS_WITH_FILTER_RETRY_DELAY_MS)

    await releasePartnerLock(A, "cycle de journée")
    vi.mocked(addJob).mockReset()
    await processJobPartnersWithFilter(payload as Filter<IComputedJobsPartners>)

    expect.soft(await isPublished(A, "classee_pendant_le_cycle")).toBe(true)
    expect.soft(await getDbCollection("computed_jobs_partners").countDocuments({ _id: enCycle._id })).toBe(0)
    expect.soft(addJob).not.toHaveBeenCalled()
    expect.soft(await getDbCollection("jobs_partners_processing_locks").countDocuments({})).toBe(0)
  })

  it("(near-miss) sans verrou concurrent, traite tout sans rien replanifier", async () => {
    const a = await createComputedJobPartner({ partner_label: A, partner_job_id: "a", validated: true })
    const b = await createComputedJobPartner({ partner_label: B, partner_job_id: "b", validated: true })

    await processJobPartnersWithFilter({ _id: { $in: [a._id, b._id] } })

    expect.soft(await isPublished(A, "a")).toBe(true)
    expect.soft(await isPublished(B, "b")).toBe(true)
    expect.soft(addJob).not.toHaveBeenCalled()
  })
})
