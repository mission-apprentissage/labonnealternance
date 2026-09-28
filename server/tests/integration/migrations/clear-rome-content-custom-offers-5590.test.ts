import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import { OFFER_DESCRIPTION_MODE } from "shared/models/job.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { up } from "@/migrations/20260928183655-clear-rome-content-custom-offers-5590"

// cf. backfill-offer-status-history-lba-5429.test.ts : un test colocalisé serait ramassé comme une migration.
describe("migration clear-rome-content-custom-offers-5590", () => {
  useMongo()

  const referentielRome = generateReferentielRome()
  const romeCode = referentielRome.rome.code_rome
  const romeContent = {
    offer_desired_skills: ["Faire preuve de rigueur"],
    offer_to_be_acquired_skills: ["Gestion\tClasser des documents"],
    offer_to_be_acquired_knowledge: ["Domaines d'expertise\tBureautique"],
    offer_access_conditions: ["Accessible avec un CAP"],
  }
  const emptyRomeContent = { offer_desired_skills: [], offer_to_be_acquired_skills: [], offer_to_be_acquired_knowledge: [], offer_access_conditions: [] }

  const afterMvp = new Date("2026-09-28T10:00:00.000Z")
  const lbaOffer = (partner_job_id: string, overrides = {}) =>
    generateJobsPartnersOfferPrivate({
      partner_job_id,
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_rome_codes: [romeCode],
      created_at: afterMvp,
      ...romeContent,
      ...overrides,
    })

  const readAll = async () => new Map((await getDbCollection("jobs_partners").find({}).toArray()).map((job) => [job.partner_job_id, job]))

  const seed = async () => {
    await getDbCollection("referentielromes").insertOne(referentielRome)
    await getDbCollection("jobs_partners").insertMany([
      lbaOffer("redigee", { offer_description: "Vous rejoindrez notre équipe de 5 personnes pour gérer l'accueil et les dossiers." }),
      // fiche métier recopiée, espacement différent du référentiel
      lbaOffer("fiche-metier", { offer_description: `  ${referentielRome.definition}\n` }),
      lbaOffer("sans-description", { offer_description: "" }),
      lbaOffer("fiche-metier-avant-mvp", { offer_description: referentielRome.definition, created_at: new Date("2024-04-15T08:00:00.000Z") }),
      lbaOffer("rome-absent", { offer_rome_codes: ["Z9999"], offer_description: "Texte rédigé sur un métier absent du référentiel." }),
      lbaOffer("redigee-re-remplie", { offer_description: "Texte rédigé par le recruteur.", offer_description_mode: OFFER_DESCRIPTION_MODE.CUSTOM }),
      // antérieure au MVP : sa description est une définition ROME changée depuis par le référentiel
      lbaOffer("avant-mvp", { offer_description: "Ancienne définition ROME, remplacée depuis dans le référentiel.", created_at: new Date("2024-04-15T08:00:00.000Z") }),
      generateJobsPartnersOfferPrivate({
        partner_job_id: "partenaire",
        partner_label: JOBPARTNERS_LABEL.HELLOWORK,
        offer_rome_codes: [romeCode],
        offer_description: "Description d'un partenaire.",
        ...romeContent,
      }),
    ])
  }

  it("vide les champs ROME d'une offre rédigée et garde son code ROME", async () => {
    await seed()
    await up()
    const job = (await readAll()).get("redigee")
    expect.soft(job?.offer_description_mode).toBe(OFFER_DESCRIPTION_MODE.CUSTOM)
    expect.soft(job?.offer_rome_codes).toEqual([romeCode])
    expect.soft(job).toMatchObject(emptyRomeContent)
  })

  it("pose le mode d'une offre sur fiche métier, quelle que soit sa date, sans toucher ses champs", async () => {
    await seed()
    await up()
    const jobs = await readAll()
    for (const id of ["fiche-metier", "sans-description", "fiche-metier-avant-mvp"]) {
      expect.soft(jobs.get(id)?.offer_description_mode, id).toBe(OFFER_DESCRIPTION_MODE.STRUCTURED)
      expect.soft(jobs.get(id), id).toMatchObject(romeContent)
    }
  })

  it("ne classe pas une offre antérieure au MVP, sans définition ROME, ou d'un partenaire", async () => {
    await seed()
    await up()
    const jobs = await readAll()
    for (const id of ["avant-mvp", "rome-absent", "partenaire"]) {
      expect.soft(jobs.get(id)?.offer_description_mode, id).toBeUndefined()
      expect.soft(jobs.get(id), id).toMatchObject(romeContent)
    }
  })

  it("vide à nouveau une offre déjà classée rédigée mais re-remplie", async () => {
    await seed()
    await up()
    expect((await readAll()).get("redigee-re-remplie")).toMatchObject(emptyRomeContent)
  })

  it("ne modifie plus rien au rejeu", async () => {
    await seed()
    await up()
    const afterFirstRun = await readAll()
    await up()
    expect(await readAll()).toEqual(afterFirstRun)
  })
})
