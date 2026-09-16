import { TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { describe, expect, it } from "vitest"
import type { ILinkedinJob } from "./linkedin-mapper"
import { buildApplyUrl, getCity, linkedinJobToJobsPartners, parseLinkedinDate } from "./linkedin-mapper"

const baseJob: ILinkedinJob = {
  id: "4456210807",
  title: "Alternance - Commercial CHD bilingue Allemand",
  description: "<p>Nous recherchons un alternant pour rejoindre notre équipe commerciale sur la région Grand Est.</p>",
  location: "Strasbourg, Grand Est, France",
  city: "Strasbourg",
  state: "Grand Est",
  postalCode: "67000",
  country: "FR",
  url: "https://www.linkedin.com/jobs/view/4456210807?trk=li_dgefp_FR_careers_jobsgtm_27d99f0f_job-dist&utm_medium=jobdist",
  company: "ST MICHEL BISCUITS",
  listDate: "September 15, 2026 at 8:14:58 AM UTC",
  expirationDate: "November 3, 2026 at 10:17:52 PM UTC",
  linkedinCompanyId: "4976218",
  linkedinCompanyUrl: "https://www.linkedin.com/company/4976218",
  jobFunction: "BD",
  experienceLevel: "ENTRY_LEVEL",
  employmentStatus: "FULL_TIME",
  industries: "Food and Beverage Manufacturing",
}

describe("parseLinkedinDate", () => {
  it("parse le format LinkedIn en UTC", () => {
    expect(parseLinkedinDate("September 15, 2026 at 8:14:58 AM UTC")).toEqual(new Date("2026-09-15T08:14:58.000Z"))
  })

  it("gère l'après-midi", () => {
    expect(parseLinkedinDate("November 3, 2026 at 10:17:52 PM UTC")).toEqual(new Date("2026-11-03T22:17:52.000Z"))
  })

  it("gère minuit et midi", () => {
    expect(parseLinkedinDate("January 1, 2026 at 12:00:00 AM UTC")).toEqual(new Date("2026-01-01T00:00:00.000Z"))
    expect(parseLinkedinDate("January 1, 2026 at 12:00:00 PM UTC")).toEqual(new Date("2026-01-01T12:00:00.000Z"))
  })

  it("retourne null sur une date absente ou illisible", () => {
    expect(parseLinkedinDate(null)).toBeNull()
    expect(parseLinkedinDate("15/09/2026")).toBeNull()
    expect(parseLinkedinDate("Septembre 15, 2026 at 8:14:58 AM UTC")).toBeNull()
  })
})

describe("getCity", () => {
  it("utilise city quand il est renseigné", () => {
    expect(getCity(baseJob)).toBe("Strasbourg")
  })

  it("retombe sur le premier segment de location quand city est vide", () => {
    expect(getCity({ ...baseJob, city: "", location: "Isère, Auvergne-Rhône-Alpes, France" })).toBe("Isère")
  })

  it("retourne null quand les deux sont absents", () => {
    expect(getCity({ ...baseJob, city: "", location: null })).toBeNull()
  })
})

describe("buildApplyUrl", () => {
  it("ajoute le paramètre de tracking derrière les paramètres existants", () => {
    expect(buildApplyUrl("https://www.linkedin.com/jobs/view/1?trk=abc")).toBe("https://www.linkedin.com/jobs/view/1?trk=abc&mcid=7503545590606254081")
  })

  it("ouvre la query string quand l'URL n'en a pas", () => {
    expect(buildApplyUrl("https://www.linkedin.com/jobs/view/1")).toBe("https://www.linkedin.com/jobs/view/1?mcid=7503545590606254081")
  })

  it("n'ajoute pas le paramètre deux fois", () => {
    const url = "https://www.linkedin.com/jobs/view/1?trk=abc&mcid=7503545590606254081"
    expect(buildApplyUrl(url)).toBe(url)
  })
})

describe("linkedinJobToJobsPartners", () => {
  it("mappe une offre d'alternance sans erreur métier", () => {
    const result = linkedinJobToJobsPartners(baseJob)

    expect(result.partner_label).toBe(JOBPARTNERS_LABEL.LINKEDIN)
    expect(result.partner_job_id).toBe("4456210807")
    expect(result.offer_title).toBe(baseJob.title)
    expect(result.offer_description).toBe(baseJob.description)
    expect(result.offer_creation).toEqual(new Date("2026-09-15T08:14:58.000Z"))
    expect(result.offer_expiration).toEqual(new Date("2026-11-03T22:17:52.000Z"))
    expect(result.offer_multicast).toBe(false)
    expect(result.contract_type).toEqual([TRAINING_CONTRACT_TYPE.APPRENTISSAGE])
    expect(result.workplace_name).toBe("ST MICHEL BISCUITS")
    expect(result.workplace_address_city).toBe("Strasbourg")
    expect(result.workplace_address_zipcode).toBe("67000")
    expect(result.workplace_address_label).toBe("Strasbourg 67000")
    expect(result.apply_url).toContain("mcid=7503545590606254081")
    expect(result.business_error).toBeNull()
  })

  it("marque FULL_TIME une offre sans mention d'alternance", () => {
    const result = linkedinJobToJobsPartners({
      ...baseJob,
      title: "Ingénieur en mécanique F/H",
      description: "<p>Prime Engineering recherche un ingénieur confirmé pour ses projets industriels.</p>",
    })

    expect(result.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.FULL_TIME)
  })

  it("détecte le contrat de professionnalisation", () => {
    const result = linkedinJobToJobsPartners({
      ...baseJob,
      description: "<p>Poste ouvert en contrat de professionnalisation sur 12 mois.</p>",
    })

    expect(result.contract_type).toEqual([TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION])
    expect(result.business_error).toBeNull()
  })

  it("marque WRONG_DATA une offre au contenu inexploitable", () => {
    expect(linkedinJobToJobsPartners({ ...baseJob, description: "alternance" }).business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA)
    expect(linkedinJobToJobsPartners({ ...baseJob, title: "A" }).business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA)
  })

  it("retombe sur location quand ville et code postal sont absents", () => {
    const result = linkedinJobToJobsPartners({ ...baseJob, city: "", postalCode: "", location: "Isère, Auvergne-Rhône-Alpes, France" })

    expect(result.workplace_address_city).toBe("Isère")
    expect(result.workplace_address_zipcode).toBeNull()
    expect(result.workplace_address_label).toBe("Isère")
  })
})
