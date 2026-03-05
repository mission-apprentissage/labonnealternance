import { unlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { ObjectId } from "mongodb"
import { RECRUITER_STATUS } from "shared/constants/index"
import { generateEntrepriseFixture } from "shared/fixtures/entreprise.fixture"
import { generateJobFixture, generateRecruiterFixture } from "shared/fixtures/recruiter.fixture"
import { generateRoleManagementFixture } from "shared/fixtures/roleManagement.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/userWithAccount.fixture"
import { JOB_STATUS } from "shared/models/job.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { cleanClosedCompanies } from "./cleanClosedCompanies"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

useMongo()

describe("cleanClosedCompanies", () => {
  let managedById: ObjectId
  const createdCsvFiles: string[] = []

  const makeCsvFile = (rows: Array<{ id: string; "cfa-delegated-siret": string; "is-delegated": string; "managed-by": string }>) => {
    const csvPath = join(tmpdir(), `test-companies-${Date.now()}.csv`)
    const header = "id,cfa-delegated-siret,is-delegated,managed-by"
    const lines = rows.map((r) => `${r.id},${r["cfa-delegated-siret"]},${r["is-delegated"]},${r["managed-by"]}`)
    writeFileSync(csvPath, [header, ...lines].join("\n"))
    createdCsvFiles.push(csvPath)
    return csvPath
  }

  beforeEach(() => {
    managedById = new ObjectId()
  })

  afterEach(() => {
    for (const file of createdCsvFiles) {
      try {
        unlinkSync(file)
      } catch {
        // ignore si déjà supprimé
      }
    }
    createdCsvFiles.length = 0
  })

  it("archive le recruteur et annule uniquement les offres actives", async () => {
    const recruiter = generateRecruiterFixture({
      status: RECRUITER_STATUS.ACTIF,
      managed_by: managedById.toString(),
      jobs: [generateJobFixture({ job_status: JOB_STATUS.ACTIVE }), generateJobFixture({ job_status: JOB_STATUS.POURVUE })],
    })
    const user = generateUserWithAccountFixture({ _id: managedById })
    const role = generateRoleManagementFixture({ user_id: managedById })

    await getDbCollection("recruiters").insertOne(recruiter)
    await getDbCollection("userswithaccounts").insertOne(user)
    await getDbCollection("rolemanagements").insertOne(role)

    const csvPath = makeCsvFile([{ id: recruiter._id.toString(), "cfa-delegated-siret": "", "is-delegated": "FALSE", "managed-by": managedById.toString() }])

    await cleanClosedCompanies(csvPath)

    const updatedRecruiter = await getDbCollection("recruiters").findOne({ _id: recruiter._id })
    expect(updatedRecruiter?.status).toBe(RECRUITER_STATUS.ARCHIVE)
    expect(updatedRecruiter?.jobs[0].job_status).toBe(JOB_STATUS.ANNULEE)
    expect(updatedRecruiter?.jobs[1].job_status).toBe(JOB_STATUS.POURVUE)
  })

  it("ajoute un événement DENIED uniquement sur le rôle de l'entreprise fermée", async () => {
    const entrepriseFermee = generateEntrepriseFixture({ siret: "11000001500013" })
    const autreEntreprise = generateEntrepriseFixture({ siret: "42476141900045" })
    const recruiter = generateRecruiterFixture({
      status: RECRUITER_STATUS.ACTIF,
      managed_by: managedById.toString(),
      establishment_siret: entrepriseFermee.siret,
    })
    const user = generateUserWithAccountFixture({ _id: managedById })
    const roleFermee = generateRoleManagementFixture({ user_id: managedById, authorized_id: entrepriseFermee._id.toString(), authorized_type: AccessEntityType.ENTREPRISE })
    const roleAutre = generateRoleManagementFixture({ user_id: managedById, authorized_id: autreEntreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE })

    await getDbCollection("entreprises").insertMany([entrepriseFermee, autreEntreprise])
    await getDbCollection("recruiters").insertOne(recruiter)
    await getDbCollection("userswithaccounts").insertOne(user)
    await getDbCollection("rolemanagements").insertMany([roleFermee, roleAutre])

    const csvPath = makeCsvFile([{ id: recruiter._id.toString(), "cfa-delegated-siret": "", "is-delegated": "FALSE", "managed-by": managedById.toString() }])

    await cleanClosedCompanies(csvPath)

    const updatedRoleFermee = await getDbCollection("rolemanagements").findOne({ _id: roleFermee._id })
    const lastStatusFermee = updatedRoleFermee?.status.at(-1)
    expect(lastStatusFermee?.status).toBe(AccessStatus.DENIED)
    expect(lastStatusFermee?.reason).toBe("clôture siret fermé")

    const updatedRoleAutre = await getDbCollection("rolemanagements").findOne({ _id: roleAutre._id })
    const lastStatusAutre = updatedRoleAutre?.status.at(-1)
    expect(lastStatusAutre?.status).not.toBe(AccessStatus.DENIED)
  })

  it("traite plusieurs lignes du CSV indépendamment", async () => {
    const managedById2 = new ObjectId()

    const recruiter1 = generateRecruiterFixture({ status: RECRUITER_STATUS.ACTIF, managed_by: managedById.toString() })
    const recruiter2 = generateRecruiterFixture({ status: RECRUITER_STATUS.ACTIF, managed_by: managedById2.toString() })
    const user1 = generateUserWithAccountFixture({ _id: managedById, email: "user1@mail.com" })
    const user2 = generateUserWithAccountFixture({ _id: managedById2, email: "user2@mail.com" })

    await getDbCollection("recruiters").insertMany([recruiter1, recruiter2])
    await getDbCollection("userswithaccounts").insertMany([user1, user2])

    const csvPath = makeCsvFile([
      { id: recruiter1._id.toString(), "cfa-delegated-siret": "", "is-delegated": "FALSE", "managed-by": managedById.toString() },
      { id: recruiter2._id.toString(), "cfa-delegated-siret": "85027717900014", "is-delegated": "TRUE", "managed-by": managedById2.toString() },
    ])

    await cleanClosedCompanies(csvPath)

    const r1 = await getDbCollection("recruiters").findOne({ _id: recruiter1._id })
    const r2 = await getDbCollection("recruiters").findOne({ _id: recruiter2._id })
    expect(r1?.status).toBe(RECRUITER_STATUS.ARCHIVE)
    expect(r2?.status).toBe(RECRUITER_STATUS.ARCHIVE)
  })
})
