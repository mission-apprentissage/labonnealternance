import { omit } from "lodash-es"
import { ObjectId } from "mongodb"
import { removeAccents } from "shared"
import { RECRUITER_STATUS } from "shared/constants/index"
import { generateEntrepriseFixture } from "shared/fixtures/entreprise.fixture"
import { generateJobFixture, generateRecruiterFixture } from "shared/fixtures/recruiter.fixture"
import { generateRoleManagementFixture } from "shared/fixtures/roleManagement.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/userWithAccount.fixture"
import { IRecruiter, IReferentielRome, IUserWithAccount } from "shared/models/index"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { createJob, startRecruiterChangeStream } from "./formulaire.service"

useMongo()

describe("createJob", () => {
  let user: IUserWithAccount
  let recruiter: IRecruiter
  let referentielRome: IReferentielRome

  beforeEach(async () => {
    const email = "entreprise@mail.fr"
    const entreprise = generateEntrepriseFixture()
    const role = generateRoleManagementFixture()
    user = generateUserWithAccountFixture({
      _id: new ObjectId("670ce1ded6ce30c3c90a0e1d"),
      email,
    })
    recruiter = generateRecruiterFixture({
      is_delegated: false,
      cfa_delegated_siret: null,
      status: RECRUITER_STATUS.ACTIF,
      establishment_siret: entreprise.siret,
      opco: entreprise.opco,
      jobs: [],
      geopoint: {
        type: "Point",
        coordinates: [2.3522, 48.8566],
      },
      geo_coordinates: "48.8566,2.3522",
      email,
      _id: new ObjectId("670ce30b57a50d6875c141f9"),
      establishment_creation_date: new Date("2024-10-14T09:23:21.588Z"),
      managed_by: "686e82f6965b78f107bf44c1",
    })
    referentielRome = generateReferentielRome()
    await getDbCollection("userswithaccounts").insertOne(user)
    await getDbCollection("referentielromes").insertOne(referentielRome)
    await getDbCollection("rolemanagements").insertOne(role)
    await getDbCollection("entreprises").insertOne(entreprise)
    await getDbCollection("recruiters").insertOne(recruiter)

    return async () => {
      await getDbCollection("userswithaccounts").deleteMany({})
      await getDbCollection("recruiters").deleteMany({})
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
    const { changeRecruiterStream, changeAnonymizedRecruiterStream } = await startRecruiterChangeStream() //{ changeRecruiterStream: null, changeAnonymizedRecruiterStream: null }

    const job = generateValidJobWritable()
    const result = await createJob({ user, establishment_id: recruiter.establishment_id, job })

    expect.soft(omit(result, "jobs")).toMatchSnapshot()
    expect.soft(result.jobs.length).toEqual(1)
    expect.soft(omit(result.jobs[0], "job_creation_date", "job_update_date", "_id", "job_expiration_date")).toMatchSnapshot()

    await new Promise((r) => setTimeout(r, 200))

    const partnerJob = await getDbCollection("jobs_partners").findOne({ partner_job_id: result.jobs[0]._id.toString() })
    expect.soft(partnerJob?.offer_title).toEqual(job.rome_appellation_label)
    expect.soft(omit(partnerJob, "_id", "created_at", "offer_creation", "partner_job_id", "updated_at", "offer_expiration")).toMatchSnapshot()

    changeRecruiterStream.close()
    changeAnonymizedRecruiterStream.close()
  })

  it("should raise a bad request when savoir_etre_professionnel do not match referentiel rome", async () => {
    const job = generateValidJobWritable()
    job.competences_rome!.savoir_etre_professionnel = [
      {
        code_ogr: "test",
        libelle: "test",
        coeur_metier: "test",
      },
    ]
    expect.soft(() => createJob({ user, establishment_id: recruiter.establishment_id, job })).rejects.toThrow("compétences invalides")
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
    expect.soft(() => createJob({ user, establishment_id: recruiter.establishment_id, job })).rejects.toThrow("compétences invalides")
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
    expect.soft(() => createJob({ user, establishment_id: recruiter.establishment_id, job })).rejects.toThrow("compétences invalides")
  })
  it("should raise a bad request when rome_label do not match referentiel rome", async () => {
    const job = generateValidJobWritable()
    job.rome_label = "test"
    expect
      .soft(() => createJob({ user, establishment_id: recruiter.establishment_id, job }))
      .rejects.toThrow(
        `L'intitulé du code ROME ne correspond pas au référentiel : ${removeAccents(referentielRome.rome.intitule.toLowerCase())}, reçu ${removeAccents(job.rome_label.toLowerCase())}`
      )
  })
  it("should raise a bad request when rome_appellation_label do not match referentiel rome", async () => {
    const job = generateValidJobWritable()
    job.rome_appellation_label = "test"
    expect
      .soft(() => createJob({ user, establishment_id: recruiter.establishment_id, job }))
      .rejects.toThrow(`L'appellation du code ROME ne correspond pas au référentiel : reçu ${removeAccents(job.rome_appellation_label.toLowerCase())}`)
  })
})
