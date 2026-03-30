import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import nock from "nock"
import type { IDiagorienteClassificationResponseSchema } from "shared"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { nockDiagorienteAccessToken, nockDiagorienteRomeClassifier } from "@/common/apis/diagoriente/diagoriente.client.fixture"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { processMissingRomeAndImportToJobPartners } from "./processMissingRomeAndImportToJobPartners"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("processMissingRomeAndImportToJobPartners", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      nock.cleanAll()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it("reprocesses offers with null or empty rome arrays, validates them, and imports them", async () => {
    const computedJobs = await givenSomeComputedJobPartners([
      {
        partner_job_id: "missing-rome-null",
        offer_title: "Chef de partie, second de cuisine H/F",
        workplace_naf_label: "Commerce de détail d'habillement en magasin spécialisé",
        offer_description: "Description suffisamment longue pour etre qualifiee par Diagoriente et passer la validation finale.",
        offer_rome_codes: null,
      },
      {
        partner_job_id: "missing-rome-empty-array",
        offer_title: "Serveur en restauration H/F",
        workplace_naf_label: "Restauration traditionnelle",
        offer_description: "Une autre description suffisamment longue pour etre qualifiee par Diagoriente et etre importee.",
        offer_rome_codes: [],
      },
    ])

    const apiResponseDiagoriente: IDiagorienteClassificationResponseSchema = {
      [computedJobs[0]._id.toString()]: {
        classify_results: [
          {
            data: {
              _key: "key-1",
              item_version_id: "version-id-1",
              item_id: "item-id-1",
              titre: "Chef de partie, second de cuisine",
              valid_from: "2024-01-01",
              rome: "G1602",
              valid_to: null,
              item_type: "SousDomaine",
            },
          },
        ],
      },
      [computedJobs[1]._id.toString()]: {
        classify_results: [
          {
            data: {
              _key: "key-2",
              item_version_id: "version-id-2",
              item_id: "item-id-2",
              titre: "Serveur en restauration",
              valid_from: "2024-01-01",
              rome: "G1803",
              valid_to: null,
              item_type: "SousDomaine",
            },
          },
        ],
      },
    }

    nockDiagorienteAccessToken()
    nockDiagorienteRomeClassifier(
      computedJobs.map(({ _id, offer_title, workplace_naf_label, offer_description }) => ({
        id: _id.toString(),
        title: offer_title!,
        sector: workplace_naf_label ?? "",
        description: offer_description ?? "",
      })),
      apiResponseDiagoriente
    )

    await processMissingRomeAndImportToJobPartners()

    const updatedComputedJobs = await getDbCollection("computed_jobs_partners")
      .find({ partner_job_id: { $in: ["missing-rome-null", "missing-rome-empty-array"] } })
      .toArray()
    const importedJobs = await getDbCollection("jobs_partners")
      .find({ partner_job_id: { $in: ["missing-rome-null", "missing-rome-empty-array"] } })
      .toArray()

    expect.soft(updatedComputedJobs).toHaveLength(2)
    expect.soft(importedJobs).toHaveLength(2)

    for (const job of updatedComputedJobs) {
      expect.soft(job.currently_processed_id).toBeNull()
      expect.soft(job.validated).toBe(true)
      expect.soft(job.business_error).toBeNull()
      expect.soft(job.offer_rome_codes?.length).toBe(1)
    }

    for (const job of importedJobs) {
      expect.soft(job.offer_rome_codes?.length).toBe(1)
      expect.soft(job.lba_url).toBeTruthy()
    }
  })
})
