import { createJobPartner } from "@tests/utils/jobsPartners.test.utils"
import { createAndLogUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"

vi.mock("job-processor", async (importOriginal) => {
  const mod = await importOriginal<typeof import("job-processor")>()
  return { ...mod, addJob: vi.fn().mockResolvedValue(undefined) }
})

describe("admin jobs-partners controller", () => {
  useMongo()
  const httpClient = useServer()

  it("refuse l'accès à un utilisateur non admin", async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "userCfa", { type: "CFA" })

    const response = await httpClient().inject({
      method: "GET",
      path: "/api/admin/jobs-partners",
      headers: bearerToken,
    })

    expect(response.statusCode).toEqual(403)
  })

  it("liste les offres partenaires et exclut les offres LBA", async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })
    await createJobPartner({ partner_label: "Meteojob", offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_creation: new Date("2026-01-01") })
    await createJobPartner({ partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_creation: new Date("2026-01-02") })

    const response = await httpClient().inject({
      method: "GET",
      path: "/api/admin/jobs-partners",
      headers: bearerToken,
    })

    expect(response.statusCode).toEqual(200)
    const body = response.json()
    expect(body.pagination.total).toEqual(1)
    expect(body.jobs).toHaveLength(1)
    expect(body.jobs[0].partner_label).toEqual("Meteojob")
  })

  it("désactive puis réactive une offre en conservant l'historique", async () => {
    const { bearerToken, user } = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })
    const jobPartner = await createJobPartner({ partner_label: "Meteojob", offer_status: JOB_STATUS_ENGLISH.ACTIVE })

    const deactivateResponse = await httpClient().inject({
      method: "POST",
      path: `/api/admin/jobs-partners/${jobPartner._id.toString()}/deactivate`,
      headers: bearerToken,
      body: { reason: "raison de test" },
    })
    expect(deactivateResponse.statusCode).toEqual(200)

    let updatedJob = await getDbCollection("jobs_partners").findOne({ _id: jobPartner._id })
    expect(updatedJob?.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
    expect(updatedJob?.offer_status_history.at(-1)).toMatchObject({ status: JOB_STATUS_ENGLISH.ANNULEE, reason: "raison de test", granted_by: user.email })

    const deactivateAgainResponse = await httpClient().inject({
      method: "POST",
      path: `/api/admin/jobs-partners/${jobPartner._id.toString()}/deactivate`,
      headers: bearerToken,
      body: { reason: "raison de test" },
    })
    expect(deactivateAgainResponse.statusCode).toEqual(400)

    const activateResponse = await httpClient().inject({
      method: "POST",
      path: `/api/admin/jobs-partners/${jobPartner._id.toString()}/activate`,
      headers: bearerToken,
    })
    expect(activateResponse.statusCode).toEqual(200)

    updatedJob = await getDbCollection("jobs_partners").findOne({ _id: jobPartner._id })
    expect(updatedJob?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
  })

  it("renvoie updated: false quand aucune entrée cache_classification ne correspond à l'offre", async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })
    const jobPartner = await createJobPartner({ partner_label: "Meteojob", partner_job_id: "no-entry", offer_status: JOB_STATUS_ENGLISH.ACTIVE })

    const response = await httpClient().inject({
      method: "POST",
      path: `/api/admin/jobs-partners/${jobPartner._id.toString()}/classification`,
      headers: bearerToken,
      body: { classification: "unpublish" },
    })

    expect(response.statusCode).toEqual(200)
    expect(response.json()).toEqual({ updated: false })
  })

  it("signale une offre comme CFA et l'annule automatiquement si le modèle est en désaccord", async () => {
    const { bearerToken, user } = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })
    const jobPartner = await createJobPartner({ partner_label: "Meteojob", partner_job_id: "with-entry", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    await getDbCollection("cache_classification").insertOne({
      _id: new ObjectId(),
      partner_label: "Meteojob",
      partner_job_id: "with-entry",
      classification: "publish",
      human_verification: null,
      scores: { publish: 0.9, unpublish: 0.1 },
      model: "test-model",
      created_at: new Date(),
    })

    const response = await httpClient().inject({
      method: "POST",
      path: `/api/admin/jobs-partners/${jobPartner._id.toString()}/classification`,
      headers: bearerToken,
      body: { classification: "unpublish" },
    })

    expect(response.statusCode).toEqual(200)
    expect(response.json()).toEqual({ updated: true })

    const entry = await getDbCollection("cache_classification").findOne({ partner_label: "Meteojob", partner_job_id: "with-entry" })
    expect(entry?.human_verification).toEqual("unpublish")

    const updatedJob = await getDbCollection("jobs_partners").findOne({ _id: jobPartner._id })
    expect(updatedJob?.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
    expect(updatedJob?.offer_status_history.at(-1)).toMatchObject({ status: JOB_STATUS_ENGLISH.ANNULEE, granted_by: user.email })
  })
})
