import { badRequest, notFound } from "@hapi/boom"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateApplicationFixture } from "shared/fixtures/application.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { ERecruteurLbaUpdateEventType } from "shared/models/index"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import type { IJobsPartnersRecruteurAlgoPrivate } from "shared/models/jobsPartners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getCompanyContactInfo, getRecruteursLbaFromDB, searchLbaCompaniesForAdmin, updateContactInfo } from "./recruteurLba.service"

useMongo()

const recruteurlba = generateJobsPartnersOfferPrivate({
  partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
  workplace_siret: "58006820882692",
  workplace_legal_name: "fake_company_name",
  workplace_address_label: "1 rue de la paix",
  apply_email: "recruteur_lba@test.com",
  apply_phone: "0610101010",
}) as IJobsPartnersRecruteurAlgoPrivate

const application = generateApplicationFixture({
  company_siret: "34843069553553",
  company_email: "application_company_email@test.com",
  company_name: "fake_company_name",
  applicant_attachment_name: "cv.pdf",
})

describe("/lbacompany/:siret/contactInfo", () => {
  beforeEach(async () => {
    await getDbCollection("applications").insertOne(application)
    await getDbCollection("jobs_partners").insertOne(recruteurlba)
    return async () => {
      await getDbCollection("recruteurlbaupdateevents").deleteMany({})
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("applications").deleteMany({})
    }
  })

  it("La société existe", async () => {
    const result = await getCompanyContactInfo({ siret: recruteurlba.workplace_siret })

    expect.soft(result).toStrictEqual({
      active: true,
      siret: "58006820882692",
      enseigne: "fake_company_name",
      phone: "0610101010",
      email: "recruteur_lba@test.com",
    })
  })

  it("La société n'existe plus mais candidature dans applications", async () => {
    const result = await getCompanyContactInfo({ siret: "34843069553553" })

    expect.soft(result).toStrictEqual({
      active: false,
      siret: "34843069553553",
      enseigne: "fake_company_name",
      phone: "",
      email: "",
    })
  })

  it("La société n'existe plus et pas de candidature dans applications", async () => {
    await expect(getCompanyContactInfo({ siret: "34843069553555" })).rejects.toThrow(notFound("Société inconnue"))
  })

  it("Suppression email / phone d'une société AVEC événements correspondants générés", async () => {
    const { siret, email, phone } = { siret: "58006820882692", email: null, phone: null }

    const result = await updateContactInfo({ siret, email, phone })

    expect.soft(result).toStrictEqual({
      active: true,
      enseigne: "fake_company_name",
      siret,
      phone,
      email,
    })

    const modifiedRecruteurLba = await getDbCollection("jobs_partners").findOne({ workplace_siret: siret, partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA })
    expect.soft(modifiedRecruteurLba).toEqual(
      expect.objectContaining({
        apply_phone: phone,
        apply_email: email,
      })
    )

    let eventCount = await getDbCollection("recruteurlbaupdateevents").countDocuments({ siret, event: ERecruteurLbaUpdateEventType.DELETE_PHONE })
    expect.soft(eventCount).toEqual(1)

    eventCount = await getDbCollection("recruteurlbaupdateevents").countDocuments({ siret, event: ERecruteurLbaUpdateEventType.DELETE_EMAIL })
    expect.soft(eventCount).toEqual(1)
  })

  it("Modification email / phone d'une société AVEC événements correspondants générés", async () => {
    const result = await updateContactInfo({ siret: "58006820882692", email: "recruteur_lba_2@test.com", phone: "0610101011" })

    expect.soft(result).toStrictEqual({
      active: true,
      siret: "58006820882692",
      enseigne: "fake_company_name",
      phone: "0610101011",
      email: "recruteur_lba_2@test.com",
    })

    const modifiedRecruteurLba = await getDbCollection("jobs_partners").findOne({ workplace_siret: "58006820882692", partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA })
    expect.soft(modifiedRecruteurLba).toEqual(
      expect.objectContaining({
        apply_phone: "0610101011",
        apply_email: "recruteur_lba_2@test.com",
      })
    )

    let eventCount = await getDbCollection("recruteurlbaupdateevents").countDocuments({
      siret: "58006820882692",
      event: ERecruteurLbaUpdateEventType.UPDATE_PHONE,
      value: "0610101011",
    })
    expect.soft(eventCount).toEqual(1)

    eventCount = await getDbCollection("recruteurlbaupdateevents").countDocuments({
      siret: "58006820882692",
      event: ERecruteurLbaUpdateEventType.UPDATE_EMAIL,
      value: "recruteur_lba_2@test.com",
    })
    expect.soft(eventCount).toEqual(1)
  })

  it("La modification email / phone d'une société présente dans recruteursLba se fait et les événements correspondants sont générés", async () => {
    const result = await updateContactInfo({ siret: "34843069553553", email: "recruteur_lba_2@test.com", phone: "0610101011" })

    expect.soft(result).toStrictEqual({
      active: false,
      siret: "34843069553553",
      enseigne: "fake_company_name",
      phone: "0610101011",
      email: "recruteur_lba_2@test.com",
    })

    let eventCount = await getDbCollection("recruteurlbaupdateevents").countDocuments({
      siret: "34843069553553",
      event: ERecruteurLbaUpdateEventType.UPDATE_PHONE,
      value: "0610101011",
    })
    expect.soft(eventCount).toEqual(1)

    eventCount = await getDbCollection("recruteurlbaupdateevents").countDocuments({
      siret: "34843069553553",
      event: ERecruteurLbaUpdateEventType.UPDATE_EMAIL,
      value: "recruteur_lba_2@test.com",
    })
    expect.soft(eventCount).toEqual(1)
  })

  it("Tentative de modification si la société issue de l'algo recruteurLba n'existe plus et pas de candidature dans applications", async () => {
    await expect(updateContactInfo({ siret: "34843069553555", email: "recruteur_lba_2@test.com", phone: "0610101011" })).rejects.toThrow(badRequest())

    const eventCount = await getDbCollection("recruteurlbaupdateevents").countDocuments({})
    expect.soft(eventCount).toEqual(0)
  })
})

describe("getRecruteursLbaFromDB", () => {
  const activeRecruteur = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    workplace_siret: "58006820882692",
    offer_status: JOB_STATUS_ENGLISH.ACTIVE,
  }) as IJobsPartnersRecruteurAlgoPrivate

  const inactiveRecruteur = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    workplace_siret: "13002526500013",
    offer_status: JOB_STATUS_ENGLISH.ANNULEE,
  }) as IJobsPartnersRecruteurAlgoPrivate

  beforeEach(async () => {
    await getDbCollection("jobs_partners").insertMany([activeRecruteur, inactiveRecruteur])
    return async () => {
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it("retourne uniquement les recruteurs actifs", async () => {
    const result = await getRecruteursLbaFromDB({ geo: null, romes: null, opco: null, departements: null, partners_to_exclude: null })

    expect(result).toHaveLength(1)
    expect(result[0].workplace_siret).toBe(activeRecruteur.workplace_siret)
  })

  it("retourne un tableau vide si RECRUTEURS_LBA est exclu des partenaires", async () => {
    const result = await getRecruteursLbaFromDB({ geo: null, romes: null, opco: null, departements: null, partners_to_exclude: [JOBPARTNERS_LABEL.RECRUTEURS_LBA] })

    expect(result).toHaveLength(0)
  })
})

describe("searchLbaCompaniesForAdmin", () => {
  // Deux offres pour le même siret : la recherche doit dédupliquer et garder la plus récente
  const companyAncienne = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    workplace_siret: "55217863900132",
    workplace_legal_name: "Boulangerie Dupont",
    workplace_brand: "Chez Dupont",
    apply_email: "ancien@dupont.fr",
    apply_phone: "0611223344",
    created_at: new Date("2024-01-01"),
  }) as IJobsPartnersRecruteurAlgoPrivate

  const companyRecente = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    workplace_siret: "55217863900132",
    workplace_legal_name: "Boulangerie Dupont",
    apply_email: "recent@dupont.fr",
    created_at: new Date("2024-06-01"),
  }) as IJobsPartnersRecruteurAlgoPrivate

  const garage = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    workplace_siret: "13002526500013",
    workplace_legal_name: "Garage Martin",
    apply_email: "info@martin.fr",
  }) as IJobsPartnersRecruteurAlgoPrivate

  // Autre partenaire : ne doit jamais remonter
  const autrePartenaire = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    workplace_siret: "38439774100029",
    workplace_legal_name: "Boulangerie Externe",
  }) as IJobsPartnersRecruteurAlgoPrivate

  beforeEach(async () => {
    await getDbCollection("jobs_partners").insertMany([companyAncienne, companyRecente, garage, autrePartenaire])
    return async () => {
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it("recherche par raison sociale (insensible à la casse, sous-chaîne) et déduplique par siret", async () => {
    const result = await searchLbaCompaniesForAdmin({ search: "boulangerie", field: "workplace_legal_name" })

    expect(result).toHaveLength(1)
    expect(result[0].siret).toBe("55217863900132")
  })

  it("garde l'offre la plus récente lors de la déduplication", async () => {
    const result = await searchLbaCompaniesForAdmin({ search: "Dupont", field: "workplace_legal_name" })

    expect(result).toHaveLength(1)
    expect(result[0].email).toBe("recent@dupont.fr")
  })

  it("recherche par email", async () => {
    const result = await searchLbaCompaniesForAdmin({ search: "martin.fr", field: "apply_email" })

    expect(result).toHaveLength(1)
    expect(result[0].siret).toBe("13002526500013")
  })

  it("recherche par siret en correspondance exacte", async () => {
    const result = await searchLbaCompaniesForAdmin({ search: "13002526500013", field: "workplace_siret" })

    expect(result).toHaveLength(1)
    expect(result[0].raison_sociale).toBe("Garage Martin")
  })

  it("rejette un siret invalide", async () => {
    await expect(searchLbaCompaniesForAdmin({ search: "123", field: "workplace_siret" })).rejects.toThrow("Le SIRET fourni est invalide")
  })

  it("ne retourne pas les recruteurs d'autres partenaires que RECRUTEURS_LBA", async () => {
    const result = await searchLbaCompaniesForAdmin({ search: "Externe", field: "workplace_legal_name" })

    expect(result).toHaveLength(0)
  })

  it("retourne un tableau vide sans correspondance", async () => {
    const result = await searchLbaCompaniesForAdmin({ search: "inexistant", field: "workplace_legal_name" })

    expect(result).toHaveLength(0)
  })
})
