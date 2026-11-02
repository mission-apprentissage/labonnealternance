import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobs-partners-computed.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { fillFieldsForComputedPartnersFactory } from "./fill-fields-for-partners-factory"

const job = COMPUTED_ERROR_SOURCE.API_DIAGORIENTE
const [A, B, C] = ["Boulanger", "Cuisinier", "Plombier"]

const fillRome = (
  respond: (documents: Pick<IComputedJobsPartners, "_id" | "offer_title" | "offer_rome_codes">[]) => Array<Pick<IComputedJobsPartners, "_id" | "offer_rome_codes">>
) =>
  fillFieldsForComputedPartnersFactory({
    job,
    sourceFields: ["offer_title"],
    filledFields: ["offer_rome_codes"],
    groupSize: 10,
    getData: async (documents) => respond(documents),
  })

const givenOffers = (titles: string[]) =>
  givenSomeComputedJobPartners(
    titles.map((offer_title) => ({ partner_job_id: offer_title, offer_title, offer_rome_codes: null, business_error: null, errors: [], jobs_in_success: [] }))
  )

const stateByTitle = async () => {
  const docs = await getDbCollection("computed_jobs_partners").find({}).toArray()
  return Object.fromEntries(docs.map(({ offer_title, offer_rome_codes, errors, jobs_in_success }) => [offer_title, { offer_rome_codes, errors, jobs_in_success }]))
}

describe("fillFieldsForComputedPartnersFactory", () => {
  useMongo()

  it("pose « data not found » sur l'offre sans réponse, pas sur la dernière du lot", async () => {
    await givenOffers([A, B, C])

    const counters = await fillRome((documents) => documents.filter(({ offer_title }) => offer_title !== B).map(({ _id }) => ({ _id, offer_rome_codes: ["M1607"] })))

    const state = await stateByTitle()
    expect.soft(state[B]).toEqual({ offer_rome_codes: null, errors: [{ source: job, error: "data not found" }], jobs_in_success: [] })
    expect.soft(state[A]).toEqual({ offer_rome_codes: ["M1607"], errors: [], jobs_in_success: [job] })
    expect.soft(state[C]).toEqual({ offer_rome_codes: ["M1607"], errors: [], jobs_in_success: [job] })
    expect.soft(counters).toEqual({ total: 3, success: 2, error: 1 })
  })

  it("(faux positif) des réponses dans le désordre, avec des _id relus en base, ne produisent aucune erreur", async () => {
    await givenOffers([A, B, C])

    const counters = await fillRome((documents) => [...documents].reverse().map(({ _id }) => ({ _id: new ObjectId(_id.toString()), offer_rome_codes: ["M1607"] })))

    const state = await stateByTitle()
    for (const title of [A, B, C]) {
      expect.soft(state[title]).toEqual({ offer_rome_codes: ["M1607"], errors: [], jobs_in_success: [job] })
    }
    expect.soft(counters).toEqual({ total: 3, success: 3, error: 0 })
  })

  it("pose « data not found » sur toutes les offres quand aucune n'a de réponse", async () => {
    await givenOffers([A, B])

    const counters = await fillRome(() => [])

    const state = await stateByTitle()
    for (const title of [A, B]) {
      expect.soft(state[title]).toEqual({ offer_rome_codes: null, errors: [{ source: job, error: "data not found" }], jobs_in_success: [] })
    }
    expect.soft(counters).toEqual({ total: 2, success: 0, error: 2 })
  })

  it("ne cumule pas « data not found » sur les runs successifs, sans toucher aux erreurs des autres étapes", async () => {
    await givenSomeComputedJobPartners([
      {
        partner_job_id: A,
        offer_title: A,
        offer_rome_codes: null,
        business_error: null,
        errors: [{ source: COMPUTED_ERROR_SOURCE.VALIDATION, error: "offer_rome_codes manquant" }],
        jobs_in_success: [],
      },
    ])

    await fillRome(() => [])
    await fillRome(() => [])

    const state = await stateByTitle()
    expect(state[A].errors).toEqual([
      { source: COMPUTED_ERROR_SOURCE.VALIDATION, error: "offer_rome_codes manquant" },
      { source: job, error: "data not found" },
    ])
  })
})
