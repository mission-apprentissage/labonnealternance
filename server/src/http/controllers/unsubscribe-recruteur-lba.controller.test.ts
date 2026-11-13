import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
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
})
