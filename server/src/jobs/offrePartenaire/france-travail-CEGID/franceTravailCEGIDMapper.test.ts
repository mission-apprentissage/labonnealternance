import fs from "node:fs/promises"
import { beforeEach, describe, expect, it, vi } from "vitest"

import omit from "lodash-es/omit"
import type { IFranceTravailCEGIDJob } from "./franceTravailCEGIDMapper"
import { franceTravailCEGIDMapper } from "./franceTravailCEGIDMapper"
import { parseAgences } from "./mappingAgences"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("franceTravailCEGIDMapper", async () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    return () => {
      vi.useRealTimers()
    }
  })
  const agences = await parseAgences()
  const filecontent = (await fs.readFile("server/src/jobs/offrePartenaire/france-travail-CEGID/franceTravailCEGIDMapper.test.input.json")).toString()
  const jobBase = JSON.parse(filecontent) as IFranceTravailCEGIDJob

  it("should convert a job", async () => {
    expect.soft(omit(franceTravailCEGIDMapper(jobBase, agences), ["_id"])).toMatchSnapshot()
  })
  it("should convert a job without department field", async () => {
    const job: IFranceTravailCEGIDJob = {
      ...jobBase,
      department: undefined,
    }
    expect.soft(omit(franceTravailCEGIDMapper(job, agences), ["_id"])).toMatchSnapshot()
  })
  it("should convert a job without department field and region field", async () => {
    const job: IFranceTravailCEGIDJob = {
      ...jobBase,
      department: undefined,
      region: undefined,
    }
    expect.soft(omit(franceTravailCEGIDMapper(job, agences), ["_id"])).toMatchSnapshot()
  })
})
