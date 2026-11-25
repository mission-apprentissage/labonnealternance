import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { UNSUBSCRIBE_REASONS } from "shared/constants/unsubscribe"
import { generateApplicationFixture } from "shared/fixtures/application.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { UNSUBSCRIBE_REASON_DETAIL_MAX_LENGTH } from "shared/models/unsubscribed-recruteur-lba.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"

vi.mock("@/services/mailer.service", () => ({
  default: { sendEmail: vi.fn().mockResolvedValue({ messageId: "test-message-id", accepted: ["test@example.com"] }) },
}))

vi.mock("@/services/search/search-items.service", () => ({
  syncJobPartnersToSearchItemsInBackground: vi.fn(),
}))

const email = "recrutement@entreprise.fr"

describe("unsubscribe recruteur LBA", () => {
  useMongo()
  const httpClient = useServer()

  const insertCompanies = async (sirets: string[]) => {
    await getDbCollection("jobs_partners").insertMany(
      sirets.map((siret) => generateJobsPartnersOfferPrivate({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA, apply_email: email, workplace_siret: siret }))
    )
  }

  beforeEach(async () => {
    await getDbCollection("jobs_partners").deleteMany({})
    await getDbCollection("unsubscribedrecruteurslba").deleteMany({})
    await getDbCollection("applications").deleteMany({})
  })

  it("enregistre la précision du motif, sans les espaces autour", async () => {
    await insertCompanies(["11000001500013"])

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/unsubscribe",
      body: { email, reason: "Autre", reason_detail: "  Nous changeons d'activité  " },
    })

    expect(response.statusCode).toBe(200)
    const [unsubscribed] = await getDbCollection("unsubscribedrecruteurslba").find({}).toArray()
    expect(unsubscribed).toMatchObject({ unsubscribe_reason: "Autre", unsubscribe_reason_detail: "Nous changeons d'activité" })
  })

  it.each([
    ["absente", {}],
    ["vide", { reason_detail: "   " }],
  ])("enregistre une précision %s à null", async (_label, detail) => {
    await insertCompanies(["11000001500013"])

    const response = await httpClient().inject({ method: "POST", path: "/api/unsubscribe", body: { email, reason: "Autre", ...detail } })

    expect(response.statusCode).toBe(200)
    const [unsubscribed] = await getDbCollection("unsubscribedrecruteurslba").find({}).toArray()
    expect(unsubscribed.unsubscribe_reason_detail).toBeNull()
  })

  it("enregistre la précision du motif pour chaque établissement choisi", async () => {
    await insertCompanies(["11000001500013", "11000001500021"])

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/unsubscribe/sirets",
      body: { email, reason: "Autre", reason_detail: "Fermeture saisonnière", sirets: ["11000001500013", "11000001500021"] },
    })

    expect(response.statusCode).toBe(200)
    const unsubscribed = await getDbCollection("unsubscribedrecruteurslba").find({}).toArray()
    expect(unsubscribed.map((company) => company.unsubscribe_reason_detail)).toEqual(["Fermeture saisonnière", "Fermeture saisonnière"])
  })

  it("refuse une précision trop longue", async () => {
    await insertCompanies(["11000001500013"])

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/unsubscribe",
      body: { email, reason: "Autre", reason_detail: "a".repeat(UNSUBSCRIBE_REASON_DETAIL_MAX_LENGTH + 1) },
    })

    expect(response.statusCode).toBe(400)
    expect(await getDbCollection("unsubscribedrecruteurslba").countDocuments()).toBe(0)
  })

  it("conserve l'e-mail de l'établissement pour le motif « déjà trouvé nos alternants »", async () => {
    await insertCompanies(["11000001500013"])

    const response = await httpClient().inject({ method: "POST", path: "/api/unsubscribe", body: { email, reason: UNSUBSCRIBE_REASONS.DEJA_TROUVE } })

    expect(response.statusCode).toBe(200)
    const [unsubscribed] = await getDbCollection("unsubscribedrecruteurslba").find({}).toArray()
    expect(unsubscribed.email).toBe(email)
  })

  it.each([UNSUBSCRIBE_REASONS.ENTREPRISE_FERMEE, UNSUBSCRIBE_REASONS.OPPOSITION, UNSUBSCRIBE_REASONS.AUTRE])("ne conserve pas l'e-mail pour le motif « %s »", async (reason) => {
    await insertCompanies(["11000001500013"])

    const response = await httpClient().inject({ method: "POST", path: "/api/unsubscribe", body: { email, reason } })

    expect(response.statusCode).toBe(200)
    const [unsubscribed] = await getDbCollection("unsubscribedrecruteurslba").find({}).toArray()
    expect(unsubscribed.email).toBeNull()
  })

  it("anonymise les candidatures reçues par l'établissement qui s'oppose au traitement de ses données", async () => {
    const siret = "11000001500013"
    await insertCompanies([siret])
    await getDbCollection("applications").insertOne(generateApplicationFixture({ company_siret: siret, company_email: email }))

    const response = await httpClient().inject({ method: "POST", path: "/api/unsubscribe", body: { email, reason: UNSUBSCRIBE_REASONS.OPPOSITION } })

    expect(response.statusCode).toBe(200)
    const application = await getDbCollection("applications").findOne({ company_siret: siret })
    expect(application?.company_email).not.toBe(email)
  })

  it("laisse les candidatures intactes pour un autre motif", async () => {
    const siret = "11000001500013"
    await insertCompanies([siret])
    await getDbCollection("applications").insertOne(generateApplicationFixture({ company_siret: siret, company_email: email }))

    await httpClient().inject({ method: "POST", path: "/api/unsubscribe", body: { email, reason: UNSUBSCRIBE_REASONS.DEJA_TROUVE } })

    const application = await getDbCollection("applications").findOne({ company_siret: siret })
    expect(application?.company_email).toBe(email)
  })
})
