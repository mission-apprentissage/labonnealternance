import type { IJobSearchQuery } from "api-alternance-sdk"
import type { IJobSearchResponseLba, IJobOfferWritableLba, IJobOfferCreateResponseLba } from "api-alternance-sdk/internal"
import { Jsonify } from "type-fest"
import { describe, expectTypeOf, it } from "vitest"
import { z } from "zod"

import { TRAINING_REMOTE_TYPE } from "../../constants"
import { IJobsPartnersWritableApiInput } from "../../models/jobsPartners.model"
import { zJobsRoutesV2 } from "../jobs.routes.v2"

describe("GET /jobs/search", () => {
  const {
    querystring,
    response: { 200: zResponse },
  } = zJobsRoutesV2.get["/jobs/search"]

  it("should questring schema match", () => {
    expectTypeOf<IJobSearchQuery>().toMatchTypeOf<z.input<typeof querystring>>()
  })

  it("should match response schema", () => {
    expectTypeOf<Jsonify<z.output<typeof zResponse>>>().toMatchTypeOf<Jsonify<IJobSearchResponseLba>>()
  })
})

describe("POST /jobs", () => {
  const {
    body,
    response: { 201: zResponse },
  } = zJobsRoutesV2.post["/jobs"]

  it("should body schema match", () => {
    type ExpectedBody = Omit<z.input<typeof body>, "contract_remote"> & {
      contract_remote?: `${TRAINING_REMOTE_TYPE}` | IJobsPartnersWritableApiInput["contract_remote"]
    }

    expectTypeOf<Jsonify<IJobOfferWritableLba>>().toMatchTypeOf<ExpectedBody>()
  })

  it("should match response schema", () => {
    expectTypeOf<Jsonify<z.output<typeof zResponse>>>().toMatchTypeOf<Jsonify<IJobOfferCreateResponseLba>>()
  })
})

describe("PUT /jobs/:id", () => {
  const { body } = zJobsRoutesV2.put["/jobs/:id"]

  it("should body schema match", () => {
    type ExpectedBody = Omit<z.input<typeof body>, "contract_remote"> & {
      contract_remote?: `${TRAINING_REMOTE_TYPE}` | IJobsPartnersWritableApiInput["contract_remote"]
    }

    expectTypeOf<Jsonify<IJobOfferWritableLba>>().toMatchTypeOf<ExpectedBody>()
  })
})
