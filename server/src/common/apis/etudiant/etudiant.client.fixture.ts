import nock from "nock"
import config from "@/config"
import type { IJobEtudiantJob } from "./etudiant.client"

export function generateJobEtudiantJobFixture(overrides: Partial<IJobEtudiantJob> = {}): IJobEtudiantJob {
  return {
    public_id: "job-123",
    name: "Développeur web en alternance",
    company: {
      public_id: "company-456",
      name: "Entreprise Test",
      logo: "https://example.com/logo.png",
    },
    worktime: { public_id: "full_time", translation: { fr: "Temps plein", en: "Full time" } },
    remote: { public_id: "no_remote", translation: { fr: "Présentiel", en: "On-site" } },
    education: null,
    experience: { public_id: "junior", translation: { fr: "Débutant", en: "Junior" } },
    contract: { public_id: "apprenticeship", translation: { fr: "Alternance", en: "Apprenticeship" } },
    location: {
      address_nbr: "1",
      address: "Rue de la Paix",
      city: "Paris",
      administrative_area_department: "Paris",
      administrative_area_region: "Île-de-France",
      country: "France",
      country_code: "FR",
    },
    salary: "1500€/mois",
    description: {
      company_desc: "<p>Description entreprise</p>",
      job_desc: "<p>Description poste</p>",
      profile_desc: "<p>Profil recherché</p>",
      benefit_desc: "<p>Avantages</p>",
      process_desc: "<p>Processus de recrutement</p>",
    },
    job_url: "https://example.com/job/123",
    apply_url: "https://example.com/apply/123",
    publishedAt: "2024-01-01T10:00:00Z",
    ...overrides,
  }
}

type IJobEtudiantPageResponse = { total?: number; totalPages?: number; "next-page"?: string | null; jobs: IJobEtudiantJob[] }

function buildBaseNock() {
  const { origin, pathname, search } = new URL(config.job_etudiant.url)
  const path = `${pathname}${search}`
  return nock(origin, { reqheaders: { authorization: `Bearer ${config.job_etudiant.apiKey}` } }).get(path)
}

export function nockJobEtudiantPage({ total, totalPages, ...rest }: IJobEtudiantPageResponse) {
  return buildBaseNock().reply(200, { total: total ?? rest.jobs.length, totalPages: totalPages ?? 1, ...rest })
}

export function nockJobEtudiantNextPage(nextPageToken: string, { total, totalPages, ...rest }: IJobEtudiantPageResponse) {
  const { origin, pathname, searchParams } = new URL(config.job_etudiant.url)
  const params = new URLSearchParams(searchParams)
  params.set("next-page", decodeURIComponent(nextPageToken))
  return nock(origin, { reqheaders: { authorization: `Bearer ${config.job_etudiant.apiKey}` } })
    .get(`${pathname}?${params.toString()}`)
    .reply(200, { total: total ?? rest.jobs.length, totalPages: totalPages ?? 1, ...rest })
}
