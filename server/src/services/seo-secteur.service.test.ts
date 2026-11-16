import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { updateSeoMetierJobCounts, updateSeoSecteurs } from "@/services/seo.service"

const secteur = (overrides = {}) => ({
  _id: new ObjectId(),
  slug: "informatique",
  secteur: "informatique",
  secteur_complement: "de l'informatique",
  titre: "Alternance informatique",
  accroche: "accroche",
  meta_description: "meta",
  q_recherche: "informatique",
  description: ["description"],
  chiffres_cles: [],
  metiers: [
    { libelle: "Développeur web", romes: ["M1805"], description: "code", niveau_acces: "Bac+2", metier_slug: "developpeur-web" },
    { libelle: "Technicien support informatique", romes: ["I1401"], description: "dépanne", niveau_acces: "Bac", metier_slug: null },
  ],
  marche: null,
  formations_niveaux: [],
  faq: [],
  romes: ["M1805", "I1401"],
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
})

const offre = (partner_label: JOBPARTNERS_LABEL, overrides = {}) =>
  createJobPartner({ partner_label, offer_rome_codes: ["M1805"], offer_status: JOB_STATUS_ENGLISH.ACTIVE, ...overrides })

const seedOffresEtEntreprisesAlgo = async () => {
  await offre(JOBPARTNERS_LABEL.HELLOWORK, { workplace_siret: "11111111100011" })
  await offre(JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, { workplace_siret: "22222222200022" })
  for (const siret of ["33333333300033", "44444444400044", "55555555500055"]) {
    await offre(JOBPARTNERS_LABEL.RECRUTEURS_LBA, { workplace_siret: siret, partner_job_id: siret, offer_expiration: null })
  }
}

const runAndRead = async () => {
  await getDbCollection("seo_secteurs").insertOne(secteur())
  await updateSeoSecteurs()
  const result = await getDbCollection("seo_secteurs").findOne({ slug: "informatique" })
  if (!result) throw new Error("secteur absent")
  return result
}

describe("updateSeoSecteurs", () => {
  useMongo()

  it("compte les offres sans les entreprises à contacter", async () => {
    await seedOffresEtEntreprisesAlgo()
    const result = await runAndRead()
    expect(result.job_count).toBe(2)
    expect(result.algo_company_count).toBe(3)
  })

  it("n'inclut aucune entreprise à contacter dans les cartes", async () => {
    await seedOffresEtEntreprisesAlgo()
    const result = await runAndRead()
    expect(result.cards?.length).toBeGreaterThan(0)
    expect(result.cards?.length).toBeLessThanOrEqual(6)
    expect(result.cards?.every((card) => card.partner_label !== JOBPARTNERS_LABEL.RECRUTEURS_LBA)).toBe(true)
  })

  it("compte les offres par métier", async () => {
    await offre(JOBPARTNERS_LABEL.HELLOWORK)
    await offre(JOBPARTNERS_LABEL.HELLOWORK)
    const result = await runAndRead()
    expect(result.metiers_counts).toEqual([
      { libelle: "Développeur web", job_count: 2 },
      { libelle: "Technicien support informatique", job_count: 0 },
    ])
  })

  it("compte le total des offres actives tous secteurs, sans les entreprises à contacter", async () => {
    await seedOffresEtEntreprisesAlgo()
    await offre(JOBPARTNERS_LABEL.HELLOWORK, { offer_rome_codes: ["D1214"] })
    const result = await runAndRead()
    expect(result.job_count).toBe(2)
    expect(result.total_job_count).toBe(3)
  })

  it("ignore les offres inactives", async () => {
    await offre(JOBPARTNERS_LABEL.HELLOWORK)
    await offre(JOBPARTNERS_LABEL.HELLOWORK, { offer_status: JOB_STATUS_ENGLISH.ANNULEE })
    const result = await runAndRead()
    expect(result.job_count).toBe(1)
  })

  it("ne change pas le compteur des pages métier, qui inclut les entreprises à contacter", async () => {
    await seedOffresEtEntreprisesAlgo()
    await getDbCollection("seo_metiers").insertOne({
      _id: new ObjectId(),
      metier: "Développeur web",
      slug: "developpeur-web",
      description: "",
      job_count: 0,
      company_count: 0,
      applicant_count: 0,
      missions: [],
      competences: [],
      salaire: { salaire_brut_moyen: 0, salaire_1ere_annee: 0, salaire_2eme_annee: 0, salaire_median: 0 },
      entreprises: [],
      formations: [],
      villes: [],
      romes: ["M1805"],
      cards: [],
      created_at: new Date(),
      updated_at: new Date(),
    })
    await updateSeoMetierJobCounts()
    const metier = await getDbCollection("seo_metiers").findOne({ slug: "developpeur-web" })
    expect(metier?.job_count).toBe(5)
  })
})
