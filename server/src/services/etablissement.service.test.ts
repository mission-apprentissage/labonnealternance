import { useMongo } from "@tests/utils/mongo.test.utils"
import { roleManagementEventFactory } from "@tests/utils/user.test.utils"
import { ObjectId } from "mongodb"
import { AccessEntityType, AccessStatus } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { generateCfaFixture } from "shared/fixtures/cfa.fixture"
import { generateEntrepriseFixture } from "shared/fixtures/entreprise.fixture"
import { generateRoleManagementFixture } from "shared/fixtures/roleManagement.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/userWithAccount.fixture"
import { beforeEach, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { checkEmailCreationAccess } from "./etablissement.service"

useMongo()

describe("checkEmailCreationAccess", () => {
  // useMongo() clearAllCollections() déjà toutes les collections avant chaque test

  it("returns null when user does not exist", async () => {
    const result = await checkEmailCreationAccess({
      email: "nonexistent@test.com",
      siret: "42476141900045",
      entityType: AccessEntityType.ENTREPRISE,
    })
    expect(result).toBeNull()
  })

  it("returns null when user exists but entity is not in DB", async () => {
    const user = generateUserWithAccountFixture({ email: "user@test.com" })
    await getDbCollection("userswithaccounts").insertOne(user)

    const result = await checkEmailCreationAccess({
      email: "user@test.com",
      siret: "99999999900001",
      entityType: AccessEntityType.ENTREPRISE,
    })
    expect(result).toBeNull()
  })

  it("returns null when user exists, entity exists but user has no role for that entity", async () => {
    const user = generateUserWithAccountFixture({ email: "user@test.com" })
    const entreprise = generateEntrepriseFixture({ siret: "42476141900045" })
    await getDbCollection("userswithaccounts").insertOne(user)
    await getDbCollection("entreprises").insertOne(entreprise)

    const result = await checkEmailCreationAccess({
      email: "user@test.com",
      siret: "42476141900045",
      entityType: AccessEntityType.ENTREPRISE,
    })
    expect(result).toBeNull()
  })

  it("returns ROLE_DENIED error when user has a DENIED role with no subsequent GRANTED", async () => {
    const user = generateUserWithAccountFixture({ email: "user@test.com" })
    const entreprise = generateEntrepriseFixture({ siret: "42476141900045" })
    const deniedDate = new Date("2026-01-15T10:00:00.000Z")
    const role = generateRoleManagementFixture({
      user_id: user._id,
      authorized_id: entreprise._id.toString(),
      authorized_type: AccessEntityType.ENTREPRISE,
      status: [
        roleManagementEventFactory({ status: AccessStatus.AWAITING_VALIDATION, date: new Date("2026-01-10T10:00:00.000Z") }),
        roleManagementEventFactory({ status: AccessStatus.DENIED, date: deniedDate }),
      ],
    })
    await getDbCollection("userswithaccounts").insertOne(user)
    await getDbCollection("entreprises").insertOne(entreprise)
    await getDbCollection("rolemanagements").insertOne(role)

    const result = await checkEmailCreationAccess({
      email: "user@test.com",
      siret: "42476141900045",
      entityType: AccessEntityType.ENTREPRISE,
    })
    expect(result).not.toBeNull()
    expect(result?.errorCode).toBe(BusinessErrorCodes.ROLE_DENIED)
    expect(result?.message).toContain("15/01/2026")
  })

  it("returns ALREADY_EXISTS (not ROLE_DENIED) when DENIED role is followed by a more recent GRANTED event", async () => {
    const user = generateUserWithAccountFixture({ email: "user@test.com" })
    const entreprise = generateEntrepriseFixture({ siret: "42476141900045" })
    const role = generateRoleManagementFixture({
      user_id: user._id,
      authorized_id: entreprise._id.toString(),
      authorized_type: AccessEntityType.ENTREPRISE,
      status: [
        roleManagementEventFactory({ status: AccessStatus.DENIED, date: new Date("2026-01-10T10:00:00.000Z") }),
        roleManagementEventFactory({ status: AccessStatus.GRANTED, date: new Date("2026-01-20T10:00:00.000Z") }),
      ],
    })
    await getDbCollection("userswithaccounts").insertOne(user)
    await getDbCollection("entreprises").insertOne(entreprise)
    await getDbCollection("rolemanagements").insertOne(role)

    const result = await checkEmailCreationAccess({
      email: "user@test.com",
      siret: "42476141900045",
      entityType: AccessEntityType.ENTREPRISE,
    })
    expect(result?.errorCode).toBe(BusinessErrorCodes.ALREADY_EXISTS)
  })

  it("returns ALREADY_EXISTS when user has an active GRANTED role on any entity", async () => {
    const user = generateUserWithAccountFixture({ email: "user@test.com" })
    const otherEntrepriseId = new ObjectId()
    const role = generateRoleManagementFixture({
      user_id: user._id,
      authorized_id: otherEntrepriseId.toString(),
      authorized_type: AccessEntityType.ENTREPRISE,
      status: [roleManagementEventFactory({ status: AccessStatus.GRANTED })],
    })
    const entreprise = generateEntrepriseFixture({ siret: "42476141900045" })
    await getDbCollection("userswithaccounts").insertOne(user)
    await getDbCollection("entreprises").insertOne(entreprise)
    await getDbCollection("rolemanagements").insertOne(role)

    const result = await checkEmailCreationAccess({
      email: "user@test.com",
      siret: "42476141900045",
      entityType: AccessEntityType.ENTREPRISE,
    })
    expect(result).not.toBeNull()
    expect(result?.errorCode).toBe(BusinessErrorCodes.ALREADY_EXISTS)
  })

  it("returns ALREADY_EXISTS when user has an AWAITING_VALIDATION role on any entity", async () => {
    const user = generateUserWithAccountFixture({ email: "user@test.com" })
    const otherEntrepriseId = new ObjectId()
    const role = generateRoleManagementFixture({
      user_id: user._id,
      authorized_id: otherEntrepriseId.toString(),
      authorized_type: AccessEntityType.ENTREPRISE,
      status: [roleManagementEventFactory({ status: AccessStatus.AWAITING_VALIDATION })],
    })
    const entreprise = generateEntrepriseFixture({ siret: "42476141900045" })
    await getDbCollection("userswithaccounts").insertOne(user)
    await getDbCollection("entreprises").insertOne(entreprise)
    await getDbCollection("rolemanagements").insertOne(role)

    const result = await checkEmailCreationAccess({
      email: "user@test.com",
      siret: "42476141900045",
      entityType: AccessEntityType.ENTREPRISE,
    })
    expect(result).not.toBeNull()
    expect(result?.errorCode).toBe(BusinessErrorCodes.ALREADY_EXISTS)
  })

  it("ROLE_DENIED takes priority over ALREADY_EXISTS when entity has DENIED and user has active role elsewhere", async () => {
    const user = generateUserWithAccountFixture({ email: "user@test.com" })
    const entreprise = generateEntrepriseFixture({ siret: "42476141900045" })
    const otherEntrepriseId = new ObjectId()
    const deniedDate = new Date("2026-03-01T10:00:00.000Z")
    const deniedRole = generateRoleManagementFixture({
      user_id: user._id,
      authorized_id: entreprise._id.toString(),
      authorized_type: AccessEntityType.ENTREPRISE,
      status: [roleManagementEventFactory({ status: AccessStatus.DENIED, date: deniedDate })],
    })
    const activeRole = generateRoleManagementFixture({
      user_id: user._id,
      authorized_id: otherEntrepriseId.toString(),
      authorized_type: AccessEntityType.ENTREPRISE,
      status: [roleManagementEventFactory({ status: AccessStatus.GRANTED })],
    })
    await getDbCollection("userswithaccounts").insertOne(user)
    await getDbCollection("entreprises").insertOne(entreprise)
    await getDbCollection("rolemanagements").insertMany([deniedRole, activeRole])

    const result = await checkEmailCreationAccess({
      email: "user@test.com",
      siret: "42476141900045",
      entityType: AccessEntityType.ENTREPRISE,
    })
    expect(result?.errorCode).toBe(BusinessErrorCodes.ROLE_DENIED)
  })

  it("works for CFA entity type", async () => {
    const user = generateUserWithAccountFixture({ email: "user@test.com" })
    const cfa = generateCfaFixture({ siret: "35306634300016" })
    const deniedDate = new Date("2026-02-10T10:00:00.000Z")
    const role = generateRoleManagementFixture({
      user_id: user._id,
      authorized_id: cfa._id.toString(),
      authorized_type: AccessEntityType.CFA,
      status: [roleManagementEventFactory({ status: AccessStatus.DENIED, date: deniedDate })],
    })
    await getDbCollection("userswithaccounts").insertOne(user)
    await getDbCollection("cfas").insertOne(cfa)
    await getDbCollection("rolemanagements").insertOne(role)

    const result = await checkEmailCreationAccess({
      email: "user@test.com",
      siret: "35306634300016",
      entityType: AccessEntityType.CFA,
    })
    expect(result?.errorCode).toBe(BusinessErrorCodes.ROLE_DENIED)
    expect(result?.message).toContain("10/02/2026")
  })
})
