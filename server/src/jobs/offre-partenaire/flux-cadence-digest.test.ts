import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { formatFluxCadenceSection } from "./flux-cadence-digest"

describe("formatFluxCadenceSection", () => {
  useMongo()

  const since = new Date("2026-11-01T05:30:00.000Z")
  const check = (iso: string, changed: boolean, skipped: boolean) => ({ checked_at: new Date(iso), changed, skipped })

  it("n'ajoute rien tant qu'aucun flux n'a de signal", async () => {
    await expect(formatFluxCadenceSection(since)).resolves.toEqual([])
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

    await expect(formatFluxCadenceSection(since)).resolves.toEqual([
      "",
      "Cadence de changement des flux :",
      "```",
      "Partenaire Runs Sautés Chgts Dernier chgt",
      "APEC          1      1     0 jamais",
      "PASS          2      1     1 01/11 14:05",
      "```",
    ])
  })
})
