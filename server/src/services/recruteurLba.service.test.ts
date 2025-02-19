import { badRequest, notFound } from "@hapi/boom"
import { generateApplicationFixture } from "shared/fixtures/application.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { ERecruteurLbaUpdateEventType } from "shared/models"
import { IJobsPartnersRecruteurAlgoPrivate, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { getCompanyContactInfo, updateContactInfo } from "./recruteurLba.service"

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

  it("La suppression email / phone d'une société présente dans recruteursLba se fait et les événements correspondants sont générés", async () => {
    const result = await updateContactInfo({ siret: "58006820882692", email: "", phone: "" })

    expect.soft(result).toStrictEqual({
      active: true,
      siret: "58006820882692",
      enseigne: "fake_company_name",
      phone: "",
      email: "",
    })

    const modifiedRecruteurLba = await getDbCollection("jobs_partners").findOne({ workplace_siret: "58006820882692", partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA })
    expect.soft(modifiedRecruteurLba).toEqual(
      expect.objectContaining({
        apply_phone: "",
        apply_email: "",
      })
    )

    let eventCount = await getDbCollection("recruteurlbaupdateevents").countDocuments({ siret: "58006820882692", event: ERecruteurLbaUpdateEventType.DELETE_PHONE })
    expect.soft(eventCount).toEqual(1)

    eventCount = await getDbCollection("recruteurlbaupdateevents").countDocuments({ siret: "58006820882692", event: ERecruteurLbaUpdateEventType.DELETE_EMAIL })
    expect.soft(eventCount).toEqual(1)
  })

  it("La suppression email / phone d'une société absente dans recruteursLba mais dans application. Aucun événement généré", async () => {
    const result = await updateContactInfo({ siret: "34843069553553", email: "", phone: "" })

    expect.soft(result).toStrictEqual({
      active: false,
      siret: "34843069553553",
      enseigne: "fake_company_name",
      phone: "",
      email: "",
    })

    const eventCount = await getDbCollection("recruteurlbaupdateevents").countDocuments({})
    expect.soft(eventCount).toEqual(0)
  })

  it("La modification email / phone d'une société présente dans recruteursLba se fait et les événements correspondants sont générés", async () => {
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
