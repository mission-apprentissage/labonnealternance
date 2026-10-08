import fs from "node:fs/promises"
import omit from "lodash-es/omit"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockGeolocApi } from "@/jobs/offre-partenaire/france-travail-CEGID/mock-geoloc-api"
import type { IFranceTravailCEGIDJob } from "./france-travail-cegid-mapper"
import { franceTravailCEGIDMapper } from "./france-travail-cegid-mapper"
import { parseAgences } from "./mapping-agences"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("france-travail-cegid-mapper", async () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)
    const mockGeoloc = mockGeolocApi()

    return () => {
      vi.useRealTimers()
      mockGeoloc.persist(false)
    }
  })
  const agences = await parseAgences()
  const context = { agences }
  const filecontent = (await fs.readFile("server/src/jobs/offre-partenaire/france-travail-CEGID/france-travail-cegid-mapper.test.input.json")).toString()
  const jobBase = JSON.parse(filecontent) as IFranceTravailCEGIDJob

  it("should convert a job", async () => {
    expect.soft(omit(await franceTravailCEGIDMapper(jobBase, context), ["_id"])).toMatchSnapshot()
  })
  it("should convert a job without department field", async () => {
    const job: IFranceTravailCEGIDJob = {
      ...jobBase,
      department: undefined,
    }
    expect.soft(omit(await franceTravailCEGIDMapper(job, context), ["_id"])).toMatchSnapshot()
  })
  it("should convert a job without department field and region field", async () => {
    const job: IFranceTravailCEGIDJob = {
      ...jobBase,
      department: undefined,
      region: undefined,
    }
    expect.soft(omit(await franceTravailCEGIDMapper(job, context), ["_id"])).toMatchSnapshot()
  })
  it("should block the job as CFA when offerUrl contains directemploi, whatever the case", async () => {
    const job: IFranceTravailCEGIDJob = { ...jobBase, offerUrl: "https://www.DirectEmploi.com/offre/123" }
    expect.soft((await franceTravailCEGIDMapper(job, context))?.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.CFA)
  })

  it("should not block the job when offerUrl does not contain directemploi", async () => {
    expect.soft((await franceTravailCEGIDMapper(jobBase, context))?.business_error).toEqual(null)
  })

  it("should return null if contract duration < 6 months", async () => {
    expect
      .soft(
        await franceTravailCEGIDMapper(
          {
            ...jobBase,
            details: {
              customFields: {
                offerCustomBlock4: {
                  customCodeTable2: {
                    clientCode: "3_mois",
                    type: null,
                  },
                },
              },
            },
          },
          context
        )
      )
      .toEqual(null)
  })
})
