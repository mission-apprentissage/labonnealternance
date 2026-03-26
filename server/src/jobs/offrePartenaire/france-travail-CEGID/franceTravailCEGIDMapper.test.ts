import fs from "node:fs/promises"
import omit from "lodash-es/omit"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockGeolocApi } from "@/jobs/offrePartenaire/france-travail-CEGID/mockGeolocApi"
import type { IFranceTravailCEGIDJob } from "./franceTravailCEGIDMapper"
import { franceTravailCEGIDMapper } from "./franceTravailCEGIDMapper"
import { parseAgences } from "./mappingAgences"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("franceTravailCEGIDMapper", async () => {
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
  const filecontent = (await fs.readFile("server/src/jobs/offrePartenaire/france-travail-CEGID/franceTravailCEGIDMapper.test.input.json")).toString()
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
