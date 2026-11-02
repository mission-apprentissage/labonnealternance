import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { afterEach, describe, expect, it } from "vitest"

import config from "@/config"
import { getDaytimeRefreshPartners } from "./daytime-refresh-partners"

describe("getDaytimeRefreshPartners", () => {
  const configured = config.daytimeRefreshPartners

  afterEach(() => {
    config.daytimeRefreshPartners = configured
  })

  it("n'active aucun partenaire sans configuration", () => {
    expect.soft(configured).toEqual([])
    expect.soft(getDaytimeRefreshPartners()).toEqual([])
  })

  it("renvoie les partenaires configurés, espaces autour des virgules et doublons retirés", () => {
    config.daytimeRefreshPartners = ["Jobteaser", " France Travail ", "Jobteaser", " "]

    expect(getDaytimeRefreshPartners()).toEqual([JOBPARTNERS_LABEL.JOBTEASER, JOBPARTNERS_LABEL.FRANCE_TRAVAIL])
  })

  it.each([
    ["une casse différente", "jobteaser"],
    ["un libellé inconnu", "Indeed"],
    ["les recruteurs LBA, hors flux", JOBPARTNERS_LABEL.RECRUTEURS_LBA],
    ["les offres LBA, hors flux", JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA],
  ])("refuse %s plutôt que de l'ignorer", (_, label) => {
    config.daytimeRefreshPartners = [JOBPARTNERS_LABEL.JOBTEASER, label]

    expect(() => getDaytimeRefreshPartners()).toThrow(`LBA_DAYTIME_REFRESH_PARTNERS : ${label} hors des partenaires flux`)
  })
})
