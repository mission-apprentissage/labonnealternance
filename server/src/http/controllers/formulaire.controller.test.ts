import { TRAINING_CONTRACT_TYPE } from "shared/constants/index"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import { AccessEntityType, JOB_STATUS } from "shared/models/index"
import { beforeEach, describe, expect, it } from "vitest"

import dayjs from "shared/helpers/dayjs"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { givenAConnectedOpcoUser } from "@tests/fixture/connectedUser.fixture"
import type { OfferCreationResponse } from "@tests/use-cases/entrepriseUseCase"
import { entrepriseUseCase } from "@tests/use-cases/entrepriseUseCase"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"

describe("formulaire.controller", () => {
  useMongo()
  const httpClient = useServer()

  const romeCode = "M1602"
  const referentielRome = generateReferentielRome()
  referentielRome.rome.code_rome = romeCode

  beforeEach(async () => {
    await getDbCollection("referentielromes").insertOne(referentielRome)

    return async () => {
      await getDbCollection("referentielromes").deleteMany({})
    }
  })

  it("crée une offre", async () => {
    // given
    const { cookies: entrepriseCookies, formulaire } = await entrepriseUseCase.getConnectedUser(httpClient)
    // when
    const offerResponse = await entrepriseUseCase.createOffer(httpClient, {
      establishment_id: formulaire!.establishment_id,
      cookies: entrepriseCookies,
      job: {
        job_start_date: dayjs().add(1, "day").toDate(),
        rome_code: [romeCode],
        rome_appellation_label: referentielRome.appellations[0].libelle,
        rome_label: referentielRome.rome.intitule,
        competences_rome: referentielRome.competences,
        job_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE],
        job_count: 1,
      },
    })

    // then
    expect.soft(offerResponse.statusCode).toBe(200)
  })

  it("met à jour une offre active", async () => {
    // given
    const { cookies: entrepriseCookies, formulaire } = await entrepriseUseCase.getConnectedUser(httpClient)
    const opco = formulaire!.opco!

    const offerResponse = await entrepriseUseCase.createOffer(httpClient, {
      establishment_id: formulaire!.establishment_id,
      cookies: entrepriseCookies,
      job: {
        job_start_date: dayjs().add(1, "day").toDate(),
        rome_code: [romeCode],
        rome_appellation_label: referentielRome.appellations[0].libelle,
        rome_label: referentielRome.rome.intitule,
        competences_rome: referentielRome.competences,
        job_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE],
        job_count: 1,
      },
    })

    const { recruiter } = offerResponse.json() as OfferCreationResponse
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
  it.each([JOB_STATUS.ANNULEE, JOB_STATUS.POURVUE, JOB_STATUS.EN_ATTENTE])("interdit la mise à jour d'une offre au status %s", async (_jobStatus) => {
    // TODO handle cancel actions, ...

    // given
    const { cookies: entrepriseCookies, formulaire } = await entrepriseUseCase.getConnectedUser(httpClient)
    const opco = formulaire!.opco!

    const offerResponse = await entrepriseUseCase.createOffer(httpClient, {
      establishment_id: formulaire!.establishment_id,
      cookies: entrepriseCookies,
      job: {
        job_start_date: dayjs().add(1, "day").toDate(),
        rome_code: [romeCode],
        rome_appellation_label: referentielRome.appellations[0].libelle,
        rome_label: referentielRome.rome.intitule,
        competences_rome: referentielRome.competences,
        job_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE],
        job_count: 1,
      },
    })

    const { recruiter } = offerResponse.json() as OfferCreationResponse
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
