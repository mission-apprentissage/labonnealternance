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

  it("should map contract_duration from details.customFields", async () => {
    const job: IFranceTravailCEGIDJob = {
      ...jobBase,
      details: {
        customFields: {
          offerCustomBlock4: {
            customCodeTable2: {
              clientCode: "12_mois",
              type: null,
            },
          },
        },
      },
    }
    const result = franceTravailCEGIDMapper(job, agences)
    expect(result).not.toBeNull()
    expect(result?.contract_duration).toBe(12)
  })

  it("should return null for offers with contract duration < 6 months", async () => {
    const job: IFranceTravailCEGIDJob = {
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
    }
    expect(franceTravailCEGIDMapper(job, agences)).toBeNull()
  })

  it("should include offers with contract duration exactly 6 months", async () => {
    const job: IFranceTravailCEGIDJob = {
      ...jobBase,
      details: {
        customFields: {
          offerCustomBlock4: {
            customCodeTable2: {
              clientCode: "6_mois",
              type: null,
            },
          },
        },
      },
    }
    const result = franceTravailCEGIDMapper(job, agences)
    expect(result).not.toBeNull()
    expect(result?.contract_duration).toBe(6)
  })

  it("should include offers with DUREE_A_DEFINIR and contract_duration undefined", async () => {
    const job: IFranceTravailCEGIDJob = {
      ...jobBase,
      details: {
        customFields: {
          offerCustomBlock4: {
            customCodeTable2: {
              clientCode: "DUREE_A_DEFINIR",
              type: null,
            },
          },
        },
      },
    }
    const result = franceTravailCEGIDMapper(job, agences)
    expect(result).not.toBeNull()
    expect(result?.contract_duration).toBeUndefined()
  })
})
