import { useMongo } from "@tests/utils/mongo.test.utils"
import { roleManagementEventFactory, saveEntreprise, saveUserWithAccount } from "@tests/utils/user.test.utils"
import { ObjectId } from "mongodb"
import nock from "nock"
import { AccessEntityType, AccessStatus } from "shared"
import { BusinessErrorCodes } from "shared/constants/error-codes"
import { ENTREPRISE, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { generateCfaFixture } from "shared/fixtures/cfa.fixture"
import { generateEntrepriseFixture } from "shared/fixtures/entreprise.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { generateRoleManagementFixture } from "shared/fixtures/role-management.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/user-with-account.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { getLastStatusEvent } from "shared/utils/get-last-status-event"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import { autoValidateUserRoleOnCompany, verifyRecruiterEmailInUse } from "./etablissement.service"

vi.mock("@/common/utils/sentry-utils")

useMongo()

describe("checkEmailCreationAccess", () => {
  it("returns null when user does not exist", async () => {
    const result = await verifyRecruiterEmailInUse({
      email: "nonexistent@test.com",
      siret: "42476141900045",
      entityType: AccessEntityType.ENTREPRISE,
    })
    expect(result).toBeNull()
  })

  it("returns null when user exists but entity is not in DB", async () => {
    const user = generateUserWithAccountFixture({ email: "user@test.com" })
    await getDbCollection("userswithaccounts").insertOne(user)

    const result = await verifyRecruiterEmailInUse({
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

    const result = await verifyRecruiterEmailInUse({
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

    const result = await verifyRecruiterEmailInUse({
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

    const result = await verifyRecruiterEmailInUse({
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

    const result = await verifyRecruiterEmailInUse({
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

    const result = await verifyRecruiterEmailInUse({
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

    const result = await verifyRecruiterEmailInUse({
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

    const result = await verifyRecruiterEmailInUse({
      email: "user@test.com",
      siret: "35306634300016",
      entityType: AccessEntityType.CFA,
    })
    expect(result?.errorCode).toBe(BusinessErrorCodes.ROLE_DENIED)
    expect(result?.message).toContain("10/02/2026")
  })
})

describe("autoValidateUserRoleOnCompany : raison enregistrée sur le rôle", () => {
  const siret = "42476141900045"
  const email = "contact@entreprise.exemple.fr"
  const balUrl = new URL(config.bal.baseUrl)
  const mockBal = () => nock(balUrl.origin).post(`${balUrl.pathname.replace(/\/$/, "")}/organisation/validation`)

  beforeAll(() => {
    nock.disableNetConnect()
  })

  beforeEach(() => {
    nock.cleanAll()
  })

  afterAll(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  const validate = async () => {
    const entreprise = await saveEntreprise({ siret })
    const user = await saveUserWithAccount({ email })
    const { validated } = await autoValidateUserRoleOnCompany({ user, organization: { type: ENTREPRISE, entreprise } })
    const role = await getDbCollection("rolemanagements").findOne({ user_id: user._id })
    const lastEvent = getLastStatusEvent(role?.status)
    return { validated, status: lastEvent?.status, reason: lastEvent?.reason, validation_type: lastEvent?.validation_type }
  }

  it.each([
    ["l'e-mail", email, "email"],
    ["le domaine", "rh@entreprise.exemple.fr", "domaine"],
  ])("valide par les recruteurs LBA sur %s, sans appeler BAL", async (_label, recruteurEmail, correspondance) => {
    await getDbCollection("jobs_partners").insertOne(
      generateJobsPartnersOfferPrivate({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA, workplace_siret: siret, apply_email: recruteurEmail })
    )

    expect(await validate()).toEqual({
      validated: true,
      status: AccessStatus.GRANTED,
      reason: `validation par : recruteurs LBA (correspondance : ${correspondance})`,
      validation_type: VALIDATION_UTILISATEUR.AUTO,
    })
  })

  it.each([
    [
      "valide avec sources et correspondance",
      { status: "valid", is_valid: true, on: "email", sources: ["akto"] },
      AccessStatus.GRANTED,
      "validation par : BAL (sources : akto ; correspondance : email)",
    ],
    [
      "valide, ancien format sans source",
      { is_valid: true, on: "domain", sources: [] },
      AccessStatus.GRANTED,
      "validation par : BAL (sources : non transmises ; correspondance : domaine)",
    ],
    ["refus ferme", { status: "invalid", is_valid: false, is_company_email: true }, AccessStatus.AWAITING_VALIDATION, "pas de validation automatique possible"],
    [
      "indéterminé sur un fournisseur",
      { status: "indeterminate", is_valid: false, is_company_email: true, unavailable_sources: ["akto"] },
      AccessStatus.AWAITING_VALIDATION,
      "validation automatique indéterminée : akto indisponible",
    ],
    [
      "indéterminé sur deux fournisseurs",
      { status: "indeterminate", is_valid: false, is_company_email: true, unavailable_sources: ["akto", "opco_ep"] },
      AccessStatus.AWAITING_VALIDATION,
      "validation automatique indéterminée : akto, opco_ep indisponibles",
    ],
  ])("enregistre la réponse BAL %s", async (_label, body, status, reason) => {
    mockBal().reply(200, body)

    expect(await validate()).toMatchObject({ validated: status === AccessStatus.GRANTED, status, reason, validation_type: VALIDATION_UTILISATEUR.AUTO })
  })

  it("distingue BAL indisponible d'un refus", async () => {
    mockBal().reply(503)

    expect(await validate()).toMatchObject({ validated: false, status: AccessStatus.AWAITING_VALIDATION, reason: "validation automatique indéterminée : BAL indisponible" })
  })
})
