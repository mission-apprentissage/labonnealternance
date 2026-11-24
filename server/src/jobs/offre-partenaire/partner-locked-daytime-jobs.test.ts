import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateComputedJobsPartnersFixture } from "shared/fixtures/job-partners.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { fillComputedJobsPartners } from "./fill-computed-jobs-partners"
import { fillRomeForPartners } from "./fill-rome-for-partners"
import { acquirePartnerLock, withPartnerLocks } from "./partner-processing-lock"
import { processMissingRomeAndImportToJobPartners } from "./process-missing-rome-and-import-to-job-partners"
import { processNeverValidatedJobPartners } from "./process-never-validated-jobs-partners"

vi.mock("./fill-rome-for-partners", () => ({ fillRomeForPartners: vi.fn() }))
vi.mock("./fill-computed-jobs-partners", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./fill-computed-jobs-partners")>()),
  fillComputedJobsPartners: vi.fn(),
}))
vi.mock("./partner-processing-lock", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./partner-processing-lock")>()
  return { ...actual, withPartnerLocks: vi.fn(actual.withPartnerLocks) }
})

useMongo()

const sansRomeApresChaineComplete: Partial<IComputedJobsPartners> = {
  offer_rome_codes: null,
  validated: false,
  errors: [{ source: COMPUTED_ERROR_SOURCE.VALIDATION, error: JSON.stringify("offer_rome_codes is empty") }],
}
const jamaisValidee: Partial<IComputedJobsPartners> = {
  validated: false,
  errors: [],
  created_at: new Date(Date.now() - 3 * 60 * 60 * 1000),
}

const givenComputed = (jobs: Partial<IComputedJobsPartners>[]) => getDbCollection("computed_jobs_partners").insertMany(jobs.map((job) => generateComputedJobsPartnersFixture(job)))

const recordClaimed = (claimed: string[]) => async (context?: { addedMatchFilter?: object }) => {
  const docs = await getDbCollection("computed_jobs_partners")
    .find(context?.addedMatchFilter ?? {})
    .toArray()
  claimed.push(...docs.map(({ partner_job_id }) => partner_job_id))
  return {} as any
}

const remainingLocks = () => getDbCollection("jobs_partners_processing_locks").find({}).toArray()

describe.each([
  {
    name: "processMissingRomeAndImportToJobPartners",
    run: processMissingRomeAndImportToJobPartners,
    selectable: sansRomeApresChaineComplete,
    // job dont le traitement reçoit les seules offres revendiquées
    claimingStep: vi.mocked(fillRomeForPartners),
  },
  {
    name: "processNeverValidatedJobPartners",
    run: processNeverValidatedJobPartners,
    selectable: jamaisValidee,
    claimingStep: vi.mocked(fillComputedJobsPartners),
  },
])("$name et verrou par partenaire", ({ run, selectable, claimingStep }) => {
  beforeEach(() => {
    vi.mocked(withPartnerLocks).mockClear()
    claimingStep.mockReset()
  })

  it("ne traite pas un partenaire verrouillé par un autre traitement, traite les autres et ne verrouille que les partenaires sélectionnés", async () => {
    await givenComputed([
      { ...selectable, partner_job_id: "en-cours-d-import", partner_label: JOBPARTNERS_LABEL.HELLOWORK },
      { ...selectable, partner_job_id: "libre", partner_label: JOBPARTNERS_LABEL.KELIO },
    ])
    await acquirePartnerLock(JOBPARTNERS_LABEL.HELLOWORK, "import-hellowork")
    const claimed: string[] = []
    claimingStep.mockImplementation(recordClaimed(claimed))

    await run()

    expect.soft(claimed).toEqual(["libre"])
    expect.soft(vi.mocked(withPartnerLocks).mock.calls.map(([partnerLabels]) => [...partnerLabels].sort())).toEqual([[JOBPARTNERS_LABEL.HELLOWORK, JOBPARTNERS_LABEL.KELIO]])
    expect.soft(await remainingLocks()).toEqual([expect.objectContaining({ _id: JOBPARTNERS_LABEL.HELLOWORK, owner: "import-hellowork" })])
  })

  it("(near-miss) ne prend aucun verrou quand rien n'est sélectionné", async () => {
    await givenComputed([{ partner_job_id: "deja-validee", partner_label: JOBPARTNERS_LABEL.KELIO, validated: true, errors: [], offer_rome_codes: ["G1602"] }])

    await expect(run()).resolves.toEqual({ selected: 0 })

    expect.soft(vi.mocked(withPartnerLocks)).not.toHaveBeenCalled()
    expect.soft(claimingStep).not.toHaveBeenCalled()
  })
})
