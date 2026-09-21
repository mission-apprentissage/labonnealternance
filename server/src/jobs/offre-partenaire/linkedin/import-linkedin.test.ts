import fs from "node:fs"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { importLinkedinRaw, importLinkedinToComputed } from "./import-linkedin"

const now = new Date("2026-09-16T10:00:00.000Z")

describe("import-linkedin", () => {
  useMongo()

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)

    return async () => {
      vi.useRealTimers()
      await getDbCollection("computed_jobs_partners").deleteMany({})
      await getDbCollection("raw_linkedin").deleteMany({})
    }
  })

  it("importe le flux dans raw_linkedin puis computed_jobs_partners", async () => {
    // La fixture reproduit les particularités du flux réel : racine <jobs>, offres <job> sans
    // attributs (d'où conflictingOpeningTagWithoutAttributes), contenu en CDATA, description HTML,
    // et balises vides sous leurs deux formes (<city></city> et <city/>).
    const fileStream = fs.createReadStream("server/src/jobs/offre-partenaire/linkedin/import-linkedin.test.input.xml")
    await importLinkedinRaw(fileStream)
    expect.soft(await getDbCollection("raw_linkedin").countDocuments({})).toBe(3)

    await importLinkedinToComputed()
    const jobs = (
      await getDbCollection("computed_jobs_partners")
        .find({ partner_label: JOBPARTNERS_LABEL.LINKEDIN }, { projection: { _id: 0, created_at: 0, updated_at: 0 } })
        .toArray()
    ).sort((a, b) => ((a.partner_job_id ?? "") < (b.partner_job_id ?? "") ? -1 : 1))

    expect.soft(jobs.length).toBe(3)
    expect.soft(jobs).toMatchSnapshot()
  })

  it("écarte l'offre hors alternance et retient les deux autres", async () => {
    const fileStream = fs.createReadStream("server/src/jobs/offre-partenaire/linkedin/import-linkedin.test.input.xml")
    await importLinkedinRaw(fileStream)
    await importLinkedinToComputed()

    const byId = Object.fromEntries(
      (await getDbCollection("computed_jobs_partners").find({ partner_label: JOBPARTNERS_LABEL.LINKEDIN }).toArray()).map((job) => [job.partner_job_id, job])
    )

    // Titre sans mention d'alternance, malgré une description qui en parle.
    expect.soft(byId["4180234558"].business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.FULL_TIME)
    expect.soft(byId["4456210807"].business_error).toBeNull()
    expect.soft(byId["4443793142"].business_error).toBeNull()

    // <city/> et <postalCode/> vides : repli sur le premier segment de location.
    expect.soft(byId["4443793142"].workplace_address_city).toBe("La Tessoualle")
    expect.soft(byId["4443793142"].workplace_address_zipcode).toBeNull()

    // <expirationDate/> absente : repli à creation + 60 jours.
    expect.soft(byId["4443793142"].offer_expiration).toEqual(new Date("2026-11-11T09:30:00.000Z"))

    // Le paramètre de tracking est ajouté derrière le trk= déjà présent dans le flux.
    expect.soft(byId["4456210807"].apply_url).toContain("&mcid=7503545590606254081")
  })
})
