import { ObjectId } from "bson"
import type { RequiredDeep } from "type-fest"
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import type { z } from "zod"

import { OPCOS_LABEL, TRAINING_REMOTE_TYPE } from "../../../constants"
import { JOB_STATUS_ENGLISH } from "../../../models"
import type { IJobsPartnersWritableApi } from "../../../models/jobsPartners.model"
import type { IJobsOpportunityResponse } from "../../jobOpportunity.routes"

import {
  jobsRouteApiv3Converters,
  type IJobOfferApiWriteV3,
  type IJobSearchApiV3,
  type zJobOfferApiReadV3,
  type zJobOfferApiWriteV3,
  type zJobRecruiterApiReadV3,
} from "./jobs.routes.v3.model"

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
  }
}

type IJobOfferExpected = {
  identifier: {
    id: ObjectId | string | null
    partner_label: string
    partner_job_id: string | null
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
  identifier?: {
    partner_job_id?: IJobOfferExpected["identifier"]["partner_job_id"]
  }
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
    expectTypeOf<IJobOfferApiWriteV3Input["identifier"]>().toEqualTypeOf<IJobOfferApiWriteV3Expected["identifier"]>()
    expectTypeOf<IJobOfferApiWriteV3Input["offer"]>().toEqualTypeOf<IJobOfferApiWriteV3Expected["offer"]>()
    expectTypeOf<IJobOfferApiWriteV3Input["offer"]["target_diploma"]>().toEqualTypeOf<IJobOfferApiWriteV3Expected["offer"]["target_diploma"]>()
    expectTypeOf<IJobOfferApiWriteV3Input["contract"]>().toEqualTypeOf<IJobOfferApiWriteV3Expected["contract"]>()
    expectTypeOf<IJobOfferApiWriteV3Input["workplace"]>().branded.toEqualTypeOf<IJobOfferApiWriteV3Expected["workplace"]>()
    expectTypeOf<IJobOfferApiWriteV3Input["apply"]>().toEqualTypeOf<IJobOfferApiWriteV3Expected["apply"]>()
    expectTypeOf<IJobOfferApiWriteV3Input>().toEqualTypeOf<IJobOfferApiWriteV3Expected>()
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

describe("convertToJobSearchApiV3", () => {
  const id1 = new ObjectId()

  it("should convert job search response from LBA to API format", () => {
    const lbaResponse: IJobsOpportunityResponse = {
      jobs: [
        {
          _id: "1",
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
          partner_job_id: null,
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
        },
      ],
      recruiters: [
        {
          _id: id1,
          apply_phone: "0100000000",
          apply_url: "http://localhost:3000/recherche-apprentissage?type=lba&itemId=11000001500013",
          workplace_address_label: "126 RUE DE L'UNIVERSITE 75007 PARIS",
          workplace_brand: "ASSEMBLEE NATIONALE - La vraie",
          workplace_description: null,
          workplace_geopoint: {
            coordinates: [2.347, 48.8589],
            type: "Point",
          },
          workplace_idcc: null,
          workplace_legal_name: "ASSEMBLEE NATIONALE",
          workplace_naf_code: "8411Z",
          workplace_naf_label: "Administration publique générale",
          workplace_name: "ASSEMBLEE NATIONALE - La vraie",
          workplace_opco: null,
          workplace_siret: "11000001500013",
          workplace_size: null,
          workplace_website: null,
        },
      ],
      warnings: [
        {
          code: "FRANCE_TRAVAIL_API_ERROR",
          message: "Unable to retrieve job offers from France Travail API",
        },
      ],
    }

    const expectedApiResponse: IJobSearchApiV3 = {
      jobs: [
        {
          identifier: {
            id: "1",
            partner_label: "La bonne alternance",
            partner_job_id: null,
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
        },
      ],
      recruiters: [
        {
          identifier: {
            id: id1,
          },
          workplace: {
            siret: "11000001500013",
            brand: "ASSEMBLEE NATIONALE - La vraie",
            legal_name: "ASSEMBLEE NATIONALE",
            website: null,
            name: "ASSEMBLEE NATIONALE - La vraie",
            description: null,
            size: null,
            location: {
              address: "126 RUE DE L'UNIVERSITE 75007 PARIS",
              geopoint: {
                coordinates: [2.347, 48.8589],
                type: "Point",
              },
            },
            domain: {
              idcc: null,
              opco: null,
              naf: {
                code: "8411Z",
                label: "Administration publique générale",
              },
            },
          },
          apply: {
            url: "http://localhost:3000/recherche-apprentissage?type=lba&itemId=11000001500013",
            phone: "0100000000",
          },
        },
      ],
      warnings: [
        {
          code: "FRANCE_TRAVAIL_API_ERROR",
          message: "Unable to retrieve job offers from France Travail API",
        },
      ],
    }

    const apiResponse = jobsRouteApiv3Converters.convertToJobSearchApiV3(lbaResponse)
    expect(apiResponse).toEqual(expectedApiResponse)
  })
})

describe("convertToJobsPartnersWritableApi", () => {
  it("should convert minimal job offer from API to LBA format", () => {
    const apiOffer: IJobOfferApiWriteV3 = {
      offer: {
        title: "Opérations administratives",
        description: "Exécute des travaux administratifs courants",
      },
      workplace: {
        siret: "11000001500013",
      },
      apply: {
        phone: "0600000000",
      },
    }

    const expectedLbaOffer: IJobsPartnersWritableApi = {
      partner_job_id: null,

      offer_title: "Opérations administratives",
      offer_rome_codes: null,
      offer_description: "Exécute des travaux administratifs courants",
      offer_target_diploma_european: null,
      offer_desired_skills: [],
      offer_to_be_acquired_skills: [],
      offer_access_conditions: [],
      offer_creation: null,
      offer_expiration: null,
      offer_opening_count: 1,
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_origin: null,
      offer_multicast: true,

      workplace_siret: "11000001500013",
      workplace_address_label: null,
      workplace_description: null,
      workplace_website: null,
      workplace_name: null,

      contract_start: null,
      contract_duration: null,
      contract_type: ["Apprentissage", "Professionnalisation"],
      contract_remote: null,

      apply_email: null,
      apply_phone: "0600000000",
      apply_url: null,
    }

    expect(jobsRouteApiv3Converters.convertToJobsPartnersWritableApi(apiOffer)).toEqual(expectedLbaOffer)
  })

  it("should convert full job offer from API to LBA format", () => {
    const apiOffer: RequiredDeep<IJobOfferApiWriteV3> = {
      identifier: {
        partner_job_id: "1",
      },
      offer: {
        title: "Opérations administratives",
        description: "Exécute des travaux administratifs courants",
        rome_codes: ["M1602"],
        desired_skills: ["Faire preuve de rigueur et de précision"],
        to_be_acquired_skills: [
          "Production, Fabrication: Procéder à l'enregistrement, au tri, à l'affranchissement du courrier",
          "Production, Fabrication: Réaliser des travaux de reprographie",
          "Organisation: Contrôler la conformité des données ou des documents",
        ],
        target_diploma: {
          european: "4",
        },
        access_conditions: ["Ce métier est accessible avec un diplôme de fin d'études secondaires"],
        publication: {
          creation: yesterday,
          expiration: endOfNextMonth,
        },
        opening_count: 1,
        multicast: true,
        origin: "La bonne alternance",
      },
      workplace: {
        siret: "11000001500013",
        name: "ASSEMBLEE NATIONALE",
        description: "Workplace Description",
        website: "https://assemblee-nationale.fr",
        location: { address: "Paris" },
      },
      apply: {
        url: "https://postler.com",
        phone: "0300000000",
        email: "mail@mail.com",
      },
      contract: {
        start: startOfNextMonth,
        duration: 12,
        type: ["Apprentissage"],
        remote: TRAINING_REMOTE_TYPE.onsite,
      },
    }

    const expectedLbaOffer: Required<IJobsPartnersWritableApi> = {
      partner_job_id: "1",
      offer_title: "Opérations administratives",
      offer_description: "Exécute des travaux administratifs courants",
      offer_rome_codes: ["M1602"],
      offer_desired_skills: ["Faire preuve de rigueur et de précision"],
      offer_to_be_acquired_skills: [
        "Production, Fabrication: Procéder à l'enregistrement, au tri, à l'affranchissement du courrier",
        "Production, Fabrication: Réaliser des travaux de reprographie",
        "Organisation: Contrôler la conformité des données ou des documents",
      ],
      offer_target_diploma_european: "4",
      offer_access_conditions: ["Ce métier est accessible avec un diplôme de fin d'études secondaires"],
      offer_creation: yesterday,
      offer_expiration: endOfNextMonth,
      offer_opening_count: 1,
      offer_multicast: true,
      offer_origin: "La bonne alternance",
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      workplace_siret: "11000001500013",
      workplace_name: "ASSEMBLEE NATIONALE",
      workplace_description: "Workplace Description",
      workplace_website: "https://assemblee-nationale.fr",
      workplace_address_label: "Paris",
      apply_url: "https://postler.com",
      apply_phone: "0300000000",
      apply_email: "mail@mail.com",
      contract_start: startOfNextMonth,
      contract_duration: 12,
      contract_type: ["Apprentissage"],
      contract_remote: TRAINING_REMOTE_TYPE.onsite,
    }

    expect(jobsRouteApiv3Converters.convertToJobsPartnersWritableApi(apiOffer)).toEqual(expectedLbaOffer)
  })

  it("should convert full job offer from API to LBA format", () => {
    const apiOffer: RequiredDeep<IJobOfferApiWriteV3> = {
      identifier: {
        partner_job_id: "1",
      },
      offer: {
        title: "Opérations administratives",
        description: "Exécute des travaux administratifs courants",
        rome_codes: ["M1602"],
        desired_skills: ["Faire preuve de rigueur et de précision"],
        to_be_acquired_skills: [
          "Production, Fabrication: Procéder à l'enregistrement, au tri, à l'affranchissement du courrier",
          "Production, Fabrication: Réaliser des travaux de reprographie",
          "Organisation: Contrôler la conformité des données ou des documents",
        ],
        target_diploma: {
          european: "4",
        },
        access_conditions: ["Ce métier est accessible avec un diplôme de fin d'études secondaires"],
        publication: {
          creation: yesterday,
          expiration: endOfNextMonth,
        },
        opening_count: 1,
        multicast: true,
        origin: "La bonne alternance",
      },
      workplace: {
        siret: "11000001500013",
        name: "ASSEMBLEE NATIONALE",
        description: "Workplace Description",
        website: "https://assemblee-nationale.fr",
        location: { address: "Paris" },
      },
      apply: {
        url: "https://postler.com",
        phone: "0300000000",
        email: "mail@mail.com",
      },
      contract: {
        start: startOfNextMonth,
        duration: 12,
        type: ["Apprentissage"],
        remote: TRAINING_REMOTE_TYPE.onsite,
      },
    }

    const expectedLbaOffer: Required<IJobsPartnersWritableApi> = {
      partner_job_id: "1",
      offer_title: "Opérations administratives",
      offer_description: "Exécute des travaux administratifs courants",
      offer_rome_codes: ["M1602"],
      offer_desired_skills: ["Faire preuve de rigueur et de précision"],
      offer_to_be_acquired_skills: [
        "Production, Fabrication: Procéder à l'enregistrement, au tri, à l'affranchissement du courrier",
        "Production, Fabrication: Réaliser des travaux de reprographie",
        "Organisation: Contrôler la conformité des données ou des documents",
      ],
      offer_target_diploma_european: "4",
      offer_access_conditions: ["Ce métier est accessible avec un diplôme de fin d'études secondaires"],
      offer_creation: yesterday,
      offer_expiration: endOfNextMonth,
      offer_opening_count: 1,
      offer_multicast: true,
      offer_origin: "La bonne alternance",
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      workplace_siret: "11000001500013",
      workplace_name: "ASSEMBLEE NATIONALE",
      workplace_description: "Workplace Description",
      workplace_website: "https://assemblee-nationale.fr",
      workplace_address_label: "Paris",
      apply_url: "https://postler.com",
      apply_phone: "0300000000",
      apply_email: "mail@mail.com",
      contract_start: startOfNextMonth,
      contract_duration: 12,
      contract_type: ["Apprentissage"],
      contract_remote: TRAINING_REMOTE_TYPE.onsite,
    }

    expect(jobsRouteApiv3Converters.convertToJobsPartnersWritableApi(apiOffer)).toEqual(expectedLbaOffer)
  })

  it("should support null target_diploma", () => {
    const apiOffer: IJobOfferApiWriteV3 = {
      offer: {
        title: "Opérations administratives",
        description: "Exécute des travaux administratifs courants",
        target_diploma: null,
      },
      workplace: {
        siret: "11000001500013",
      },
      apply: {
        phone: "0600000000",
      },
    }

    const expectedLbaOffer: IJobsPartnersWritableApi = {
      partner_job_id: null,

      offer_title: "Opérations administratives",
      offer_rome_codes: null,
      offer_description: "Exécute des travaux administratifs courants",
      offer_target_diploma_european: null,
      offer_desired_skills: [],
      offer_to_be_acquired_skills: [],
      offer_access_conditions: [],
      offer_creation: null,
      offer_expiration: null,
      offer_opening_count: 1,
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_origin: null,
      offer_multicast: true,

      workplace_siret: "11000001500013",
      workplace_address_label: null,
      workplace_description: null,
      workplace_website: null,
      workplace_name: null,

      contract_start: null,
      contract_duration: null,
      contract_type: ["Apprentissage", "Professionnalisation"],
      contract_remote: null,

      apply_email: null,
      apply_phone: "0600000000",
      apply_url: null,
    }

    expect(jobsRouteApiv3Converters.convertToJobsPartnersWritableApi(apiOffer)).toEqual(expectedLbaOffer)
  })

  it("should support null workplace_location", () => {
    const apiOffer: IJobOfferApiWriteV3 = {
      offer: {
        title: "Opérations administratives",
        description: "Exécute des travaux administratifs courants",
      },
      workplace: {
        siret: "11000001500013",
        location: null,
      },
      apply: {
        phone: "0600000000",
      },
    }

    const expectedLbaOffer: IJobsPartnersWritableApi = {
      partner_job_id: null,

      offer_title: "Opérations administratives",
      offer_rome_codes: null,
      offer_description: "Exécute des travaux administratifs courants",
      offer_target_diploma_european: null,
      offer_desired_skills: [],
      offer_to_be_acquired_skills: [],
      offer_access_conditions: [],
      offer_creation: null,
      offer_expiration: null,
      offer_opening_count: 1,
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_origin: null,
      offer_multicast: true,

      workplace_siret: "11000001500013",
      workplace_address_label: null,
      workplace_description: null,
      workplace_website: null,
      workplace_name: null,

      contract_start: null,
      contract_duration: null,
      contract_type: ["Apprentissage", "Professionnalisation"],
      contract_remote: null,

      apply_email: null,
      apply_phone: "0600000000",
      apply_url: null,
    }

    expect(jobsRouteApiv3Converters.convertToJobsPartnersWritableApi(apiOffer)).toEqual(expectedLbaOffer)
  })
})
