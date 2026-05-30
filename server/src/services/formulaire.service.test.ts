import { mockApiEntreprise } from "@tests/mocks/mockApiEntreprise"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { omit } from "lodash-es"
import { ObjectId } from "mongodb"
import { AccessEntityType, removeAccents } from "shared"
import { generateEntrepriseFixture } from "shared/fixtures/entreprise.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { generateJobFixture } from "shared/fixtures/recruiter.fixture"
import { generateRoleManagementFixture } from "shared/fixtures/roleManagement.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/userWithAccount.fixture"
import type { IEntreprise, IReferentielRome, IUserWithAccount } from "shared/models/index"
import { beforeEach, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { createJob, getCompetencesRomeFromPartnerJob } from "./formulaire.service"

useMongo()

describe("createJob", () => {
  let user: IUserWithAccount
  let entreprise: IEntreprise
  let referentielRome: IReferentielRome

  beforeEach(async () => {
    const mockApiEntrepriseInstance = mockApiEntreprise.infosEntreprise()

    const email = "entreprise@mail.fr"
    entreprise = generateEntrepriseFixture()
    user = generateUserWithAccountFixture({
      _id: new ObjectId("670ce1ded6ce30c3c90a0e1d"),
      email,
    })
    const role = generateRoleManagementFixture({
      authorized_type: AccessEntityType.ENTREPRISE,
      authorized_id: entreprise._id.toString(),
      user_id: user._id,
    })
    referentielRome = generateReferentielRome()
    await getDbCollection("userswithaccounts").insertOne(user)
    await getDbCollection("referentielromes").insertOne(referentielRome)
    await getDbCollection("rolemanagements").insertOne(role)
    await getDbCollection("entreprises").insertOne(entreprise)

    return async () => {
      mockApiEntrepriseInstance.persist(false)
      await getDbCollection("userswithaccounts").deleteMany({})
      await getDbCollection("entreprises").deleteMany({})
      await getDbCollection("rolemanagements").deleteMany({})
      await getDbCollection("referentielromes").deleteMany({})
    }
  })

  const generateValidJobWritable = () => {
    return generateJobFixture({
      rome_code: [referentielRome.rome.code_rome],
      rome_label: referentielRome.rome.intitule,
      rome_appellation_label: referentielRome.appellations[0].libelle,
      competences_rome: {
        savoir_etre_professionnel: referentielRome.competences.savoir_etre_professionnel?.slice(0, 1),
        savoir_faire: referentielRome.competences.savoir_faire?.slice(0, 1),
        savoirs: referentielRome.competences.savoirs?.slice(0, 1),
      },
    })
  }

  it("should insert a job", async () => {
    const job = generateValidJobWritable()
    const result = await createJob({ user, siret: entreprise.siret, job })

    expect
      .soft(omit(result, ["_id", "apply_recipient_id", "apply_url", "created_at", "lba_url", "offer_creation", "partner_job_id", "updated_at", "offer_expiration"]))
      .toMatchSnapshot()
  }, 20_000)

  it("should raise a bad request when savoir_etre_professionnel do not match referentiel rome", async () => {
    const job = generateValidJobWritable()
    job.competences_rome!.savoir_etre_professionnel = [
      {
        code_ogr: "test",
        libelle: "test",
        coeur_metier: "test",
      },
    ]
    await expect.soft(async () => createJob({ user, siret: entreprise.siret, job })).rejects.toThrow("compétences invalides")
  })
  it("should raise a bad request when savoir_faire do not match referentiel rome", async () => {
    const job = generateValidJobWritable()
    job.competences_rome!.savoir_faire = [
      {
        libelle: "test",
        items: [
          {
            code_ogr: "test",
            libelle: "test",
            coeur_metier: "test",
          },
        ],
      },
    ]
    await expect.soft(async () => createJob({ user, siret: entreprise.siret, job })).rejects.toThrow("compétences invalides")
  })
  it("should raise a bad request when savoirs do not match referentiel rome", async () => {
    const job = generateValidJobWritable()
    job.competences_rome!.savoirs = [
      {
        libelle: "test",
        items: [
          {
            code_ogr: "test",
            libelle: "test",
            coeur_metier: "test",
          },
        ],
      },
    ]
    await expect.soft(async () => createJob({ user, siret: entreprise.siret, job })).rejects.toThrow("compétences invalides")
  })
  it("should raise a bad request when rome_label do not match referentiel rome", async () => {
    const job = generateValidJobWritable()
    job.rome_label = "test"
    await expect
      .soft(async () => createJob({ user, siret: entreprise.siret, job }))
      .rejects.toThrow(
        `L'intitulé du code ROME ne correspond pas au référentiel : ${removeAccents(referentielRome.rome.intitule.toLowerCase())}, reçu ${removeAccents(job.rome_label.toLowerCase())}`
      )
  })
  it("should raise a bad request when rome_appellation_label do not match referentiel rome", async () => {
    const job = generateValidJobWritable()
    job.rome_appellation_label = "test"
    await expect
      .soft(async () => createJob({ user, siret: entreprise.siret, job }))
      .rejects.toThrow(`L'appellation du code ROME ne correspond pas au référentiel : reçu ${removeAccents(job.rome_appellation_label.toLowerCase())}`)
  })
})

describe("getCompetencesRomeFromPartnerJob", () => {
  it("should reconstruct competences_rome from partner fields and rome_detail", () => {
    const referentielRome = generateReferentielRome()
    const selectedSavoirEtre = referentielRome.competences.savoir_etre_professionnel?.at(0)
    const selectedSavoirFaireCategory = referentielRome.competences.savoir_faire?.at(0)
    const selectedSavoirFaireItem = selectedSavoirFaireCategory?.items.at(0)
    const selectedSavoirsCategory = referentielRome.competences.savoirs?.at(0)
    const selectedSavoirsItem = selectedSavoirsCategory?.items.at(0)

    expect.soft(selectedSavoirEtre).toBeDefined()
    expect.soft(selectedSavoirFaireCategory).toBeDefined()
    expect.soft(selectedSavoirFaireItem).toBeDefined()
    expect.soft(selectedSavoirsCategory).toBeDefined()
    expect.soft(selectedSavoirsItem).toBeDefined()

    const partnerJob = {
      ...generateJobsPartnersOfferPrivate({
        offer_desired_skills: selectedSavoirEtre ? [selectedSavoirEtre.libelle] : [],
        offer_to_be_acquired_skills: selectedSavoirFaireCategory && selectedSavoirFaireItem ? [`${selectedSavoirFaireCategory.libelle}\t${selectedSavoirFaireItem.libelle}`] : [],
        offer_to_be_acquired_knowledge: selectedSavoirsCategory && selectedSavoirsItem ? [`${selectedSavoirsCategory.libelle}\t${selectedSavoirsItem.libelle}`] : [],
      }),
      rome_detail: referentielRome,
    }

    const competencesRome = getCompetencesRomeFromPartnerJob(partnerJob)

    expect(competencesRome).toEqual({
      savoir_etre_professionnel: [selectedSavoirEtre],
      savoir_faire: [{ libelle: selectedSavoirFaireCategory!.libelle, items: [selectedSavoirFaireItem] }],
      savoirs: [{ libelle: selectedSavoirsCategory!.libelle, items: [selectedSavoirsItem] }],
    })
  })
})
