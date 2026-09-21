import { TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { describe, expect, it } from "vitest"
import type { ILinkedinJob } from "./linkedin-mapper"
import { buildApplyUrl, getCity, getContractType, linkedinJobToJobsPartners, parseLinkedinDate, ZLinkedinJob } from "./linkedin-mapper"

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
  listDate: new Date("2026-09-15T08:14:58.000Z"),
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
    expect(parseLinkedinDate("2026-09-15T08:14:58Z")).toBeNull()
  })

  it("rejette une date calendairement impossible plutôt que de la reporter", () => {
    // Date.UTC(2026, 1, 31) donnerait le 3 mars sans contrôle.
    expect(parseLinkedinDate("February 31, 2026 at 8:00:00 AM UTC")).toBeNull()
    expect(parseLinkedinDate("April 31, 2026 at 8:00:00 AM UTC")).toBeNull()
    expect(parseLinkedinDate("February 29, 2028 at 8:00:00 AM UTC")).toEqual(new Date("2028-02-29T08:00:00.000Z"))
  })
})

describe("ZLinkedinJob", () => {
  const rawJob = {
    id: "1",
    title: "Alternance - Chargé de communication",
    description: "Une description suffisamment longue pour passer le contrôle de taille minimale.",
    url: "https://www.linkedin.com/jobs/view/1",
    company: "ACME",
    listDate: "September 15, 2026 at 8:14:58 AM UTC",
  }

  it("convertit listDate en Date", () => {
    const parsed = ZLinkedinJob.parse(rawJob)
    expect(parsed.listDate).toEqual(new Date("2026-09-15T08:14:58.000Z"))
  })

  it("rejette l'offre si le format de listDate change", () => {
    // Un changement de format côté LinkedIn doit remonter en erreur, pas être avalé silencieusement.
    const result = ZLinkedinJob.safeParse({ ...rawJob, listDate: "2026-09-15T08:14:58Z" })
    expect(result.success).toBe(false)
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

  it("ne confond pas mcid avec un paramètre dont le nom se termine par mcid", () => {
    expect(buildApplyUrl("https://www.linkedin.com/jobs/view/1?epmcid=xyz")).toBe("https://www.linkedin.com/jobs/view/1?epmcid=xyz&mcid=7503545590606254081")
  })

  it("insère le paramètre avant le fragment", () => {
    expect(buildApplyUrl("https://www.linkedin.com/jobs/view/1?trk=abc#apply")).toBe("https://www.linkedin.com/jobs/view/1?trk=abc&mcid=7503545590606254081#apply")
  })
})

describe("getContractType", () => {
  const job = (title: string, description: string) => ({ ...baseJob, title, description })

  it("retient l'apprentissage par défaut", () => {
    expect(getContractType(job("Alternance - Chargé de communication", "Poste en alternance."))).toEqual([TRAINING_CONTRACT_TYPE.APPRENTISSAGE])
  })

  it("retient la professionnalisation seule quand l'apprentissage n'apparaît nulle part", () => {
    expect(getContractType(job("Chargé de communication", "Poste en contrat de professionnalisation."))).toEqual([TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION])
  })

  it("retient les deux quand les deux sont mentionnés", () => {
    // Retirer l'apprentissage rendrait l'offre invisible pour les candidats qui filtrent dessus.
    expect(getContractType(job("Alternance - Chargé de communication", "En contrat d'apprentissage ou de professionnalisation."))).toEqual([
      TRAINING_CONTRACT_TYPE.APPRENTISSAGE,
      TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION,
    ])
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

  it("complète le type de contrat depuis la description", () => {
    // Titre "Alternance …" + professionnalisation en description : les deux sont retenus.
    const result = linkedinJobToJobsPartners({
      ...baseJob,
      description: "<p>Poste ouvert en contrat de professionnalisation sur 12 mois.</p>",
    })

    expect(result.contract_type).toEqual([TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION])
    expect(result.business_error).toBeNull()
  })

  it("écarte une offre dont seule la description mentionne l'alternance", () => {
    // Boilerplate d'entreprise : le titre ne parle pas d'alternance, l'offre n'en est pas une.
    const result = linkedinJobToJobsPartners({
      ...baseJob,
      title: "Data Engineer Snowflake",
      description: "<p>Nous recrutons en CDI, stage et alternance sur toute la France.</p>",
    })

    expect(result.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.FULL_TIME)
  })

  it("retient un titre où le mot alternance n'est pas contractuel", () => {
    // Limite connue et assumée : "alternance" en français désigne aussi la rotation d'équipes.
    // Le cas est rare dans un titre d'offre, et le couvrir demanderait une analyse sémantique.
    const result = linkedinJobToJobsPartners({
      ...baseJob,
      title: "Responsable d'atelier - équipes en alternance 2*8",
      description: "<p>Pilotage de la production sur un site industriel de 200 personnes.</p>",
    })

    expect(result.business_error).toBeNull()
  })

  it("marque WRONG_DATA une offre au contenu inexploitable", () => {
    expect(linkedinJobToJobsPartners({ ...baseJob, description: "court" }).business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA)
    expect(linkedinJobToJobsPartners({ ...baseJob, title: "A" }).business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA)
  })

  it("retombe sur creation + 60 jours quand la date d'expiration est absente ou illisible", () => {
    const absente = linkedinJobToJobsPartners({ ...baseJob, expirationDate: null })
    const illisible = linkedinJobToJobsPartners({ ...baseJob, expirationDate: "3 novembre 2026" })

    // listDate = 2026-09-15T08:14:58Z
    expect(absente.offer_expiration).toEqual(new Date("2026-11-14T08:14:58.000Z"))
    expect(illisible.offer_expiration).toEqual(new Date("2026-11-14T08:14:58.000Z"))
  })

  it("retombe sur location quand ville et code postal sont absents", () => {
    const result = linkedinJobToJobsPartners({ ...baseJob, city: "", postalCode: "", location: "Isère, Auvergne-Rhône-Alpes, France" })

    expect(result.workplace_address_city).toBe("Isère")
    expect(result.workplace_address_zipcode).toBeNull()
    expect(result.workplace_address_label).toBe("Isère")
  })
})
