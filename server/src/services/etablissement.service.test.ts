import { useMongo } from "@tests/utils/mongo.test.utils"
import { roleManagementEventFactory, saveEntreprise, saveUserWithAccount } from "@tests/utils/user.test.utils"
import { ObjectId } from "mongodb"
import nock from "nock"
import { AccessEntityType, AccessStatus } from "shared"
import { BusinessErrorCodes } from "shared/constants/error-codes"
import { ENTREPRISE, OPCOS_LABEL, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { generateCacheInfoSiretForSiret } from "shared/fixtures/cache-info-siret.fixture"
import { generateCfaFixture } from "shared/fixtures/cfa.fixture"
import { generateEntrepriseFixture } from "shared/fixtures/entreprise.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { generateRoleManagementFixture } from "shared/fixtures/role-management.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/user-with-account.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { getLastStatusEvent } from "shared/utils/get-last-status-event"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { generateFCOpcoResponseFixture, nockFranceCompetencesOpcoSearch } from "@/common/apis/france-competences/france-competences-client.fixture"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import { referentielContactReason } from "./auto-validation-reasons"
import {
  autoValidateUserRoleOnCompany,
  getEntrepriseDataFromSiret,
  getOpcoData,
  matchCfaReferentielContact,
  validateCreationEntrepriseFromCfa,
  verifyRecruiterEmailInUse,
} from "./etablissement.service"
import { getGeoCoordinates } from "./geolocation.service"

vi.mock("@/common/utils/sentry-utils")
vi.mock("./geolocation.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./geolocation.service")>()),
  getGeoCoordinates: vi.fn(async () => ({ latitude: 48.86, longitude: 2.34 })),
}))

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

describe("matchCfaReferentielContact", () => {
  const contact = (email: string, sources: string[]) => ({ email, sources, confirmé: false, date_collecte: "2025-01-16T04:30:06.597Z" })

  it("ne valide pas un webmail grand public partagé avec un contact", () => {
    expect(matchCfaReferentielContact([contact("contact.cfa@gmail.com", ["catalogue"])], "autre@gmail.com")).toBeNull()
  })

  it("ne valide pas un domaine qui ne fait que contenir celui d'un contact", () => {
    expect(matchCfaReferentielContact([contact("admin@cfa.com", ["catalogue"])], "admin@faux-cfa.com")).toBeNull()
    expect(matchCfaReferentielContact([contact("admin@cfa.com", ["catalogue"])], "admin@cfa.com.evil.fr")).toBeNull()
  })

  it("ne valide pas le même identifiant sur un autre domaine", () => {
    expect(matchCfaReferentielContact([contact("john.doe@cfa.com", ["acce"])], "john.doe@autre-cfa.fr")).toBeNull()
  })

  it("ne valide rien sans contact", () => {
    expect(matchCfaReferentielContact([], "admin@cfa.com")).toBeNull()
  })

  it("ne retient pas un contact sans e-mail", () => {
    expect(matchCfaReferentielContact([contact("", ["catalogue"])], "admin@cfa.com")).toBeNull()
  })

  it("ne garde que les sources du contact exact, même si d'autres contacts partagent le domaine", () => {
    const contacts = [contact("admin@cfa.com", ["catalogue"]), contact("John.Doe@CFA.com", ["acce"])]
    expect(matchCfaReferentielContact(contacts, "john.doe@cfa.com")).toEqual({ on: "email", sources: ["acce"] })
  })

  it("accepte un webmail grand public quand l'e-mail exact est un contact", () => {
    expect(matchCfaReferentielContact([contact("contact.cfa@gmail.com", ["catalogue"])], "Contact.CFA@gmail.com")).toEqual({ on: "email", sources: ["catalogue"] })
  })

  it("réunit sans doublon et trie les sources de tous les contacts du domaine", () => {
    const contacts = [contact("admin@cfa.com", ["catalogue"]), contact("john.doe@cfa.com", ["acce", "catalogue"]), contact("autre@ailleurs.fr", ["deca"])]
    expect(matchCfaReferentielContact(contacts, "nouveau@cfa.com")).toEqual({ on: "domain", sources: ["acce", "catalogue"] })
  })

  it("signale dans la raison un contact sans source", () => {
    const match = matchCfaReferentielContact([contact("admin@cfa.com", [])], "admin@cfa.com")
    expect(match && referentielContactReason(match)).toBe("validation par : Référentiel (sources : non transmises ; correspondance : email)")
  })
})

describe("getOpcoData", () => {
  const siret = "42476141900045"

  beforeEach(() => {
    nock.disableNetConnect()
    return () => {
      nock.cleanAll()
      nock.enableNetConnect()
    }
  })

  it("enregistre l'IDCC renvoyé par France Compétences", async () => {
    nockFranceCompetencesOpcoSearch(siret, generateFCOpcoResponseFixture({ siret, idcc: "1486", opcoRattachement: { code: "1", nom: "ATLAS" } }))

    expect(await getOpcoData(siret)).toEqual({ opco: OPCOS_LABEL.ATLAS, idcc: 1486 })
    expect(await getDbCollection("opcos").findOne({ siren: "424761419" })).toMatchObject({ opco: OPCOS_LABEL.ATLAS, idcc: 1486 })
  })
})

describe("refus des organismes de formation selon le code NAF", () => {
  const siret = "42476141900045"
  const cfa_delegated_siret = "13002526500013"

  const givenSiretWithNaf = async (code: string) => {
    const fixture = generateCacheInfoSiretForSiret(siret)
    await getDbCollection("cache_siret").insertOne({ ...fixture, data: { data: { ...fixture.data!.data, activite_principale: { code, libelle: "libellé" } } } })
  }

  it.each([
    ["85.59G", true],
    ["85.59A", true],
    ["85.10Y", false],
  ])("compte entreprise, NAF %s : refusé = %s", async (code, refused) => {
    await givenSiretWithNaf(code)

    const result = await getEntrepriseDataFromSiret({ siret, type: ENTREPRISE })

    if (refused) {
      expect(result).toMatchObject({ error: true, errorCode: BusinessErrorCodes.IS_CFA })
    } else {
      expect(result).toMatchObject({ establishment_siret: siret, naf_code: code })
    }
  })

  it.each([
    ["85.59G", true],
    ["85.10Y", false],
  ])("entreprise déléguée par un CFA, NAF %s : refusée = %s", async (nafCode, refused) => {
    const result = await validateCreationEntrepriseFromCfa({ siret, cfa_delegated_siret, nafCode })

    if (refused) {
      expect(result).toMatchObject({ error: true, errorCode: BusinessErrorCodes.IS_CFA })
    } else {
      expect(result).toBeUndefined()
    }
  })
})

describe("refus des établissements domiciliés à l'étranger", () => {
  const siret = "42476141900045"

  const givenSiretWithAdresse = async (adresse: Record<string, unknown>) => {
    const fixture = generateCacheInfoSiretForSiret(siret)
    const data = fixture.data!.data
    await getDbCollection("cache_siret").insertOne({ ...fixture, data: { data: { ...data, adresse: { ...data.adresse, ...adresse } } } })
  }

  beforeEach(() => {
    vi.mocked(getGeoCoordinates).mockClear()
  })

  afterEach(() => {
    vi.mocked(getGeoCoordinates).mockImplementation(async () => ({ latitude: 48.86, longitude: 2.34 }))
  })

  it.each([[{ code_pays_etranger: "99404" }], [{ libelle_pays_etranger: "ETATS-UNIS" }]])("adresse %o : erreur métier sans géocodage", async (adresse) => {
    await givenSiretWithAdresse(adresse)

    const result = await getEntrepriseDataFromSiret({ siret, type: ENTREPRISE })

    expect.soft(result).toEqual({ error: true, message: "Les établissements domiciliés à l'étranger ne sont pas pris en charge.", errorCode: undefined })
    expect.soft(getGeoCoordinates).not.toHaveBeenCalled()
  })

  it("répond en anglais pour l'API apprentissage", async () => {
    await givenSiretWithAdresse({ code_pays_etranger: "99404" })

    const result = await getEntrepriseDataFromSiret({ siret, type: ENTREPRISE, isApiApprentissage: true })

    expect(result).toMatchObject({ error: true, message: "Establishments located outside France are not supported." })
  })

  it.each([[{}], [{ code_pays_etranger: null, libelle_pays_etranger: null }], [{ libelle_commune_etranger: null, code_pays_etranger: "" }]])(
    "adresse française %o : géocodée et acceptée",
    async (adresse) => {
      await givenSiretWithAdresse(adresse)

      const result = await getEntrepriseDataFromSiret({ siret, type: ENTREPRISE })

      expect.soft(result).toMatchObject({ establishment_siret: siret, geo_coordinates: "48.86,2.34" })
      expect.soft(getGeoCoordinates).toHaveBeenCalled()
    }
  )

  it("lève toujours quand le géocodage d'une adresse française échoue", async () => {
    await givenSiretWithAdresse({})
    vi.mocked(getGeoCoordinates).mockRejectedValue(new Error("getGeoPoint: addresse non trouvée"))

    await expect(getEntrepriseDataFromSiret({ siret, type: ENTREPRISE })).rejects.toThrow("getGeoPoint: addresse non trouvée")
  })
})
