import { givenAConnectedOpcoUser } from "@tests/fixture/connectedUser.fixture"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { OPCOS_LABEL } from "shared/constants"
import { generateJobFixture, generateRecruiterFixture } from "shared/fixtures/recruiter.fixture"
import { AccessEntityType, JOB_STATUS } from "shared/models"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { generateEntrepriseFixture } from "../../../../shared/fixtures/entreprise.fixture"

describe("formulaire.controller", () => {
  useMongo()
  const httpClient = useServer()

  it("met à jour une offre active", async () => {
    // given
    const opco = OPCOS_LABEL.CONSTRUCTYS
    const entreprise = generateEntrepriseFixture()
    await getDbCollection("entreprises").insertOne(entreprise)
    const { siret } = entreprise
    const recruiter = generateRecruiterFixture({
      establishment_siret: siret,
      opco,
      jobs: [generateJobFixture({ job_status: JOB_STATUS.ACTIVE })],
    })
    await getDbCollection("recruiters").insertOne(recruiter)
    const { cookies } = await givenAConnectedOpcoUser(
      {},
      {
        authorized_id: opco,
        authorized_type: AccessEntityType.OPCO,
      }
    )

    // when
    const job = recruiter.jobs[0]
    const jobId = job._id.toString()
    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/formulaire/offre/${jobId}`,
      cookies,
      body: {
        ...job,
        job_update_date: new Date(),
        job_creation_date: new Date(job.job_creation_date!),
        job_expiration_date: new Date(job.job_expiration_date!),
        job_count: 3,
        _id: undefined,
      },
    })
    // then
    expect.soft(response.statusCode).toBe(200)
  })
  it.each([JOB_STATUS.ANNULEE, JOB_STATUS.POURVUE, JOB_STATUS.EN_ATTENTE])("interdit la mise à jour d'une offre au status %s", async (jobStatus) => {
    // given
    const opco = OPCOS_LABEL.CONSTRUCTYS
    const entreprise = generateEntrepriseFixture()
    await getDbCollection("entreprises").insertOne(entreprise)
    const { siret } = entreprise
    const recruiter = generateRecruiterFixture({
      establishment_siret: siret,
      opco,
      jobs: [generateJobFixture({ job_status: jobStatus })],
    })
    await getDbCollection("recruiters").insertOne(recruiter)
    const { cookies } = await givenAConnectedOpcoUser(
      {},
      {
        authorized_id: opco,
        authorized_type: AccessEntityType.OPCO,
      }
    )

    // when
    const job = recruiter.jobs[0]
    const jobId = job._id.toString()
    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/formulaire/offre/${jobId}`,
      cookies,
      body: {
        ...job,
        job_update_date: new Date(),
        job_creation_date: new Date(job.job_creation_date!),
        job_expiration_date: new Date(job.job_expiration_date!),
        job_count: 3,
        _id: undefined,
      },
    })
    // then
    expect.soft(response.statusCode).toBe(409)
  })
})
