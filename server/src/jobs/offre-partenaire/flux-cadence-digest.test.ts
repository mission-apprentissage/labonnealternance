import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getFluxCadenceByPartner } from "./flux-cadence-digest"

describe("getFluxCadenceByPartner", () => {
  useMongo()

  const since = new Date("2026-11-01T05:30:00.000Z")
  const check = (iso: string, changed: boolean, skipped: boolean) => ({ checked_at: new Date(iso), changed, skipped })

  it("ne renvoie rien tant qu'aucun flux n'a de signal", async () => {
    await expect(getFluxCadenceByPartner(since)).resolves.toEqual(new Map())
  })

  it("compte par partenaire les runs, runs sautés et changements de la fenêtre", async () => {
    await getDbCollection("jobs_partners_flux_signals").insertMany([
      {
        _id: new ObjectId(),
        partner_label: JOBPARTNERS_LABEL.PASS,
        changed_at: new Date("2026-11-01T13:05:00.000Z"),
        checks: [
          check("2026-10-31T23:00:00.000Z", true, false),
          check("2026-11-01T00:00:00.000Z", false, false),
          check("2026-11-01T09:00:00.000Z", false, true),
          check("2026-11-01T13:05:00.000Z", true, false),
        ],
      },
      { _id: new ObjectId(), partner_label: JOBPARTNERS_LABEL.APEC, changed_at: null, checks: [check("2026-11-01T06:00:00.000Z", false, true)] },
    ])

    await expect(getFluxCadenceByPartner(since)).resolves.toEqual(
      new Map([
        [JOBPARTNERS_LABEL.PASS, { runs: 2, skipped: 1, changed: 1, changed_at: new Date("2026-11-01T13:05:00.000Z") }],
        [JOBPARTNERS_LABEL.APEC, { runs: 1, skipped: 1, changed: 0, changed_at: null }],
      ])
    )
  })
})
