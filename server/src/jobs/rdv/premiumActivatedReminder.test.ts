import { ObjectId } from "mongodb"
import { describe, expect, it } from "vitest"

import { getEmailsForAffelnet, getEmailsForParcoursup } from "./premiumActivatedReminder"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

useMongo()

const SIRET_A = "12345678901234"
const SIRET_B = "98765432109876"

const etablissementWithParcoursup = {
  _id: new ObjectId(),
  formateur_siret: SIRET_A,
  gestionnaire_email: "gestionnaire@a.fr",
  raison_sociale: "CFA A",
  premium_activation_date: new Date("2024-01-01"),
}

const etablissementWithAffelnet = {
  _id: new ObjectId(),
  formateur_siret: SIRET_B,
  gestionnaire_email: "gestionnaire@b.fr",
  raison_sociale: "CFA B",
  premium_affelnet_activation_date: new Date("2024-01-01"),
}

const eligibleTrainingParcoursup1 = {
  _id: new ObjectId(),
  etablissement_formateur_siret: SIRET_A,
  parcoursup_id: "12345",
  lieu_formation_email: "formation1@a.fr",
  training_id_catalogue: "cat1",
  training_intitule_long: "Formation A1",
  training_code_formation_diplome: "1234",
  is_catalogue_published: true,
  last_catalogue_sync_date: new Date(),
  cle_ministere_educatif: "cle1",
  etablissement_formateur_raison_sociale: "CFA A",
  etablissement_formateur_street: null,
  departement_etablissement_formateur: null,
  lieu_formation_street: "1 rue",
  lieu_formation_city: "Paris",
  lieu_formation_zip_code: "75001",
  rco_formation_id: null,
  referrers: [],
  created_at: new Date(),
}

const eligibleTrainingParcoursup2 = {
  _id: new ObjectId(),
  etablissement_formateur_siret: SIRET_A,
  parcoursup_id: "67890",
  lieu_formation_email: "formation2@a.fr",
  training_id_catalogue: "cat2",
  training_intitule_long: "Formation A2",
  training_code_formation_diplome: "5678",
  is_catalogue_published: true,
  last_catalogue_sync_date: new Date(),
  cle_ministere_educatif: "cle2",
  etablissement_formateur_raison_sociale: "CFA A",
  etablissement_formateur_street: null,
  departement_etablissement_formateur: null,
  lieu_formation_street: "1 rue",
  lieu_formation_city: "Paris",
  lieu_formation_zip_code: "75001",
  rco_formation_id: null,
  referrers: [],
  created_at: new Date(),
}

const eligibleTrainingAffelnet = {
  _id: new ObjectId(),
  etablissement_formateur_siret: SIRET_B,
  affelnet_visible: true,
  lieu_formation_email: "formation@b.fr",
  parcoursup_id: null,
  training_id_catalogue: "cat3",
  training_intitule_long: "Formation B",
  training_code_formation_diplome: "9999",
  is_catalogue_published: true,
  last_catalogue_sync_date: new Date(),
  cle_ministere_educatif: "cle3",
  etablissement_formateur_raison_sociale: "CFA B",
  etablissement_formateur_street: null,
  departement_etablissement_formateur: null,
  lieu_formation_street: "2 avenue",
  lieu_formation_city: "Lyon",
  lieu_formation_zip_code: "69001",
  rco_formation_id: null,
  referrers: [],
  created_at: new Date(),
}

describe("getEmailsForParcoursup", () => {
  it("should return emails from eligible trainings linked to parcoursup-activated etablissements", async () => {
    await getDbCollection("etablissements").insertOne(etablissementWithParcoursup)
    await getDbCollection("eligible_trainings_for_appointments").insertMany([eligibleTrainingParcoursup1, eligibleTrainingParcoursup2])

    const emails = await getEmailsForParcoursup()

    expect(emails).toEqual(expect.arrayContaining(["formation1@a.fr", "formation2@a.fr"]))
    expect(emails).toHaveLength(2)
  })

  it("should not return emails when etablissement has no premium_activation_date", async () => {
    await getDbCollection("etablissements").insertOne({
      ...etablissementWithParcoursup,
      premium_activation_date: null,
    })
    await getDbCollection("eligible_trainings_for_appointments").insertOne(eligibleTrainingParcoursup1)

    const emails = await getEmailsForParcoursup()

    expect(emails).toHaveLength(0)
  })

  it("should not return emails when eligible training has no parcoursup_id", async () => {
    await getDbCollection("etablissements").insertOne(etablissementWithParcoursup)
    await getDbCollection("eligible_trainings_for_appointments").insertOne({
      ...eligibleTrainingParcoursup1,
      parcoursup_id: null,
    })

    const emails = await getEmailsForParcoursup()

    expect(emails).toHaveLength(0)
  })

  it("should deduplicate emails when multiple trainings share the same lieu_formation_email", async () => {
    await getDbCollection("etablissements").insertOne(etablissementWithParcoursup)
    await getDbCollection("eligible_trainings_for_appointments").insertMany([
      eligibleTrainingParcoursup1,
      { ...eligibleTrainingParcoursup2, lieu_formation_email: "formation1@a.fr", cle_ministere_educatif: "cle4" },
    ])

    const emails = await getEmailsForParcoursup()

    expect(emails).toEqual(["formation1@a.fr"])
    expect(emails).toHaveLength(1)
  })

  it("should not include affelnet-only eligible trainings", async () => {
    await getDbCollection("etablissements").insertOne(etablissementWithParcoursup)
    await getDbCollection("eligible_trainings_for_appointments").insertOne({
      ...eligibleTrainingAffelnet,
      etablissement_formateur_siret: SIRET_A,
    })

    const emails = await getEmailsForParcoursup()

    expect(emails).toHaveLength(0)
  })
})

describe("getEmailsForAffelnet", () => {
  it("should return emails from eligible trainings linked to affelnet-activated etablissements", async () => {
    await getDbCollection("etablissements").insertOne(etablissementWithAffelnet)
    await getDbCollection("eligible_trainings_for_appointments").insertOne(eligibleTrainingAffelnet)

    const emails = await getEmailsForAffelnet()

    expect(emails).toEqual(["formation@b.fr"])
  })

  it("should not return emails when etablissement has no premium_affelnet_activation_date", async () => {
    await getDbCollection("etablissements").insertOne({
      ...etablissementWithAffelnet,
      premium_affelnet_activation_date: null,
    })
    await getDbCollection("eligible_trainings_for_appointments").insertOne(eligibleTrainingAffelnet)

    const emails = await getEmailsForAffelnet()

    expect(emails).toHaveLength(0)
  })

  it("should not return emails when eligible training is not affelnet_visible", async () => {
    await getDbCollection("etablissements").insertOne(etablissementWithAffelnet)
    await getDbCollection("eligible_trainings_for_appointments").insertOne({
      ...eligibleTrainingAffelnet,
      affelnet_visible: false,
    })

    const emails = await getEmailsForAffelnet()

    expect(emails).toHaveLength(0)
  })

  it("should deduplicate emails when multiple trainings share the same lieu_formation_email", async () => {
    await getDbCollection("etablissements").insertOne(etablissementWithAffelnet)
    await getDbCollection("eligible_trainings_for_appointments").insertMany([
      eligibleTrainingAffelnet,
      { ...eligibleTrainingAffelnet, _id: new ObjectId(), cle_ministere_educatif: "cle5" },
    ])

    const emails = await getEmailsForAffelnet()

    expect(emails).toEqual(["formation@b.fr"])
    expect(emails).toHaveLength(1)
  })

  it("should not include parcoursup-only eligible trainings", async () => {
    await getDbCollection("etablissements").insertOne(etablissementWithAffelnet)
    await getDbCollection("eligible_trainings_for_appointments").insertOne({
      ...eligibleTrainingParcoursup1,
      etablissement_formateur_siret: SIRET_B,
      affelnet_visible: false,
    })

    const emails = await getEmailsForAffelnet()

    expect(emails).toHaveLength(0)
  })
})
