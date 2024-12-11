import { ObjectId } from "bson"
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import type { z } from "zod"

import { OPCOS_LABEL, TRAINING_REMOTE_TYPE } from "../../../constants"
import { JOB_STATUS_ENGLISH } from "../../../models"
import type { IJobsPartnersOfferApi } from "../../../models/jobsPartners.model"

import { jobsRouteApiv3Converters, zJobOfferApiWriteV3, type IJobOfferApiReadV3, type zJobOfferApiReadV3, type zJobRecruiterApiReadV3 } from "./jobs.routes.v3.model"

type IJobRecruiterExpected = {
  identifier: {
    id: ObjectId
  }
  workplace: {
    siret: string | null
    brand: string | null
    legal_name: string | null
    website: string | null
    name: string | null
    description: string | null
    size: string | null
    location: {
      address: string
      geopoint: {
        type: "Point"
        coordinates: [number, number]
      }
    }
    domain: {
      idcc: number | null
      opco: OPCOS_LABEL | null
      naf: null | {
        code: string
        label: string | null
      }
    }
  }
  apply: {
    url: string
    phone: string | null
    recipient_id?: string | null
  }
}

type IJobOfferExpected = {
  identifier: {
    id: ObjectId | string | null
    partner_label: string
    partner_job_id: string
  }
  workplace: IJobRecruiterExpected["workplace"]
  apply: IJobRecruiterExpected["apply"]
  contract: {
    start: Date | null
    duration: number | null
    type: Array<"Apprentissage" | "Professionnalisation">
    remote: TRAINING_REMOTE_TYPE | null
  }
  offer: {
    title: string
    rome_codes: string[]
    description: string
    target_diploma: {
      european: "3" | "4" | "5" | "6" | "7"
      label: string
    } | null
    desired_skills: string[]
    to_be_acquired_skills: string[]
    access_conditions: string[]
    publication: {
      creation: Date | null
      expiration: Date | null
    }
    opening_count: number
    status: JOB_STATUS_ENGLISH
  }
}

type IJobOfferApiWriteV3Expected = {
  contract?: {
    duration?: number | null
    type?: Array<"Apprentissage" | "Professionnalisation">
    remote?: TRAINING_REMOTE_TYPE | null
    start?: string | null
  }
  offer: {
    title: string
    rome_codes?: string[] | null
    description: string
    target_diploma?: {
      european?: "3" | "4" | "5" | "6" | "7" | null
    } | null
    desired_skills?: string[]
    to_be_acquired_skills?: string[]
    access_conditions?: string[]
    publication?: {
      creation?: string | null
      expiration?: string | null
    }
    opening_count?: number
    origin?: string | null
    multicast?: boolean
    status?: JOB_STATUS_ENGLISH
  }
  apply: {
    url?: string | null
    phone?: string | null
    email?: string | null
  }
  workplace: {
    siret: string
    name?: string | null
    website?: string | null
    description?: string | null
    location?: { address?: string | null } | null
  }
}

type IJobRecruiterApiReadV3Output = z.output<typeof zJobRecruiterApiReadV3>
type IJobOfferApiReadV3Output = z.output<typeof zJobOfferApiReadV3>
type IJobOfferApiWriteV3Input = z.input<typeof zJobOfferApiWriteV3>

describe("zJobRecruiterApiGetV3", () => {
  it("should have proper typing", () => {
    expectTypeOf<IJobRecruiterApiReadV3Output["identifier"]>().toEqualTypeOf<IJobRecruiterExpected["identifier"]>()
    expectTypeOf<IJobRecruiterApiReadV3Output["apply"]>().toEqualTypeOf<IJobRecruiterExpected["apply"]>()
    expectTypeOf<IJobRecruiterApiReadV3Output["workplace"]>().toEqualTypeOf<IJobRecruiterExpected["workplace"]>()
    expectTypeOf<IJobRecruiterApiReadV3Output>().toEqualTypeOf<IJobRecruiterExpected>()
  })
})

describe("IJobOffer", () => {
  it("should have proper typing", () => {
    expectTypeOf<IJobOfferApiReadV3Output["identifier"]>().toEqualTypeOf<IJobOfferExpected["identifier"]>()
    expectTypeOf<IJobOfferApiReadV3Output["offer"]>().branded.toEqualTypeOf<IJobOfferExpected["offer"]>()
    expectTypeOf<IJobOfferApiReadV3Output["contract"]>().toEqualTypeOf<IJobOfferExpected["contract"]>()
    expectTypeOf<IJobOfferApiReadV3Output["workplace"]>().toEqualTypeOf<IJobOfferExpected["workplace"]>()
    expectTypeOf<IJobOfferApiReadV3Output["apply"]>().toEqualTypeOf<IJobOfferExpected["apply"]>()
    expectTypeOf<IJobOfferApiReadV3Output>().branded.toEqualTypeOf<IJobOfferExpected>()
  })
})

describe("IJobOfferApiWriteV3", () => {
  it("should have proper typing", () => {
    expectTypeOf<IJobOfferApiWriteV3Input["offer"]>().toEqualTypeOf<IJobOfferApiWriteV3Expected["offer"]>()
    expectTypeOf<IJobOfferApiWriteV3Input["offer"]["target_diploma"]>().toEqualTypeOf<IJobOfferApiWriteV3Expected["offer"]["target_diploma"]>()
    expectTypeOf<IJobOfferApiWriteV3Input["contract"]>().toEqualTypeOf<IJobOfferApiWriteV3Expected["contract"]>()
    expectTypeOf<IJobOfferApiWriteV3Input["workplace"]>().branded.toEqualTypeOf<IJobOfferApiWriteV3Expected["workplace"]>()
    expectTypeOf<IJobOfferApiWriteV3Input["apply"]>().toEqualTypeOf<IJobOfferApiWriteV3Expected["apply"]>()
    expectTypeOf<IJobOfferApiWriteV3Input>().toEqualTypeOf<IJobOfferApiWriteV3Expected>()
  })

  const now = new Date("2024-06-18T14:30:00.000Z")
  const oneMinuteAgo = new Date("2024-06-18T14:29:00.000Z")
  const inOneMinute = new Date("2024-06-18T14:31:00.000Z")
  const oneHourAgo = new Date("2024-06-18T13:30:00.000Z")
  const inOneHour = new Date("2024-06-18T15:30:00.000Z")

  const data: IJobOfferApiWriteV3Input = {
    offer: {
      title: "Apprentis en développement web",
      rome_codes: ["M1602"],
      description: "Envie de devenir développeur web ? Rejoignez-nous !",
    },
    apply: {
      email: "mail@mail.com",
    },

    workplace: {
      siret: "39837261500128",
    },
  }

  beforeEach(async () => {
    // Do not mock nextTick
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)

    return () => {
      vi.useRealTimers()
    }
  })

  describe("contract_start", () => {
    it("should be optional", () => {
      const result = zJobOfferApiWriteV3.safeParse({
        ...data,
      })

      expect.soft(result.success).toBe(true)
      expect(result.data?.contract.start).toBe(null)
    })

    it("should be required ISO 8601 date string", () => {
      const result = zJobOfferApiWriteV3.safeParse({
        ...data,
        contract: {
          ...data.contract,
          start: "2024-09-01",
        },
      })

      expect.soft(result.success).toBe(false)
      expect(result.error?.format()).toEqual({
        _errors: [],
        contract: {
          _errors: [],
          start: {
            _errors: ["Expected ISO 8601 date string"],
          },
        },
      })
    })

    it("should allow date in past", () => {
      const result = zJobOfferApiWriteV3.safeParse({
        ...data,
        contract: {
          ...data.contract,
          start: oneHourAgo.toJSON(),
        },
      })

      expect(result.success).toBe(true)
      expect(result.data?.contract.start).toEqual(oneHourAgo)
    })

    it("should allow date in future", () => {
      const result = zJobOfferApiWriteV3.safeParse({
        ...data,
        contract: {
          ...data.contract,
          start: inOneHour.toJSON(),
        },
      })

      expect(result.success).toBe(true)
      expect(result.data?.contract.start).toEqual(inOneHour)
    })
  })

  describe("offer_status", () => {
    it("should be optional", () => {
      const result = zJobOfferApiWriteV3.safeParse({
        ...data,
      })

      expect(result.success).toBe(true)
      expect(result.data?.offer.status).toBe(JOB_STATUS_ENGLISH.ACTIVE)
    })
  })

  describe("offer_creation", () => {
    // Fallback is handled in jobOpportinityService
    it("should allow null", () => {
      const result = zJobOfferApiWriteV3.safeParse({
        ...data,
        offer: {
          ...data.offer,
          publication: {
            ...data.offer.publication,
            creation: null,
          },
        },
      })

      expect(result.success).toBe(true)
      expect(result.data?.offer.publication.creation).toEqual(null)
    })

    it("should be required ISO 8601 date string", () => {
      const result = zJobOfferApiWriteV3.safeParse({
        ...data,
        offer: {
          ...data.offer,
          publication: {
            ...data.offer.publication,
            creation: "2024-09-01",
          },
        },
      })

      expect(result.success).toBe(false)
      expect(result.error?.format()).toEqual({
        _errors: [],
        offer: {
          _errors: [],
          publication: {
            _errors: [],
            creation: {
              _errors: ["Expected ISO 8601 date string"],
            },
          },
        },
      })
    })

    it("should allow date in past", () => {
      const result = zJobOfferApiWriteV3.safeParse({
        ...data,
        offer: {
          ...data.offer,
          publication: {
            ...data.offer.publication,
            creation: oneHourAgo.toJSON(),
          },
        },
      })

      expect(result.success).toBe(true)
      expect(result.data?.offer.publication.creation).toEqual(oneHourAgo)
    })

    it("should not allow date in future", () => {
      const result = zJobOfferApiWriteV3.safeParse({
        ...data,
        offer: {
          ...data.offer,
          publication: {
            ...data.offer.publication,
            creation: inOneHour.toJSON(),
          },
        },
      })

      expect(result.success).toBe(false)
      expect(result.error?.format()).toEqual({
        _errors: [],
        offer: {
          _errors: [],
          publication: {
            _errors: [],
            creation: {
              _errors: ["Creation date cannot be in the future"],
            },
          },
        },
      })
    })

    it("should tolerate time clock sync", () => {
      const result = zJobOfferApiWriteV3.safeParse({
        ...data,
        offer: {
          ...data.offer,
          publication: {
            ...data.offer.publication,
            creation: inOneMinute.toJSON(),
          },
        },
      })

      expect(result.success).toBe(true)
      expect(result.data?.offer.publication.creation).toEqual(inOneMinute)
    })
  })

  describe("offer_expiration", () => {
    // Fallback is handled in jobOpportinityService
    it("should allow null", () => {
      const result = zJobOfferApiWriteV3.safeParse({
        ...data,
        offer: {
          ...data.offer,
          publication: {
            ...data.offer.publication,
            expiration: null,
          },
        },
      })

      expect(result.success).toBe(true)
      expect(result.data?.offer.publication.expiration).toEqual(null)
    })

    it("should be required ISO 8601 date string", () => {
      const result = zJobOfferApiWriteV3.safeParse({
        ...data,
        offer: {
          ...data.offer,
          publication: {
            ...data.offer.publication,
            expiration: "2024-09-01",
          },
        },
      })

      expect(result.success).toBe(false)
      expect(result.error?.format()).toEqual({
        _errors: [],
        offer: {
          _errors: [],
          publication: {
            _errors: [],
            expiration: {
              _errors: ["Expected ISO 8601 date string"],
            },
          },
        },
      })
    })

    it("should not allow date in future", () => {
      const result = zJobOfferApiWriteV3.safeParse({
        ...data,
        offer: {
          ...data.offer,
          publication: {
            ...data.offer.publication,
            expiration: inOneHour.toJSON(),
          },
        },
      })

      expect(result.success).toBe(true)
      expect(result.data?.offer.publication.expiration).toEqual(inOneHour)
    })

    it("should not allow date in past", () => {
      const result = zJobOfferApiWriteV3.safeParse({
        ...data,
        offer: {
          ...data.offer,
          publication: {
            ...data.offer.publication,
            expiration: oneHourAgo.toJSON(),
          },
        },
      })

      expect(result.success).toBe(false)
      expect(result.error?.format()).toEqual({
        _errors: [],
        offer: {
          _errors: [],
          publication: {
            _errors: [],
            expiration: {
              _errors: ["Expiration date cannot be in the past"],
            },
          },
        },
      })
    })

    it("should tolerate time clock sync", () => {
      const result = zJobOfferApiWriteV3.safeParse({
        ...data,
        offer: {
          ...data.offer,
          publication: {
            ...data.offer.publication,
            expiration: oneMinuteAgo.toJSON(),
          },
        },
      })

      expect(result.success).toBe(true)
      expect(result.data?.offer.publication.expiration).toEqual(oneMinuteAgo)
    })
  })
})

const today = new Date("2024-11-19T00:00:00.000Z")
const startOfNextMonth = new Date("2024-12-01T00:00:00.000Z")
const endOfNextMonth = new Date("2024-12-31T23:59:59.999Z")
const yesterday = new Date("2024-11-18T00:00:00.000Z")

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(today)

  return () => {
    vi.useRealTimers()
  }
})

describe("convertToJobOfferApiReadV3", () => {
  const id1 = new ObjectId()

  it("should convert job partner response from LBA to API format", () => {
    const jobPartner: IJobsPartnersOfferApi = {
      _id: id1,
      apply_phone: "0300000000",
      apply_url: "https://postler.com",
      contract_duration: 12,
      contract_remote: TRAINING_REMOTE_TYPE.onsite,
      contract_start: startOfNextMonth,
      contract_type: ["Apprentissage"],
      offer_access_conditions: ["Ce métier est accessible avec un diplôme de fin d'études secondaires"],
      offer_creation: yesterday,
      offer_description: "Exécute des travaux administratifs courants",
      offer_desired_skills: ["Faire preuve de rigueur et de précision"],
      offer_expiration: endOfNextMonth,
      offer_opening_count: 1,
      offer_rome_codes: ["M1602"],
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_target_diploma: {
        european: "4",
        label: "BP, Bac, autres formations niveau (Bac)",
      },
      offer_title: "Opérations administratives",
      offer_to_be_acquired_skills: [
        "Production, Fabrication: Procéder à l'enregistrement, au tri, à l'affranchissement du courrier",
        "Production, Fabrication: Réaliser des travaux de reprographie",
        "Organisation: Contrôler la conformité des données ou des documents",
      ],
      partner_label: "La bonne alternance",
      partner_job_id: "partner_job_id",
      workplace_address_label: "Paris",
      workplace_brand: "Brand",
      workplace_description: "Workplace Description",
      workplace_geopoint: {
        coordinates: [2.347, 48.8589],
        type: "Point",
      },
      workplace_idcc: 1242,
      workplace_legal_name: "ASSEMBLEE NATIONALE",
      workplace_naf_code: "84.11Z",
      workplace_naf_label: "Autorité constitutionnelle",
      workplace_name: "ASSEMBLEE NATIONALE",
      workplace_opco: OPCOS_LABEL.AKTO,
      workplace_siret: "11000001500013",
      workplace_size: null,
      workplace_website: null,
    }

    const expected: IJobOfferApiReadV3 = {
      identifier: {
        id: id1,
        partner_label: "La bonne alternance",
        partner_job_id: "partner_job_id",
      },
      workplace: {
        siret: "11000001500013",
        brand: "Brand",
        legal_name: "ASSEMBLEE NATIONALE",
        website: null,
        name: "ASSEMBLEE NATIONALE",
        description: "Workplace Description",
        size: null,
        location: {
          address: "Paris",
          geopoint: {
            coordinates: [2.347, 48.8589],
            type: "Point",
          },
        },
        domain: {
          idcc: 1242,
          opco: OPCOS_LABEL.AKTO,
          naf: {
            code: "84.11Z",
            label: "Autorité constitutionnelle",
          },
        },
      },
      apply: {
        url: "https://postler.com",
        phone: "0300000000",
        recipient_id: null,
      },
      contract: {
        start: startOfNextMonth,
        duration: 12,
        type: ["Apprentissage"],
        remote: TRAINING_REMOTE_TYPE.onsite,
      },
      offer: {
        title: "Opérations administratives",
        rome_codes: ["M1602"],
        description: "Exécute des travaux administratifs courants",
        target_diploma: {
          european: "4",
          label: "BP, Bac, autres formations niveau (Bac)",
        },
        desired_skills: ["Faire preuve de rigueur et de précision"],
        to_be_acquired_skills: [
          "Production, Fabrication: Procéder à l'enregistrement, au tri, à l'affranchissement du courrier",
          "Production, Fabrication: Réaliser des travaux de reprographie",
          "Organisation: Contrôler la conformité des données ou des documents",
        ],
        access_conditions: ["Ce métier est accessible avec un diplôme de fin d'études secondaires"],
        publication: {
          creation: yesterday,
          expiration: endOfNextMonth,
        },
        opening_count: 1,
        status: JOB_STATUS_ENGLISH.ACTIVE,
      },
    }

    expect(jobsRouteApiv3Converters.convertToJobOfferApiReadV3(jobPartner)).toEqual(expected)
  })
})
