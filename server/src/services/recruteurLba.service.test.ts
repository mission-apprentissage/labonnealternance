import { badRequest, notFound } from "@hapi/boom"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { createApplicationTest, createRecruteurLbaTest } from "@tests/utils/user.test.utils"
import { ERecruteurLbaUpdateEventType } from "shared/models"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { getCompanyContactInfo, updateContactInfo } from "./recruteurLba.service"

useMongo()

describe("/lbacompany/:siret/contactInfo", () => {
  beforeEach(async () => {
    await createApplicationTest({ company_siret: "34843069553553", company_email: "application_company_email@test.com", company_name: "fake_company_name" })
    await createRecruteurLbaTest({ email: "recruteur_lba@test.com", phone: "0610101010", siret: "58006820882692", enseigne: "fake_company_name" })

    return async () => {
      await getDbCollection("recruteurlbaupdateevents").deleteMany({})
      await getDbCollection("recruteurslba").deleteMany({})
      await getDbCollection("applications").deleteMany({})
    }
  })

  it("La société issue de l'algo recruteurLba existe", async () => {
    const result = await getCompanyContactInfo({ siret: "58006820882692" })

    expect.soft(result).toStrictEqual({
      active: true,
      siret: "58006820882692",
      enseigne: "fake_company_name",
      phone: "0610101010",
      email: "recruteur_lba@test.com",
    })
  })

  it("La société issue de l'algo recruteurLba n'existe plus mais candidature dans applications", async () => {
    const result = await getCompanyContactInfo({ siret: "34843069553553" })

    expect.soft(result).toStrictEqual({
      active: false,
      siret: "34843069553553",
      enseigne: "fake_company_name",
      phone: "",
      email: "",
    })
  })

  it("La société issue de l'algo recruteurLba n'existe plus et pas de candidature dans applications", async () => {
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

    const modifiedRecruteurLba = await getDbCollection("recruteurslba").findOne({ siret: "58006820882692" })
    expect.soft(modifiedRecruteurLba).toEqual(
      expect.objectContaining({
        phone: "",
        email: "",
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

    const modifiedRecruteurLba = await getDbCollection("recruteurslba").findOne({ siret: "58006820882692" })
    expect.soft(modifiedRecruteurLba).toEqual(
      expect.objectContaining({
        phone: "0610101011",
        email: "recruteur_lba_2@test.com",
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
