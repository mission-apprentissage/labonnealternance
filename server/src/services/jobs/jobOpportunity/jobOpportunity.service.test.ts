import { badRequest, internal } from "@hapi/boom"
import { IApiAlternanceTokenData } from "api-alternance-sdk"
import omit from "lodash-es/omit"
import { ObjectId } from "mongodb"
import nock from "nock"
import { NIVEAUX_POUR_LBA, NIVEAUX_POUR_OFFRES_PE, OPCOS_LABEL, RECRUITER_STATUS, TRAINING_CONTRACT_TYPE } from "shared/constants/index"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { generateCfaFixture } from "shared/fixtures/cfa.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { generateRecruiterFixture } from "shared/fixtures/recruiter.fixture"
import { clichyFixture, generateReferentielCommuneFixtures, levalloisFixture, marseilleFixture, parisFixture } from "shared/fixtures/referentiel/commune.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/userWithAccount.fixture"
import { IRecruiter, IReferentielRome, JOB_STATUS, JOB_STATUS_ENGLISH } from "shared/models/index"
import { IJobsPartnersOfferPrivate, INiveauDiplomeEuropeen, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import {
  jobsRouteApiv3Converters,
  zJobOfferApiReadV3,
  zJobOfferApiWriteV3,
  zJobSearchApiV3Response,
  type IJobOfferApiWriteV3,
  type IJobOfferApiWriteV3Input,
} from "shared/routes/v3/jobs/jobs.routes.v3.model"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { apiEntrepriseEtablissementFixture } from "@/common/apis/apiEntreprise/apiEntreprise.client.fixture"
import { searchForFtJobs } from "@/common/apis/franceTravail/franceTravail.client"
import { generateFtJobFixture } from "@/common/apis/franceTravail/franceTravail.client.fixture"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { certificationFixtures } from "@/services/external/api-alternance/certification.fixture"
import { useMongo } from "@tests/utils/mongo.test.utils"

import config from "../../../config"
import { FTJob } from "../../ftjob.service.types"

import {
  createJobOffer,
  findJobOpportunityById,
  findJobsOpportunities,
  getJobsPartnersByIdAsJobOfferApi,
  getLbaJobByIdV2AsJobOfferApi,
  updateJobOffer,
} from "./jobOpportunity.service"
import { JobOpportunityRequestContext } from "./JobOpportunityRequestContext"

useMongo()

vi.mock("@/common/apis/franceTravail/franceTravail.client")
vi.mock("@/common/apis/apiEntreprise/apiEntreprise.client")

beforeAll(async () => {
  nock.disableNetConnect()

  return () => {
    nock.enableNetConnect()
  }
})

afterEach(() => {
  nock.cleanAll()
})

describe("findJobsOpportunities", () => {
  const recruiters: IJobsPartnersOfferPrivate[] = [
    generateJobsPartnersOfferPrivate({
      partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      workplace_siret: "11000001500013",
      workplace_legal_name: "ASSEMBLEE NATIONALE",
      workplace_brand: "ASSEMBLEE NATIONALE - La vraie",
      offer_rome_codes: ["M1602"],
      workplace_geopoint: parisFixture.centre,
      workplace_address_zipcode: parisFixture.code,
      workplace_address_city: parisFixture.nom,
      apply_phone: "0100000000",
    }),
    generateJobsPartnersOfferPrivate({
      partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      workplace_siret: "77555848900073",
      workplace_legal_name: "GRAND PORT MARITIME DE MARSEILLE (GPMM)",
      offer_rome_codes: ["M1602", "D1212"],
      workplace_geopoint: marseilleFixture.centre,
      workplace_address_zipcode: marseilleFixture.code,
      workplace_address_city: marseilleFixture.nom,
      apply_phone: "0200000000",
    }),
    generateJobsPartnersOfferPrivate({
      partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      workplace_siret: "52951974600034",
      workplace_legal_name: "SOCIETE PARISIENNE DE LA PISCINE PONTOISE (S3P)",
      workplace_brand: "SOCIETE PARISIENNE DE LA PISCINE PONTOISE (S3P)",
      offer_rome_codes: ["D1211"],
      workplace_geopoint: levalloisFixture.centre,
      workplace_address_zipcode: levalloisFixture.code,
      workplace_address_city: levalloisFixture.nom,
      apply_phone: "0100000001",
    }),
  ]

  const lbaJobs: IRecruiter[] = [
    generateRecruiterFixture({
      establishment_siret: "11000001500013",
      establishment_raison_sociale: "ASSEMBLEE NATIONALE",
      geopoint: parisFixture.centre,
      status: RECRUITER_STATUS.ACTIF,
      jobs: [
        {
          _id: new ObjectId("67520beff00dd7b9073d5fdc"),
          rome_code: ["M1602"],
          rome_label: "Opérations administratives",
          job_status: JOB_STATUS.ACTIVE,
          job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
          job_creation_date: new Date("2021-01-01"),
          job_expiration_date: new Date("2050-01-01"),
        },
      ],
      address_detail: {
        code_insee_localite: parisFixture.code,
      },
      address: parisFixture.nom,
      phone: "0300000000",
    }),
    generateRecruiterFixture({
      establishment_siret: "11000001500013",
      establishment_raison_sociale: "ASSEMBLEE NATIONALE",
      geopoint: marseilleFixture.centre,
      status: RECRUITER_STATUS.ACTIF,
      jobs: [
        {
          _id: new ObjectId("67520be51ca7e7ed499d2934"),
          rome_code: ["M1602", "D1212"],
          rome_label: "Opérations administratives",
          job_status: JOB_STATUS.ACTIVE,
          job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
          job_creation_date: new Date("2022-01-01"),
          job_expiration_date: new Date("2050-01-01"),
        },
      ],
      address_detail: {
        code_insee_localite: marseilleFixture.code,
      },
      address: marseilleFixture.nom,
      phone: "0465000000",
    }),
    generateRecruiterFixture({
      establishment_siret: "20003277900015",
      establishment_raison_sociale: "PARIS MUSEES",
      geopoint: levalloisFixture.centre,
      status: RECRUITER_STATUS.ACTIF,
      jobs: [
        {
          _id: new ObjectId("67520bdce348cd81a1f45197"),
          rome_code: ["D1209"],
          rome_label: "Opérations administratives",
          job_status: JOB_STATUS.ACTIVE,
          job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
          job_creation_date: new Date("2023-01-01"),
          job_expiration_date: new Date("2050-01-01"),
        },
      ],
      address_detail: {
        code_insee_localite: levalloisFixture.code,
      },
      address: levalloisFixture.nom,
      phone: "0465000001",
    }),
  ]
  const partnerJobs: IJobsPartnersOfferPrivate[] = [
    generateJobsPartnersOfferPrivate({
      _id: new ObjectId("675209e704377be3d437bbb9"),
      offer_rome_codes: ["M1602"],
      workplace_geopoint: parisFixture.centre,
      offer_creation: new Date("2021-01-01"),
      partner_job_id: "job-id-1",
    }),
    generateJobsPartnersOfferPrivate({
      _id: new ObjectId("67520b753761274f55ee1dbb"),
      offer_rome_codes: ["M1602", "D1214"],
      workplace_geopoint: marseilleFixture.centre,
      offer_creation: new Date("2022-01-01"),
      partner_job_id: "job-id-2",
    }),
    generateJobsPartnersOfferPrivate({
      _id: new ObjectId("67520b8db04d1ef4ff79e1e5"),
      offer_rome_codes: ["D1212"],
      workplace_geopoint: levalloisFixture.centre,
      offer_creation: new Date("2023-01-01"),
      partner_job_id: "job-id-3",
    }),
  ]
  const ftJobs: FTJob[] = [
    generateFtJobFixture({
      id: "1",
      romeCode: "M1602",
      lieuTravail: {
        libelle: "Paris",
        latitude: parisFixture.centre.coordinates[1].toString(),
        longitude: parisFixture.centre.coordinates[0].toString(),
        codePostal: parisFixture.codesPostaux[0],
        commune: parisFixture.code,
      },
    }),
  ]
  const romes: IReferentielRome[] = [
    generateReferentielRome({
      rome: {
        code_rome: "M1602",
        intitule: "Opérations administratives",
        code_ogr: "475",
      },
    }),
    ...certificationFixtures["RNCP37098-46T31203"].domaines.rome.rncp.map(({ code, intitule }) => generateReferentielRome({ rome: { code_rome: code, intitule, code_ogr: "" } })),
  ]

  beforeEach(async () => {
    await getDbCollection("jobs_partners").insertMany(recruiters)
    await getDbCollection("recruiters").insertMany(lbaJobs)
    await getDbCollection("jobs_partners").insertMany(partnerJobs)
    await getDbCollection("referentielromes").insertMany(romes)
    await getDbCollection("referentiel.communes").insertMany(generateReferentielCommuneFixtures([parisFixture, clichyFixture, levalloisFixture, marseilleFixture]))
  })

  it("should execute query", async () => {
    vi.mocked(searchForFtJobs).mockResolvedValue({ data: { resultats: ftJobs }, contentRange: "" })

    const results = await findJobsOpportunities(
      {
        longitude: parisFixture.centre.coordinates[0],
        latitude: parisFixture.centre.coordinates[1],
        radius: 30,
        romes: ["M1602"],
        rncp: null,
        opco: null,
      },
      new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
    )

    expect(results).toEqual({
      jobs: [
        expect.objectContaining({
          identifier: { id: lbaJobs[0].jobs[0]._id, partner_job_id: lbaJobs[0].jobs[0]._id.toString(), partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA },
          workplace: expect.objectContaining({
            location: expect.objectContaining({
              geopoint: lbaJobs[0].geopoint,
            }),
          }),
        }),
        expect.objectContaining({
          identifier: { id: null, partner_job_id: ftJobs[0].id, partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL },
        }),
        expect.objectContaining({
          identifier: { id: partnerJobs[0]._id, partner_job_id: partnerJobs[0].partner_job_id, partner_label: partnerJobs[0].partner_label },
          workplace: expect.objectContaining({
            location: expect.objectContaining({
              geopoint: partnerJobs[0].workplace_geopoint,
            }),
          }),
        }),
      ],
      recruiters: [
        expect.objectContaining({
          identifier: { id: recruiters[0]._id },
          workplace: expect.objectContaining({
            location: expect.objectContaining({ geopoint: recruiters[0].workplace_geopoint }),
            name: recruiters[0].workplace_legal_name,
          }),
        }),
      ],
      warnings: [],
    })

    expect(searchForFtJobs).toHaveBeenCalledTimes(1)
    expect(searchForFtJobs).toHaveBeenNthCalledWith(
      1,
      {
        codeROME: "M1602",
        commune: "75101", // Special case for paris
        sort: 2,
        natureContrat: "E2,FS",
        range: "0-149",
        distance: 30,
      },
      { throwOnError: true }
    )

    expect(
      results.jobs.map((j) => {
        j.identifier.id = ""
        j.identifier.partner_job_id = ""
        j.apply.url = ""

        return j
      })
    ).toMatchSnapshot()
    expect(
      results.recruiters.map((r) => {
        r.identifier.id = new ObjectId("000000000000000000000000")
        return r
      })
    ).toMatchSnapshot()
  })

  it("should support query without rncp or rome filter", async () => {
    vi.mocked(searchForFtJobs).mockResolvedValue({ data: { resultats: ftJobs }, contentRange: "" })

    const results = await findJobsOpportunities(
      {
        longitude: parisFixture.centre.coordinates[0],
        latitude: parisFixture.centre.coordinates[1],
        radius: 30,
        romes: null,
        rncp: null,
        opco: null,
      },
      new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
    )

    const parseResult = zJobSearchApiV3Response.safeParse(results)
    expect.soft(parseResult.success).toBeTruthy()
    expect(parseResult.error).toBeUndefined()
    expect(results).toEqual({
      jobs: [
        expect.objectContaining({
          identifier: { id: lbaJobs[0].jobs[0]._id, partner_job_id: lbaJobs[0].jobs[0]._id.toString(), partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA },
          workplace: expect.objectContaining({
            location: expect.objectContaining({
              geopoint: lbaJobs[0].geopoint,
            }),
          }),
        }),
        expect.objectContaining({
          identifier: { id: lbaJobs[2].jobs[0]._id, partner_job_id: lbaJobs[2].jobs[0]._id.toString(), partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA },
          workplace: expect.objectContaining({
            location: expect.objectContaining({
              geopoint: lbaJobs[2].geopoint,
            }),
          }),
        }),
        expect.objectContaining({
          identifier: { id: null, partner_job_id: ftJobs[0].id, partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL },
        }),
        expect.objectContaining({
          identifier: { id: partnerJobs[0]._id, partner_job_id: partnerJobs[0].partner_job_id, partner_label: partnerJobs[0].partner_label },
          workplace: expect.objectContaining({
            location: expect.objectContaining({
              geopoint: partnerJobs[0].workplace_geopoint,
            }),
          }),
        }),
        expect.objectContaining({
          identifier: { id: partnerJobs[2]._id, partner_job_id: partnerJobs[2].partner_job_id, partner_label: partnerJobs[2].partner_label },
          workplace: expect.objectContaining({
            location: expect.objectContaining({
              geopoint: partnerJobs[2].workplace_geopoint,
            }),
          }),
        }),
      ],
      recruiters: [
        expect.objectContaining({
          identifier: { id: recruiters[0]._id },
          workplace: expect.objectContaining({
            location: expect.objectContaining({ geopoint: recruiters[0].workplace_geopoint }),
            name: recruiters[0].workplace_legal_name,
          }),
        }),
        expect.objectContaining({
          identifier: { id: recruiters[2]._id },
          workplace: expect.objectContaining({
            location: expect.objectContaining({ geopoint: recruiters[2].workplace_geopoint }),
            name: recruiters[2].workplace_legal_name,
          }),
        }),
      ],
      warnings: [],
    })

    expect(searchForFtJobs).toHaveBeenCalledTimes(1)
    expect(searchForFtJobs).toHaveBeenNthCalledWith(
      1,
      {
        commune: "75101", // Special case for paris
        sort: 2,
        natureContrat: "E2,FS",
        range: "0-149",
        distance: 30,
      },
      { throwOnError: true }
    )
  })

  it("should support query without geo filter", async () => {
    vi.mocked(searchForFtJobs).mockResolvedValue({ data: { resultats: ftJobs }, contentRange: "" })

    const results = await findJobsOpportunities(
      {
        longitude: null,
        latitude: null,
        radius: 30,
        romes: ["M1602"],
        rncp: null,
        opco: null,
      },
      new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
    )
    const parseResult = zJobSearchApiV3Response.safeParse(results)
    expect.soft(parseResult.success).toBeTruthy()
    expect(parseResult.error).toBeUndefined()

    // Order is most recent first
    expect(results).toEqual({
      jobs: [
        expect.objectContaining({
          identifier: { id: lbaJobs[1].jobs[0]._id, partner_job_id: lbaJobs[1].jobs[0]._id.toString(), partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA },
        }),
        expect.objectContaining({
          identifier: { id: lbaJobs[0].jobs[0]._id, partner_job_id: lbaJobs[0].jobs[0]._id.toString(), partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA },
        }),
        expect.objectContaining({
          identifier: { id: null, partner_job_id: ftJobs[0].id, partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL },
        }),
        expect.objectContaining({
          identifier: { id: partnerJobs[1]._id, partner_job_id: partnerJobs[1].partner_job_id, partner_label: partnerJobs[1].partner_label },
        }),
        expect.objectContaining({
          identifier: { id: partnerJobs[0]._id, partner_job_id: partnerJobs[0].partner_job_id, partner_label: partnerJobs[0].partner_label },
        }),
      ],
      recruiters: [
        expect.objectContaining({
          identifier: { id: recruiters[0]._id },
          workplace: expect.objectContaining({
            name: recruiters[0].workplace_legal_name,
          }),
        }),
        expect.objectContaining({
          identifier: { id: recruiters[1]._id },
          workplace: expect.objectContaining({
            name: recruiters[1].workplace_legal_name,
          }),
        }),
      ],
      warnings: [],
    })
    expect(searchForFtJobs).toHaveBeenCalledTimes(1)
    expect(searchForFtJobs).toHaveBeenNthCalledWith(
      1,
      {
        sort: 2,
        natureContrat: "E2,FS",
        range: "0-149",
        codeROME: "M1602",
      },
      { throwOnError: true }
    )
  })

  describe("searching by rncp code", async () => {
    it("should return jobs corresponding to the romes codes associated with the requested rncp code", async () => {
      vi.mocked(searchForFtJobs).mockResolvedValue({ data: { resultats: [] }, contentRange: "" })

      const scopeApiAlternance = nock("https://api.apprentissage.beta.gouv.fr:443")
        .get("/api/certification/v1")
        .query({ "identifiant.rncp": certificationFixtures["RNCP37098-46T31203"].identifiant.rncp })
        .matchHeader("Authorization", "Bearer api-apprentissage-api-key")
        .reply(200, [certificationFixtures["RNCP37098-46T31203"]])

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          rncp: "RNCP37098",
          romes: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )
      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()

      expect(results).toEqual({
        jobs: [
          expect.objectContaining({
            identifier: { id: lbaJobs[2].jobs[0]._id, partner_job_id: lbaJobs[2].jobs[0]._id.toString(), partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA },
            workplace: expect.objectContaining({
              location: expect.objectContaining({
                geopoint: lbaJobs[2].geopoint,
              }),
            }),
          }),
          expect.objectContaining({
            identifier: { id: partnerJobs[2]._id, partner_job_id: partnerJobs[2].partner_job_id, partner_label: partnerJobs[2].partner_label },
            workplace: expect.objectContaining({
              location: expect.objectContaining({
                geopoint: partnerJobs[2].workplace_geopoint,
              }),
            }),
          }),
        ],
        recruiters: [
          expect.objectContaining({
            identifier: { id: recruiters[2]._id },
            workplace: expect.objectContaining({
              name: recruiters[2].workplace_legal_name,
              location: expect.objectContaining({
                geopoint: recruiters[2].workplace_geopoint,
              }),
            }),
          }),
        ],
        warnings: [],
      })
      expect(scopeApiAlternance.isDone()).toBeTruthy()
      expect(searchForFtJobs).toHaveBeenCalledTimes(1)
      expect(searchForFtJobs).toHaveBeenNthCalledWith(
        1,
        {
          // Code ROME correspondant au code RNCP
          codeROME: "D1210,D1212,D1209,D1214,D1211",
          commune: "75101", // Special case for paris
          sort: 2,
          natureContrat: "E2,FS",
          range: "0-149",
          distance: 30,
        },
        { throwOnError: true }
      )
    })

    // TODO: Fix this test
    it.skip("should error internal when API Alternance request fail", async () => {
      await expect(
        findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            rncp: "RNCP37098",
            romes: null,
            opco: null,
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )
      ).rejects.toThrowError(internal("Erreur lors de la récupération des informations de certification", { responseData: undefined, rncp: "RNCP37098" }))
    })

    it("should throw bad request when rncp code is not found", async () => {
      const scopeApiAlternance = nock("https://api.apprentissage.beta.gouv.fr:443")
        .get("/api/certification/v1")
        .query({ "identifiant.rncp": "RNCP30000" })
        .matchHeader("Authorization", "Bearer api-apprentissage-api-key")
        .reply(200, [])

      await expect(
        findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            rncp: "RNCP30000",
            romes: null,
            opco: null,
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )
      ).rejects.toThrowError(badRequest("Cannot find an active Certification for the given RNCP", { rncp: "RNCP30000" }))

      expect(scopeApiAlternance.isDone()).toBeTruthy()
    })

    it("should throw bad request when rncp is not active and no active replacement", async () => {
      const scopeApiAlternance = nock("https://api.apprentissage.beta.gouv.fr:443")
        .get("/api/certification/v1")
        .query({ "identifiant.rncp": "RNCP9852" })
        .matchHeader("Authorization", "Bearer api-apprentissage-api-key")
        .reply(200, [certificationFixtures["RNCP9852-26X32304"]])

      await expect(
        findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            rncp: "RNCP9852",
            romes: null,
            opco: null,
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )
      ).rejects.toThrowError(badRequest("Cannot find an active Certification for the given RNCP", { rncp: "RNCP9852" }))

      expect(scopeApiAlternance.isDone()).toBeTruthy()
    })

    it("should resolve RNCP continuity", async () => {
      vi.mocked(searchForFtJobs).mockResolvedValue({ data: { resultats: [] }, contentRange: "" })

      const scopeApiAlternance = nock("https://api.apprentissage.beta.gouv.fr:443")
        .get("/api/certification/v1")
        .query({ "identifiant.rncp": "RNCP37098" })
        .matchHeader("Authorization", "Bearer api-apprentissage-api-key")
        .reply(200, [certificationFixtures["RNCP37098-46T31203"]])

      scopeApiAlternance
        .get("/api/certification/v1")
        .query({ "identifiant.rncp": "RNCP13620" })
        .matchHeader("Authorization", "Bearer api-apprentissage-api-key")
        .reply(200, [certificationFixtures["RNCP13620-46T31203"]])

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          rncp: "RNCP13620",
          romes: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect(results).toEqual({
        jobs: [
          expect.objectContaining({
            identifier: { id: lbaJobs[2].jobs[0]._id, partner_job_id: lbaJobs[2].jobs[0]._id.toString(), partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA },
            workplace: expect.objectContaining({
              location: expect.objectContaining({
                geopoint: lbaJobs[2].geopoint,
              }),
            }),
          }),
          expect.objectContaining({
            identifier: { id: partnerJobs[2]._id, partner_job_id: partnerJobs[2].partner_job_id, partner_label: partnerJobs[2].partner_label },
            workplace: expect.objectContaining({
              location: expect.objectContaining({
                geopoint: partnerJobs[2].workplace_geopoint,
              }),
            }),
          }),
        ],
        recruiters: [
          expect.objectContaining({
            identifier: { id: recruiters[2]._id },
            workplace: expect.objectContaining({
              name: recruiters[2].workplace_legal_name,
              location: expect.objectContaining({
                geopoint: recruiters[2].workplace_geopoint,
              }),
            }),
          }),
        ],
        warnings: [],
      })
      expect(searchForFtJobs).toHaveBeenCalledTimes(1)
      expect(searchForFtJobs).toHaveBeenCalledWith(
        {
          // Code ROME correspondant au code RNCP
          codeROME: "D1210,D1212,D1209,D1214,D1211",
          commune: "75101", // Special case for paris
          sort: 2,
          natureContrat: "E2,FS",
          range: "0-149",
          distance: 30,
        },
        { throwOnError: true }
      )
      expect(scopeApiAlternance.isDone()).toBeTruthy()
    })
  })

  it("should RNCP & ROME filter appliy as OR condition", async () => {
    vi.mocked(searchForFtJobs).mockResolvedValue({ data: { resultats: ftJobs }, contentRange: "" })

    const scopeApiAlternance = nock("https://api.apprentissage.beta.gouv.fr:443")
      .get("/api/certification/v1")
      .query({ "identifiant.rncp": certificationFixtures["RNCP37098-46T31203"].identifiant.rncp })
      .matchHeader("Authorization", "Bearer api-apprentissage-api-key")
      .reply(200, [certificationFixtures["RNCP37098-46T31203"]])

    const results = await findJobsOpportunities(
      {
        longitude: parisFixture.centre.coordinates[0],
        latitude: parisFixture.centre.coordinates[1],
        radius: 30,
        romes: ["M1602"],
        rncp: "RNCP37098",
        opco: null,
      },
      new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
    )

    const parseResult = zJobSearchApiV3Response.safeParse(results)
    expect.soft(parseResult.success).toBeTruthy()
    expect(parseResult.error).toBeUndefined()
    expect(results).toEqual({
      jobs: [
        expect.objectContaining({
          identifier: { id: lbaJobs[0].jobs[0]._id, partner_job_id: lbaJobs[0].jobs[0]._id.toString(), partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA },
          workplace: expect.objectContaining({
            location: expect.objectContaining({
              geopoint: lbaJobs[0].geopoint,
            }),
          }),
        }),
        expect.objectContaining({
          identifier: { id: lbaJobs[2].jobs[0]._id, partner_job_id: lbaJobs[2].jobs[0]._id.toString(), partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA },
          workplace: expect.objectContaining({
            location: expect.objectContaining({
              geopoint: lbaJobs[2].geopoint,
            }),
          }),
        }),
        expect.objectContaining({
          identifier: { id: null, partner_job_id: ftJobs[0].id, partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL },
        }),
        expect.objectContaining({
          identifier: { id: partnerJobs[0]._id, partner_job_id: partnerJobs[0].partner_job_id, partner_label: partnerJobs[0].partner_label },
          workplace: expect.objectContaining({
            location: expect.objectContaining({
              geopoint: partnerJobs[0].workplace_geopoint,
            }),
          }),
        }),
        expect.objectContaining({
          identifier: { id: partnerJobs[2]._id, partner_job_id: partnerJobs[2].partner_job_id, partner_label: partnerJobs[2].partner_label },
          workplace: expect.objectContaining({
            location: expect.objectContaining({
              geopoint: partnerJobs[2].workplace_geopoint,
            }),
          }),
        }),
      ],
      recruiters: [
        expect.objectContaining({
          identifier: { id: recruiters[0]._id },
          workplace: expect.objectContaining({
            location: expect.objectContaining({ geopoint: recruiters[0].workplace_geopoint }),
            name: recruiters[0].workplace_legal_name,
          }),
        }),
        expect.objectContaining({
          identifier: { id: recruiters[2]._id },
          workplace: expect.objectContaining({
            location: expect.objectContaining({ geopoint: recruiters[2].workplace_geopoint }),
            name: recruiters[2].workplace_legal_name,
          }),
        }),
      ],
      warnings: [],
    })

    expect(searchForFtJobs).toHaveBeenCalledTimes(1)
    expect(searchForFtJobs).toHaveBeenCalledWith(
      {
        codeROME: "M1602,D1210,D1212,D1209,D1214,D1211",
        commune: "75101", // Special case for paris
        sort: 2,
        natureContrat: "E2,FS",
        range: "0-149",
        distance: 30,
      },
      { throwOnError: true }
    )
    expect(scopeApiAlternance.isDone()).toBeTruthy()
  })

  describe("lba company", () => {
    beforeEach(async () => {
      nock("https://api.francetravail.io")
        .get("/partenaire/offresdemploi/v2/offres/search")
        .query(() => true)
        .reply(200, { resultats: [] })
    })

    it("should limit companies to 150", async () => {
      const extraLbaCompanies: IJobsPartnersOfferPrivate[] = Array.from({ length: 200 }, () =>
        generateJobsPartnersOfferPrivate({
          partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
          workplace_geopoint: parisFixture.centre,
          offer_rome_codes: ["M1602"],
        })
      )
      await getDbCollection("jobs_partners").insertMany(extraLbaCompanies)

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect(results.recruiters).toHaveLength(150)
    })

    it("should exclude companies not within the radius", async () => {
      const results1 = await findJobsOpportunities(
        {
          longitude: clichyFixture.centre.coordinates[0],
          latitude: clichyFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      expect(results1.recruiters).toHaveLength(1)

      const results2 = await findJobsOpportunities(
        {
          longitude: clichyFixture.centre.coordinates[0],
          latitude: clichyFixture.centre.coordinates[1],
          radius: 2,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      expect(results2.recruiters).toHaveLength(0)
    })
  })

  describe("labonnealternance jobs", () => {
    beforeEach(async () => {
      vi.mocked(searchForFtJobs).mockResolvedValue({ data: { resultats: [] }, contentRange: "" })

      await getDbCollection("jobs_partners").deleteMany({})
    })

    it("should exclude non active recruiters", async () => {
      const extraRecruiters: IRecruiter[] = []

      for (const status of [RECRUITER_STATUS.ARCHIVE, RECRUITER_STATUS.EN_ATTENTE_VALIDATION]) {
        extraRecruiters.push(
          generateRecruiterFixture({
            establishment_siret: "11000001500013",
            establishment_raison_sociale: "ASSEMBLEE NATIONALE",
            geopoint: parisFixture.centre,
            status,
            jobs: [
              {
                rome_code: ["M1602"],
                rome_label: "Opérations Administratives",
                job_status: JOB_STATUS.ACTIVE,
                job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
                job_expiration_date: new Date(),
              },
            ],
            address_detail: {
              code_insee_localite: parisFixture.code,
            },
            address: parisFixture.nom,
          })
        )
      }

      await getDbCollection("recruiters").insertMany(extraRecruiters)

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect(results.jobs).toHaveLength(1)
    })

    it("should exclude non active jobs", async () => {
      await getDbCollection("recruiters").insertOne(
        generateRecruiterFixture({
          establishment_siret: "11000001500013",
          establishment_raison_sociale: "ASSEMBLEE NATIONALE",
          geopoint: parisFixture.centre,
          status: RECRUITER_STATUS.ACTIF,
          jobs: [
            {
              rome_code: ["M1602"],
              rome_label: "Opérations administratives",
              job_status: JOB_STATUS.ANNULEE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
              job_expiration_date: new Date(),
            },
            {
              rome_code: ["M1602"],
              rome_label: "Opérations administratives",
              job_status: JOB_STATUS.EN_ATTENTE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
              job_expiration_date: new Date(),
            },
            {
              rome_code: ["M1602"],
              rome_label: "Opérations administratives",
              job_status: JOB_STATUS.POURVUE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
              job_expiration_date: new Date(),
            },
            {
              rome_code: ["M1602"],
              rome_label: "Opérations administratives",
              job_status: JOB_STATUS.ACTIVE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
              job_expiration_date: new Date(),
            },
            {
              rome_code: ["M1602"],
              rome_label: "Opérations administratives",
              job_status: JOB_STATUS.ACTIVE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
              job_expiration_date: new Date("2024-01-01"),
            },
          ],
          address_detail: {
            code_insee_localite: parisFixture.code,
          },
          address: parisFixture.nom,
        })
      )

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect(results.jobs).toHaveLength(2)
    })

    describe("when filtered by diploma", () => {
      it("should return jobs with requested diploma and unknown ones only", async () => {
        await getDbCollection("recruiters").insertOne(
          generateRecruiterFixture({
            establishment_siret: "11000001500013",
            geopoint: parisFixture.centre,
            status: RECRUITER_STATUS.ACTIF,
            jobs: [
              {
                rome_code: ["M1602"],
                rome_label: "Opérations administratives",
                job_status: JOB_STATUS.ACTIVE,
                job_level_label: NIVEAUX_POUR_LBA["3 (CAP...)"],
                job_expiration_date: new Date(),
              },
              {
                rome_code: ["M1602"],
                rome_label: "Opérations administratives",
                job_status: JOB_STATUS.ACTIVE,
                job_level_label: NIVEAUX_POUR_LBA["4 (BAC...)"],
                job_expiration_date: new Date(),
              },
            ],
            address_detail: {
              code_insee_localite: parisFixture.code,
            },
            address: parisFixture.nom,
          })
        )

        const results = await findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
            target_diploma_level: "4",
            rncp: null,
            opco: null,
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )

        const parseResult = zJobSearchApiV3Response.safeParse(results)
        expect.soft(parseResult.success).toBeTruthy()
        expect(parseResult.error).toBeUndefined()
        expect.soft(results.jobs).toHaveLength(2)
        expect.soft(results.jobs.map((j) => j.offer.target_diploma)).toEqual(
          expect.arrayContaining([
            null,
            {
              european: "4",
              label: "BP, Bac, autres formations niveau (Bac)",
            },
          ])
        )
      })
    })

    it("should limit the number of jobs to 150", async () => {
      const JOB_PER_RECRUITER = 10

      const extraRecruiters: IRecruiter[] = Array.from({ length: 500 }, () => {
        const jobs = Array.from({ length: JOB_PER_RECRUITER }, () => ({
          rome_code: ["M1602"],
          rome_label: "Opérations Administratives",
          job_status: JOB_STATUS.ACTIVE,
          job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
          job_expiration_date: new Date(),
        }))

        return generateRecruiterFixture({
          establishment_siret: "11000001500013",
          geopoint: parisFixture.centre,
          status: RECRUITER_STATUS.ACTIF,
          jobs,
          address_detail: {
            code_insee_localite: parisFixture.code,
          },
          address: parisFixture.nom,
        })
      })

      await getDbCollection("recruiters").deleteMany({})
      await getDbCollection("recruiters").insertMany(extraRecruiters)

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect(results.jobs).toHaveLength(150)
    })

    // A vérifier si le cas existe
    it("should exclude jobs with rome codes without a corresponding referentiel rome", async () => {
      await getDbCollection("recruiters").insertOne(
        generateRecruiterFixture({
          establishment_siret: "11000001500013",
          geopoint: parisFixture.centre,
          status: RECRUITER_STATUS.ACTIF,
          jobs: [
            {
              rome_code: ["C1110"],
              rome_label: "Souscription d'assurances",
              job_status: JOB_STATUS.ACTIVE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
              job_expiration_date: new Date(),
            },
          ],
          address_detail: {
            code_insee_localite: parisFixture.code,
          },
          address: parisFixture.nom,
        })
      )

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["C1110"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect(results.jobs).toHaveLength(0)
    })

    it("should exclude companies not within the radius", async () => {
      const results = await findJobsOpportunities(
        {
          longitude: clichyFixture.centre.coordinates[0],
          latitude: clichyFixture.centre.coordinates[1],
          radius: 1,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect(results.jobs).toHaveLength(0)
    })

    it("should ignore job custom_geo_coordinates", async () => {
      await getDbCollection("recruiters").insertOne(
        generateRecruiterFixture({
          establishment_siret: "11000001500013",
          geopoint: parisFixture.centre,
          status: RECRUITER_STATUS.ACTIF,
          jobs: [
            {
              rome_code: ["M1602"],
              rome_label: "Opérations Administratives",
              job_status: JOB_STATUS.ACTIVE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
              custom_geo_coordinates: `${marseilleFixture.centre.coordinates[1]},${marseilleFixture.centre.coordinates[0]}`,
              job_expiration_date: new Date(),
            },
          ],
          address_detail: {
            code_insee_localite: parisFixture.code,
          },
          address: parisFixture.nom,
        })
      )

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect(results.jobs).toHaveLength(2)
    })

    describe("when recruiter is delegated", () => {
      it("should return info from the cfa_delegated_siret", async () => {
        const cfa = generateCfaFixture({
          siret: "78430824900019",
          address: parisFixture.nom,
        })
        await getDbCollection("cfas").insertOne(cfa)

        const userWithAccount = generateUserWithAccountFixture({
          phone: "0102030405",
        })

        await getDbCollection("userswithaccounts").insertOne(userWithAccount)

        const delegatedLbaJob = generateRecruiterFixture({
          establishment_siret: "21750001600019",
          establishment_enseigne: "MAIRIE DE PARIS",
          geopoint: parisFixture.centre,
          status: RECRUITER_STATUS.ACTIF,
          jobs: [
            {
              rome_code: ["M1602"],
              rome_label: "Opérations administratives",
              job_status: JOB_STATUS.ACTIVE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
              job_expiration_date: new Date(),
            },
            {
              rome_code: ["M1602"],
              rome_label: "Opérations administratives",
              job_status: JOB_STATUS.ACTIVE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
              job_expiration_date: new Date(),
            },
          ],
          address_detail: {
            code_insee_localite: parisFixture.code,
          },
          address: parisFixture.nom,
          is_delegated: true,
          cfa_delegated_siret: cfa.siret,
          managed_by: userWithAccount._id.toString(),
        })

        await getDbCollection("recruiters").insertOne(delegatedLbaJob)

        const results = await findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
            rncp: null,
            opco: null,
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )

        const parseResult = zJobSearchApiV3Response.safeParse(results)
        expect.soft(parseResult.success).toBeTruthy()
        expect(parseResult.error).toBeUndefined()
        expect(results.jobs).toHaveLength(3)
        expect(
          results.jobs.map((j) => ({
            _id: j.identifier.id,
            workspace_siret: j.workplace.siret,
            workplace_geopoint: j.workplace.location.geopoint,
            apply_phone: j.apply.phone,
          }))
        ).toEqual(
          expect.arrayContaining([
            {
              _id: lbaJobs[0].jobs[0]._id,
              workplace_geopoint: lbaJobs[0].geopoint,
              workspace_siret: lbaJobs[0].establishment_siret,
              apply_phone: lbaJobs[0].phone,
            },
            {
              _id: delegatedLbaJob.jobs[0]._id,
              workplace_geopoint: delegatedLbaJob.geopoint,
              workspace_siret: cfa.siret,
              apply_phone: userWithAccount.phone,
            },
            {
              _id: delegatedLbaJob.jobs[1]._id,
              workplace_geopoint: delegatedLbaJob.geopoint,
              workspace_siret: cfa.siret,
              apply_phone: userWithAccount.phone,
            },
          ])
        )
      })
    })

    it("should ignore recruiters without adresse", async () => {
      await getDbCollection("recruiters").insertOne(
        generateRecruiterFixture({
          establishment_siret: "11000001500013",
          geopoint: parisFixture.centre,
          status: RECRUITER_STATUS.ACTIF,
          jobs: [
            {
              rome_code: ["M1602"],
              rome_label: "Opérations Administratives",
              job_status: JOB_STATUS.ACTIVE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
              job_expiration_date: new Date(),
            },
          ],
          address_detail: {
            code_insee_localite: parisFixture.code,
          },
        })
      )

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect(results.jobs).toHaveLength(1)
      expect(results.jobs[0].identifier.id).toEqual(lbaJobs[0].jobs[0]._id)
    })

    it("should ignore recruiters without geopoint", async () => {
      await getDbCollection("recruiters").insertOne(
        generateRecruiterFixture({
          establishment_siret: "11000001500013",
          status: RECRUITER_STATUS.ACTIF,
          jobs: [
            {
              rome_code: ["M1602"],
              rome_label: "Opérations Administratives",
              job_status: JOB_STATUS.ACTIVE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
              job_expiration_date: new Date(),
            },
          ],
          address_detail: {
            code_insee_localite: parisFixture.code,
          },
          address: parisFixture.nom,
        })
      )

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect(results.jobs).toHaveLength(1)
      expect(results.jobs[0].identifier.id).toEqual(lbaJobs[0].jobs[0]._id)
    })
  })

  describe("jobs partners", () => {
    beforeEach(async () => {
      vi.mocked(searchForFtJobs).mockResolvedValue({ data: { resultats: [] }, contentRange: "" })
    })
    it("should limit jobs to 150", async () => {
      const extraOffers: IJobsPartnersOfferPrivate[] = Array.from({ length: 300 }, (e, idx) =>
        generateJobsPartnersOfferPrivate({
          workplace_geopoint: parisFixture.centre,
          offer_rome_codes: ["M1602"],
          partner_job_id: `job-id-a-${idx}`,
        })
      )
      await getDbCollection("jobs_partners").insertMany(extraOffers)
      await getDbCollection("recruiters").deleteMany({})

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect(results.jobs).toHaveLength(150)
    })

    it("should exclude companies not within the radius", async () => {
      await getDbCollection("recruiters").deleteMany({})

      const results = await findJobsOpportunities(
        {
          longitude: clichyFixture.centre.coordinates[0],
          latitude: clichyFixture.centre.coordinates[1],
          radius: 1,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect(results.jobs).toHaveLength(0)
    })

    it("should not include offer_multicast=false jobs", async () => {
      await getDbCollection("jobs_partners").insertOne(
        generateJobsPartnersOfferPrivate({
          offer_rome_codes: ["M1602"],
          workplace_geopoint: parisFixture.centre,
          offer_multicast: false,
          partner_job_id: "job-id-4",
        })
      )
      await getDbCollection("recruiters").deleteMany({})

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect(results.jobs).toHaveLength(1)
    })

    it("should return jobs without apply.recipient_id when no apply_email is present", async () => {
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").insertOne(
        generateJobsPartnersOfferPrivate({
          _id: new ObjectId(),
          offer_rome_codes: ["M1602"],
          workplace_geopoint: parisFixture.centre,
          offer_creation: new Date("2023-01-01"),
          partner_job_id: "job-id-9",
          apply_email: null, // Pas d'email
        })
      )
      await getDbCollection("recruiters").deleteMany({})

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()

      expect(results.jobs).toHaveLength(1)
      expect(results.jobs[0].apply.recipient_id).toBeNull()
    })

    it("should return jobs with apply.recipient_id when apply_email is present", async () => {
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").insertOne(
        generateJobsPartnersOfferPrivate({
          _id: new ObjectId(),
          offer_rome_codes: ["M1602"],
          workplace_geopoint: parisFixture.centre,
          offer_creation: new Date("2023-01-01"),
          partner_job_id: "job-id-10",
          apply_email: "contact@example.com", // Email présent
        })
      )
      await getDbCollection("recruiters").deleteMany({})

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()

      expect(results.jobs).toHaveLength(1)
      expect(results.jobs[0].apply.recipient_id).toEqual(`partners_${results.jobs[0].identifier.id}`)
    })

    describe("when filtered by diploma", () => {
      beforeEach(async () => {
        await getDbCollection("jobs_partners").insertMany([
          generateJobsPartnersOfferPrivate({
            offer_rome_codes: ["M1602"],
            workplace_geopoint: parisFixture.centre,
            offer_target_diploma: { european: "4", label: "BP, Bac, autres formations niveau (Bac)" },
            partner_job_id: "job-id-5",
          }),
          generateJobsPartnersOfferPrivate({
            offer_rome_codes: ["M1602"],
            workplace_geopoint: parisFixture.centre,
            offer_target_diploma: { european: "3", label: "CAP, BEP, autres formations niveau (CAP)" },
            partner_job_id: "job-id-6",
          }),
        ])
        await getDbCollection("recruiters").deleteMany({})
      })

      it("should return jobs with requested diploma and unknown ones only", async () => {
        const results = await findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
            target_diploma_level: "3",
            rncp: null,
            opco: null,
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )

        const parseResult = zJobSearchApiV3Response.safeParse(results)
        expect.soft(parseResult.success).toBeTruthy()
        expect(parseResult.error).toBeUndefined()
        expect(results.jobs).toHaveLength(2)
        expect(results.jobs.map((j) => j.offer.target_diploma)).toEqual([null, { european: "3", label: "CAP, BEP, autres formations niveau (CAP)" }])
      })
    })

    describe("when filtered by partner_label", () => {
      beforeEach(async () => {
        await getDbCollection("jobs_partners").insertMany([
          generateJobsPartnersOfferPrivate({
            offer_rome_codes: ["D1104"],
            workplace_geopoint: parisFixture.centre,
            partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
            partner_job_id: "job-id-filter-1",
          }),
          generateJobsPartnersOfferPrivate({
            offer_rome_codes: ["D1104"],
            workplace_geopoint: parisFixture.centre,
            partner_label: JOBPARTNERS_LABEL.HELLOWORK,
            partner_job_id: "job-id-filter-2",
          }),
          generateJobsPartnersOfferPrivate({
            offer_rome_codes: ["D1104"],
            workplace_geopoint: parisFixture.centre,
            partner_label: JOBPARTNERS_LABEL.HELLOWORK,
            partner_job_id: "job-id-filter-3",
          }),
          generateJobsPartnersOfferPrivate({
            offer_rome_codes: ["D1104"],
            workplace_geopoint: parisFixture.centre,
            partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE,
            partner_job_id: "job-id-filter-4",
          }),
        ])
        await getDbCollection("recruiters").deleteMany({})
      })

      it("should only return jobs without the excluded partner_labels", async () => {
        let results = await findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["D1104"],
            rncp: null,
            opco: null,
            partners_to_exclude: [JOBPARTNERS_LABEL.HELLOWORK],
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )

        const parseResult = zJobSearchApiV3Response.safeParse(results)
        expect.soft(parseResult.success).toBeTruthy()
        expect(parseResult.error).toBeUndefined()
        expect.soft(results.jobs).toHaveLength(2)
        expect.soft(results.jobs[0].identifier.partner_label).toEqual(JOBPARTNERS_LABEL.RH_ALTERNANCE)
        expect.soft(results.jobs[1].identifier.partner_label).toEqual(JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA)

        results = await findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["D1104"],
            rncp: null,
            opco: null,
            partners_to_exclude: [JOBPARTNERS_LABEL.RH_ALTERNANCE],
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )

        expect.soft(results.jobs).toHaveLength(3)
        expect.soft(results.jobs[0].identifier.partner_label).not.toBe(JOBPARTNERS_LABEL.RH_ALTERNANCE)
        expect.soft(results.jobs[1].identifier.partner_label).not.toBe(JOBPARTNERS_LABEL.RH_ALTERNANCE)
        expect.soft(results.jobs[2].identifier.partner_label).not.toBe(JOBPARTNERS_LABEL.RH_ALTERNANCE)

        results = await findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["D1104"],
            rncp: null,
            opco: null,
            partners_to_exclude: [JOBPARTNERS_LABEL.RH_ALTERNANCE, JOBPARTNERS_LABEL.HELLOWORK],
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )

        expect.soft(results.jobs).toHaveLength(1)
        expect.soft(results.jobs[0].identifier.partner_label).toEqual(JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA)
      })
    })

    describe("when filtered by opco", () => {
      const ctx = new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")

      beforeEach(async () => {
        await getDbCollection("jobs_partners").deleteMany({})
        await getDbCollection("recruiters").deleteMany({})

        await getDbCollection("jobs_partners").insertMany([
          generateJobsPartnersOfferPrivate({
            offer_rome_codes: ["M1602"],
            workplace_geopoint: parisFixture.centre,
            offer_target_diploma: { european: "4", label: "BP, Bac, autres formations niveau (Bac)" },
            partner_job_id: "job-id-1",
            workplace_opco: OPCOS_LABEL.AFDAS,
          }),
          generateJobsPartnersOfferPrivate({
            offer_rome_codes: ["M1602"],
            workplace_geopoint: parisFixture.centre,
            offer_target_diploma: { european: "4", label: "BP, Bac, autres formations niveau (Bac)" },
            partner_job_id: "job-id-2",
            workplace_opco: OPCOS_LABEL.AFDAS,
          }),
          generateJobsPartnersOfferPrivate({
            offer_rome_codes: ["M1602"],
            workplace_geopoint: parisFixture.centre,
            offer_target_diploma: { european: "4", label: "BP, Bac, autres formations niveau (Bac)" },
            partner_job_id: "job-id-3",
            workplace_opco: OPCOS_LABEL.AKTO,
          }),
          generateJobsPartnersOfferPrivate({
            offer_rome_codes: ["M1602"],
            workplace_geopoint: parisFixture.centre,
            offer_target_diploma: { european: "4", label: "BP, Bac, autres formations niveau (Bac)" },
            partner_job_id: "job-id-4",
            workplace_opco: OPCOS_LABEL.AKTO,
          }),
        ])
      })

      it("should return only jobs for the requested opco", async () => {
        const resA = await findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
            rncp: null,
            opco: OPCOS_LABEL.AFDAS,
          },
          ctx
        )
        expect(resA.jobs).toHaveLength(2)
        expect(resA.jobs.every((j) => j.workplace?.domain.opco === OPCOS_LABEL.AFDAS)).toBe(true)

        const resB = await findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
            rncp: null,
            opco: OPCOS_LABEL.AKTO,
          },
          ctx
        )
        expect(resB.jobs).toHaveLength(2)
        expect(resB.jobs.every((j) => j.workplace?.domain.opco === OPCOS_LABEL.AKTO)).toBe(true)
      })

      it("should return all jobs when opco is null", async () => {
        const res = await findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
            rncp: null,
            opco: null,
          },
          ctx
        )
        expect(res.jobs).toHaveLength(4)
      })

      it("should return no jobs for an unknown opco", async () => {
        // on cast pour satisfaire le type, mais on s'attend à rien
        const res = await findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
            rncp: null,
            opco: "UNKNOWN_OPCO" as OPCOS_LABEL,
          },
          ctx
        )
        expect(res.jobs).toHaveLength(0)
      })
    })
  })

  describe("france travail jobs", () => {
    beforeEach(async () => {
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("recruiters").deleteMany({})
    })

    describe("when france travail api returns an error", () => {
      it("should ignore france travail jobs", async () => {
        vi.mocked(searchForFtJobs).mockRejectedValue(new Error("oops"))

        const results = await findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
            rncp: null,
            opco: null,
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )

        const parseResult = zJobSearchApiV3Response.safeParse(results)
        expect.soft(parseResult.success).toBeTruthy()
        expect(parseResult.error).toBeUndefined()
        expect(results.jobs).toHaveLength(0)
        expect(results.warnings).toEqual([
          {
            code: "FRANCE_TRAVAIL_API_ERROR",
            message: "Unable to retrieve job offers from France Travail API",
          },
        ])
      })
    })

    it("should select jobs within the radius", async () => {
      vi.mocked(searchForFtJobs).mockResolvedValue({ data: { resultats: [] }, contentRange: "" })

      const results = await findJobsOpportunities(
        {
          longitude: clichyFixture.centre.coordinates[0],
          latitude: clichyFixture.centre.coordinates[1],
          radius: 100,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect(results.jobs).toHaveLength(0)
      expect(results.warnings).toHaveLength(0)

      expect(searchForFtJobs).toHaveBeenCalledTimes(1)
      expect(searchForFtJobs).toHaveBeenCalledWith(
        {
          codeROME: "M1602",
          commune: clichyFixture.code,
          sort: 2,
          natureContrat: "E2,FS",
          range: "0-149",
          distance: 100,
        },
        { throwOnError: true }
      )
    })

    describe("when searching for jobs with a specific diploma", () => {
      it.each<[INiveauDiplomeEuropeen, (typeof NIVEAUX_POUR_OFFRES_PE)[keyof typeof NIVEAUX_POUR_OFFRES_PE]]>([
        ["3", "NV5"],
        ["4", "NV4"],
        ["5", "NV3"],
        ["6", "NV2"],
        ["7", "NV1"],
      ])("should support filter by diploma %s as level %s", async (target_diploma_level, ftLevel) => {
        vi.mocked(searchForFtJobs).mockResolvedValue({ data: { resultats: [] }, contentRange: "" })

        const results = await findJobsOpportunities(
          {
            longitude: clichyFixture.centre.coordinates[0],
            latitude: clichyFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
            target_diploma_level,
            rncp: null,
            opco: null,
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )

        const parseResult = zJobSearchApiV3Response.safeParse(results)
        expect.soft(parseResult.success).toBeTruthy()
        expect(parseResult.error).toBeUndefined()
        expect(results.jobs).toHaveLength(0)
        expect(results.warnings).toHaveLength(0)

        expect(searchForFtJobs).toHaveBeenCalledTimes(1)
        expect(searchForFtJobs).toHaveBeenCalledWith(
          {
            codeROME: "M1602",
            commune: clichyFixture.code,
            sort: 2,
            natureContrat: "E2,FS",
            range: "0-149",
            distance: 30,
            niveauFormation: ftLevel,
          },
          { throwOnError: true }
        )
      })
    })

    it("should remove jobs without geoloc", async () => {
      const ftJobWithoutGeoloc = generateFtJobFixture({
        id: "2507875",
        intitule: "Assistant manager supermarché en alternance H/F",
        description: "RESPONSABILITÉS : \n\n - La mise en rayon, l'étiquetage et la vérification des dates de consommation",
        dateCreation: "2024-08-17T17:18:18.000Z",
        dateActualisation: "2024-08-17T17:18:18.000Z",
        lieuTravail: {
          libelle: "59 - Nord",
        },
        romeCode: "D1507",
        romeLibelle: "Employé / Employée de libre-service",
        appellationlibelle: "Employé / Employée de libre-service",
        entreprise: {
          nom: "CFA ALTERLINE",
          description: "Tu cherches un moyen de t'insérer dans le monde du travail tout en obtenant un diplôme reconnu par l'Etat ?",
          entrepriseAdaptee: false,
        },
        typeContrat: "CDD",
        typeContratLibelle: "Contrat à durée déterminée - 12 Mois",
        natureContrat: "Contrat apprentissage",
        experienceExige: "D",
        experienceLibelle: "Débutant accepté",
        salaire: {},
        dureeTravailLibelle: "35 H  Travail en journée",
        dureeTravailLibelleConverti: "Temps plein",
        alternance: true,
        nombrePostes: 1,
        accessibleTH: false,
        qualificationCode: "5",
        qualificationLibelle: "Employé non qualifié",
      })

      vi.mocked(searchForFtJobs).mockResolvedValue({ data: { resultats: [ftJobs[0], ftJobWithoutGeoloc] }, contentRange: "" })

      const results = await findJobsOpportunities(
        {
          longitude: clichyFixture.centre.coordinates[0],
          latitude: clichyFixture.centre.coordinates[1],
          radius: 100,
          romes: ["M1602"],
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect(results.jobs).toHaveLength(1)
      expect(results.warnings).toHaveLength(0)
      expect(results.jobs[0].identifier.partner_job_id).toEqual(ftJobs[0].id)
    })
  })

  describe("when searching with location", () => {
    it("should sort by source, distance and then by creation date", async () => {
      vi.mocked(searchForFtJobs).mockResolvedValue({ data: { resultats: ftJobs }, contentRange: "" })

      const extraLbaJob = generateRecruiterFixture({
        establishment_siret: "20003277900015",
        establishment_raison_sociale: "EXTRA LBA JOB 1",
        geopoint: levalloisFixture.centre,
        status: RECRUITER_STATUS.ACTIF,
        jobs: [
          {
            rome_code: ["D1209"],
            rome_label: "Vente de végétaux",
            job_status: JOB_STATUS.ACTIVE,
            job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
            job_creation_date: new Date("2021-01-01"),
            job_expiration_date: new Date(),
          },
          {
            rome_code: ["D1209"],
            rome_label: "Vente de végétaux",
            job_status: JOB_STATUS.ACTIVE,
            job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
            job_creation_date: new Date("2024-01-01"),
            job_expiration_date: new Date(),
          },
        ],
        address_detail: {
          code_insee_localite: levalloisFixture.code,
        },
        address: levalloisFixture.nom,
        phone: "0465000001",
      })

      await getDbCollection("recruiters").insertOne(extraLbaJob)

      const extraOffers = [
        generateJobsPartnersOfferPrivate({
          offer_rome_codes: ["D1212"],
          workplace_geopoint: levalloisFixture.centre,
          offer_creation: new Date("2024-01-01"),
          partner_job_id: "job-id-7",
          // created_at reference the creation date of the job in LBA, not the offer so we don't sort by it
          created_at: new Date("2021-01-01"),
        }),
        generateJobsPartnersOfferPrivate({
          offer_rome_codes: ["D1212"],
          workplace_geopoint: levalloisFixture.centre,
          offer_creation: new Date("2021-01-01"),
          partner_job_id: "job-id-8",
          // created_at reference the creation date of the job in LBA, not the offer so we don't sort by it
          created_at: new Date("2024-01-01"),
        }),
      ]

      await getDbCollection("jobs_partners").insertMany(extraOffers)

      const extraLbaCompanies = [
        generateJobsPartnersOfferPrivate({
          partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
          workplace_siret: "52951974600034",
          workplace_legal_name: "EXTRA LBA COMPANY 1",
          offer_rome_codes: ["D1211"],
          workplace_geopoint: levalloisFixture.centre,
          workplace_address_zipcode: levalloisFixture.code,
        }),
        generateJobsPartnersOfferPrivate({
          partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
          workplace_siret: "52951974600034",
          workplace_legal_name: "EXTRA LBA COMPANY 2",
          offer_rome_codes: ["D1211"],
          workplace_geopoint: levalloisFixture.centre,
          workplace_address_zipcode: levalloisFixture.code,
        }),
      ]

      await getDbCollection("jobs_partners").insertMany(extraLbaCompanies)

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: null,
          rncp: null,
          opco: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      const parseResult = zJobSearchApiV3Response.safeParse(results)
      expect.soft(parseResult.success).toBeTruthy()
      expect(parseResult.error).toBeUndefined()
      expect({
        jobs: results.jobs.map((j) => ({
          _id: j.identifier.id,
          partner_job_id: j.identifier.partner_job_id,
          partner_label: j.identifier.partner_label,
          workplace_legal_name: j.workplace.legal_name,
        })),
        recruiters: results.recruiters.map((j) => ({ _id: j.identifier.id, workplace_legal_name: j.workplace.legal_name })),
      }).toEqual({
        jobs: [
          {
            // Paris
            _id: lbaJobs[0].jobs[0]._id,
            partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
            partner_job_id: lbaJobs[0].jobs[0]._id.toString(),
            workplace_legal_name: lbaJobs[0].establishment_raison_sociale,
          },
          {
            // Levallois - 2024-01-01
            _id: extraLbaJob.jobs[1]._id,
            partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
            partner_job_id: extraLbaJob.jobs[1]._id.toString(),
            workplace_legal_name: extraLbaJob.establishment_raison_sociale,
          },
          {
            // Levallois - 2023-01-01
            _id: lbaJobs[2].jobs[0]._id,
            partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
            partner_job_id: lbaJobs[2].jobs[0]._id.toString(),
            workplace_legal_name: lbaJobs[2].establishment_raison_sociale,
          },
          {
            // Levallois - 2021-01-01
            _id: extraLbaJob.jobs[0]._id,
            partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
            partner_job_id: extraLbaJob.jobs[0]._id.toString(),
            workplace_legal_name: extraLbaJob.establishment_raison_sociale,
          },
          {
            _id: null,
            partner_job_id: ftJobs[0].id,
            partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL,
            workplace_legal_name: null,
          },
          // Paris
          {
            _id: partnerJobs[0]._id,
            partner_label: JOBPARTNERS_LABEL.HELLOWORK,
            partner_job_id: expect.any(String),
            workplace_legal_name: partnerJobs[0].workplace_legal_name,
          },
          // Levallois - 2024-01-01
          {
            _id: extraOffers[0]._id,
            partner_label: JOBPARTNERS_LABEL.HELLOWORK,
            partner_job_id: expect.any(String),
            workplace_legal_name: extraOffers[0].workplace_legal_name,
          },
          // Levallois - 2023-01-01
          {
            _id: partnerJobs[2]._id,
            partner_label: JOBPARTNERS_LABEL.HELLOWORK,
            partner_job_id: expect.any(String),
            workplace_legal_name: partnerJobs[2].workplace_legal_name,
          },
          // Levallois - 2021-01-01
          {
            _id: extraOffers[1]._id,
            partner_label: JOBPARTNERS_LABEL.HELLOWORK,
            partner_job_id: expect.any(String),
            workplace_legal_name: extraOffers[1].workplace_legal_name,
          },
        ],
        recruiters: [
          // Paris
          {
            _id: recruiters[0]._id,
            workplace_legal_name: recruiters[0].workplace_legal_name,
          },
          // Levallois - 2023-01-01
          {
            _id: recruiters[2]._id,
            workplace_legal_name: recruiters[2].workplace_legal_name,
          },
          // Levallois - 2024-01-01
          {
            _id: extraLbaCompanies[0]._id,
            workplace_legal_name: extraLbaCompanies[0].workplace_legal_name,
          },
          // Levallois - 2021-01-01
          {
            _id: extraLbaCompanies[1]._id,
            workplace_legal_name: extraLbaCompanies[1].workplace_legal_name,
          },
        ],
      })

      expect(searchForFtJobs).toHaveBeenCalledTimes(1)
      expect(searchForFtJobs).toHaveBeenNthCalledWith(
        1,
        {
          commune: "75101", // Special case for paris
          sort: 2, // Sort by distance and then by creation date
          natureContrat: "E2,FS",
          range: "0-149",
          distance: 30,
        },
        { throwOnError: true }
      )
    })
  })
})

function generateJobOfferApiWriteV3(input: IJobOfferApiWriteV3Input): IJobOfferApiWriteV3 {
  return zJobOfferApiWriteV3.parse(input)
}

describe("createJobOffer", () => {
  const identity = {
    email: "mail@mailType.com",
    organisation: "Some organisation",
    habilitations: { "applications:write": false, "appointments:write": false, "jobs:write": true },
  } as const satisfies IApiAlternanceTokenData

  const now = new Date("2024-06-18T00:00:00.000Z")
  const in2Month = new Date("2024-08-17T22:00:00.000Z")
  const inSept = new Date("2024-09-01T00:00:00.000Z")

  const minimalData: IJobOfferApiWriteV3Input = {
    contract: {
      start: inSept.toJSON(),
    },

    offer: {
      title: "Apprentis en développement web",
      rome_codes: ["M1602"],
      description: "Envie de devenir développeur web ? Rejoignez-nous !",
    },

    apply: {
      phone: "0600000000",
    },

    workplace: {
      siret: apiEntrepriseEtablissementFixture.dinum.data.siret,
    },
  }

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    return () => {
      vi.useRealTimers()
    }
  })

  it("should create a job offer with the minimal data", async () => {
    const data = generateJobOfferApiWriteV3({ ...minimalData })

    const result = await createJobOffer(identity, data)
    expect(result).toBeInstanceOf(ObjectId)

    const job = await getDbCollection("computed_jobs_partners").findOne({ _id: result })
    expect.soft(job?.created_at).toEqual(now)
    expect.soft(job?.partner_label).toEqual(identity.organisation)
    expect.soft(job?.offer_status).toEqual(JOB_STATUS.ACTIVE)
    expect.soft(job?.offer_creation).toEqual(now)
    expect.soft(job?.offer_expiration).toEqual(in2Month)
    expect.soft(job?.offer_target_diploma).toEqual(null)
    expect.soft(omit(job, "partner_job_id")).toMatchSnapshot({
      _id: expect.any(ObjectId),
    })
  })

  it('should get workplace location from given "workplace_address_*" fields', async () => {
    const data = generateJobOfferApiWriteV3({
      ...minimalData,
      workplace: {
        ...minimalData.workplace,
        location: {
          address: "1T impasse Passoir Clichy",
        },
      },
    })
    const result = await createJobOffer(identity, data)

    expect(result).toBeInstanceOf(ObjectId)

    const job = await getDbCollection("computed_jobs_partners").findOne({ _id: result })
    expect(job?.workplace_address_label).toEqual("1T impasse Passoir Clichy")
  })

  it("should support offer.status", async () => {
    const data = generateJobOfferApiWriteV3({ ...minimalData, offer: { ...minimalData.offer, status: JOB_STATUS_ENGLISH.ANNULEE } })

    const result = await createJobOffer(identity, data)
    expect(result).toBeInstanceOf(ObjectId)

    const job = await getDbCollection("computed_jobs_partners").findOne({ _id: result })
    expect(job?.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)

    expect(nock.isDone()).toBeTruthy()
  })
})

describe("updateJobOffer", () => {
  const _id = new ObjectId()
  const identity = {
    email: "mail@mailType.com",
    organisation: "Some organisation",
    habilitations: { "applications:write": false, "appointments:write": false, "jobs:write": true },
  } as const satisfies IApiAlternanceTokenData

  const originalCreatedAt = new Date("2023-09-06T00:00:00.000+02:00")
  const originalCreatedAtPlus2Months = new Date("2023-11-06T00:00:00.000+01:00")
  const now = new Date("2024-06-18T00:00:00.000Z")
  const inSept = new Date("2024-09-01T00:00:00.000Z")

  const originalJob = generateJobsPartnersOfferPrivate({
    _id,
    partner_label: identity.organisation,
    created_at: originalCreatedAt,
    offer_creation: originalCreatedAt,
    offer_expiration: originalCreatedAtPlus2Months,
  })

  const minimalData: IJobOfferApiWriteV3Input = {
    contract: {
      start: inSept.toJSON(),
    },

    offer: {
      title: "Apprentis en développement web",
      rome_codes: ["M1602"],
      description: "Envie de devenir développeur web ? Rejoignez-nous !",
    },

    apply: {
      phone: "0600000000",
    },

    workplace: {
      siret: apiEntrepriseEtablissementFixture.dinum.data.siret,
    },
  }

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    await getDbCollection("jobs_partners").insertOne(originalJob)

    return () => {
      vi.useRealTimers()
    }
  })

  it("should update a job offer with the minimal data", async () => {
    const data = generateJobOfferApiWriteV3({ ...minimalData })
    await updateJobOffer(_id, identity, data)

    const job = await getDbCollection("computed_jobs_partners").findOne({ _id })
    expect.soft(job?.created_at).toEqual(originalCreatedAt)
    expect.soft(job?.partner_label).toEqual(identity.organisation)
    expect.soft(job?.offer_status).toEqual(JOB_STATUS.ACTIVE)
    expect.soft(job?.offer_creation).toEqual(originalCreatedAt)
    // TODO: figure out if the expiration should be updated
    expect.soft(job?.offer_expiration).toEqual(originalCreatedAtPlus2Months)
    expect.soft(job?.offer_target_diploma).toEqual(null)

    expect(omit(job, "partner_job_id")).toMatchSnapshot({
      _id: expect.any(ObjectId),
    })
  })

  it("should support offer.status", async () => {
    const data = generateJobOfferApiWriteV3({ ...minimalData, offer: { ...minimalData.offer, status: JOB_STATUS_ENGLISH.ANNULEE } })

    await updateJobOffer(_id, identity, data)

    const job = await getDbCollection("computed_jobs_partners").findOne({ _id })
    expect(job?.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)

    expect(nock.isDone()).toBeTruthy()
  })
})

describe("findJobOpportunityById tests", () => {
  const jobPartnerId = new ObjectId()
  const now = new Date("2025-02-28T00:00:00.000Z")
  const identity = {
    email: "mail@mailType.com",
    organisation: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES,
    habilitations: { "applications:write": false, "appointments:write": false, "jobs:write": true },
  } as const satisfies IApiAlternanceTokenData
  const originalCreatedAt = new Date("2023-09-06T00:00:00.000+02:00")
  const originalCreatedAtPlus2Months = new Date("2023-11-06T00:00:00.000+01:00")

  const originalJob = generateJobsPartnersOfferPrivate({
    _id: jobPartnerId,
    partner_label: identity.organisation,
    created_at: originalCreatedAt,
    offer_creation: originalCreatedAt,
    offer_expiration: originalCreatedAtPlus2Months,
  })

  const lbaJob: IRecruiter = generateRecruiterFixture({
    establishment_siret: "11000001500013",
    establishment_raison_sociale: "ASSEMBLEE NATIONALE",
    geopoint: parisFixture.centre,
    status: RECRUITER_STATUS.ACTIF,
    jobs: [
      {
        rome_code: ["M1602"],
        rome_label: "Opérations administratives",
        job_status: JOB_STATUS.ACTIVE,
        job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
        job_creation_date: new Date("2021-01-01"),
        job_expiration_date: new Date("2050-01-01"),
      },
    ],
    address_detail: {
      code_insee_localite: parisFixture.code,
    },
    address: parisFixture.nom,
    phone: "0300000000",
  })

  const romes: IReferentielRome[] = [
    generateReferentielRome({
      rome: {
        code_rome: "M1602",
        intitule: "Opérations administratives",
        code_ogr: "475",
      },
    }),
    ...certificationFixtures["RNCP37098-46T31203"].domaines.rome.rncp.map(({ code, intitule }) => generateReferentielRome({ rome: { code_rome: code, intitule, code_ogr: "" } })),
  ]

  describe("getJobsPartnersByIdAsJobOfferApi", () => {
    beforeEach(async () => {
      vi.useFakeTimers()
      vi.setSystemTime(now)
      await getDbCollection("jobs_partners").insertOne(originalJob)

      return () => {
        vi.useRealTimers()
      }
    })

    it("should throw a job not found error on getJobsPartnersByIdAsJobOfferApi", async () => {
      // Créer un contexte de requête mock
      const context = {
        addWarning: vi.fn(),
      } as unknown as JobOpportunityRequestContext

      // Utiliser un ID qui n'existe pas dans la base de données
      const nonExistentId = new ObjectId()

      // Vérifier que la fonction lance bien une erreur
      await expect(getJobsPartnersByIdAsJobOfferApi(nonExistentId, context)).rejects.toThrow("Job not found")

      // Vérifier que la méthode addWarning a été appelée avec le bon message
      expect(context.addWarning).toHaveBeenCalledWith("JOB_NOT_FOUND")
    })

    it("should return a job offer with correct format on getJobsPartnersByIdAsJobOfferApi", async () => {
      // Créer un contexte de requête mock
      const context = {
        addWarning: vi.fn(),
      } as unknown as JobOpportunityRequestContext

      // Mock de la fonction de conversion pour vérifier qu'elle est appelée avec les bons paramètres
      const convertSpy = vi.spyOn(jobsRouteApiv3Converters, "convertToJobOfferApiReadV3")

      // Appeler la fonction avec l'ID existant
      const result = await getJobsPartnersByIdAsJobOfferApi(jobPartnerId, context)

      // Vérifier que la fonction de conversion a été appelée avec les bons paramètres
      expect(convertSpy).toHaveBeenCalledWith({
        ...originalJob,
        contract_type: originalJob.contract_type ?? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
        apply_url: originalJob.apply_url ?? `${config.publicUrl}/emploi/${originalJob.partner_label}/${originalJob._id}/${originalJob.offer_title}`,
        apply_recipient_id: originalJob.apply_email ? `partners_${originalJob._id}` : null,
      })

      // Vérifier que addWarning n'a pas été appelé car le job a été trouvé
      expect(context.addWarning).not.toHaveBeenCalled()

      // Vérifier que le résultat n'est pas null
      expect(result).not.toBeNull()

      // Utiliser le schéma Zod pour valider la structure
      const validationResult = zJobOfferApiReadV3.safeParse(result)

      // Si la validation échoue, afficher les erreurs pour faciliter le débogage
      if (!validationResult.success) {
        console.error("Validation errors:", validationResult.error.format())
      }

      // Vérifier que la validation a réussi
      expect(validationResult.success).toBe(true)
    })

    it("should return a job offer without recipientid when no apply_email on getJobsPartnersByIdAsJobOfferApi", async () => {
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").insertOne({ ...originalJob, apply_email: null })

      // Créer un contexte de requête mock
      const context = {
        addWarning: vi.fn(),
      } as unknown as JobOpportunityRequestContext

      // Mock de la fonction de conversion pour vérifier qu'elle est appelée avec les bons paramètres
      const convertSpy = vi.spyOn(jobsRouteApiv3Converters, "convertToJobOfferApiReadV3")

      // Appeler la fonction avec l'ID existant
      const result = await getJobsPartnersByIdAsJobOfferApi(jobPartnerId, context)

      // Vérifier que la fonction de conversion a été appelée avec les bons paramètres
      expect(convertSpy).toHaveBeenCalledWith({
        ...originalJob,
        contract_type: originalJob.contract_type ?? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
        apply_url: originalJob.apply_url ?? `${config.publicUrl}/emploi/${originalJob.partner_label}/${originalJob._id}/${originalJob.offer_title}`,
        apply_recipient_id: null, // Vérification dans l'appel à la conversion
      })

      // Vérifier que addWarning n'a pas été appelé car le job a été trouvé
      expect(context.addWarning).not.toHaveBeenCalled()

      // Vérifier que le résultat n'est pas null
      expect(result).not.toBeNull()

      // Vérifier que l'objet retourné par getJobsPartnersByIdAsJobOfferApi a bien apply_recipient_id = null
      expect(result?.apply.recipient_id).toBeNull()

      // Utiliser le schéma Zod pour valider la structure
      const validationResult = zJobOfferApiReadV3.safeParse(result)

      // Si la validation échoue, afficher les erreurs pour faciliter le débogage
      if (!validationResult.success) {
        console.error("Validation errors:", validationResult.error.format())
      }

      // Vérifier que la validation a réussi
      expect(validationResult.success).toBe(true)
    })

    it("should return a job offer with recipientid when apply_email on getJobsPartnersByIdAsJobOfferApi", async () => {
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("jobs_partners").insertOne({ ...originalJob, apply_email: "test@mail.fr" })

      // Créer un contexte de requête mock
      const context = {
        addWarning: vi.fn(),
      } as unknown as JobOpportunityRequestContext

      // Mock de la fonction de conversion pour vérifier qu'elle est appelée avec les bons paramètres
      const convertSpy = vi.spyOn(jobsRouteApiv3Converters, "convertToJobOfferApiReadV3")

      // Appeler la fonction avec l'ID existant
      const result = await getJobsPartnersByIdAsJobOfferApi(jobPartnerId, context)

      // Vérifier que la fonction de conversion a été appelée avec les bons paramètres
      expect(convertSpy).toHaveBeenCalledWith({
        ...originalJob,
        contract_type: originalJob.contract_type ?? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
        apply_url: originalJob.apply_url ?? `${config.publicUrl}/emploi/${originalJob.partner_label}/${originalJob._id}/${originalJob.offer_title}`,
        apply_email: "test@mail.fr",
        apply_recipient_id: `partners_${originalJob._id}`, // Vérification dans l'appel à la conversion
      })

      // Vérifier que addWarning n'a pas été appelé car le job a été trouvé
      expect(context.addWarning).not.toHaveBeenCalled()

      // Vérifier que le résultat n'est pas null
      expect(result).not.toBeNull()

      // Vérifier que l'objet retourné par getJobsPartnersByIdAsJobOfferApi a bien apply_recipient_id non null et correct
      expect(result?.apply.recipient_id).toBe(`partners_${originalJob._id}`)

      // Utiliser le schéma Zod pour valider la structure
      const validationResult = zJobOfferApiReadV3.safeParse(result)

      // Si la validation échoue, afficher les erreurs pour faciliter le débogage
      if (!validationResult.success) {
        console.error("Validation errors:", validationResult.error.format())
      }

      // Vérifier que la validation a réussi
      expect(validationResult.success).toBe(true)
    })
  })

  describe("getLbaJobByIdV2AsJobOfferApi", () => {
    beforeEach(async () => {
      await getDbCollection("referentielromes").insertMany(romes)
      await getDbCollection("recruiters").insertOne(lbaJob)
    })

    it("should throw a job not found error on getLbaJobByIdV2AsJobOfferApi", async () => {
      // Créer un contexte de requête mock
      const context = {
        addWarning: vi.fn(),
      } as unknown as JobOpportunityRequestContext

      // Utiliser un ID qui n'existe pas dans la base de données
      const nonExistentId = new ObjectId()

      // Vérifier que la fonction lance bien une erreur
      await expect(getLbaJobByIdV2AsJobOfferApi(nonExistentId, context)).rejects.toThrow("Job not found")

      // Vérifier que la méthode addWarning a été appelée avec le bon message
      expect(context.addWarning).toHaveBeenCalledWith("JOB_NOT_FOUND")
    })

    it("should return a job offer with correct format on getLbaJobByIdV2AsJobOfferApi", async () => {
      // Créer un contexte de requête mock
      const context = {
        addWarning: vi.fn(),
      } as unknown as JobOpportunityRequestContext

      // Exécuter la fonction avec un ID existant
      const jobId = lbaJob.jobs[0]._id
      const result = await getLbaJobByIdV2AsJobOfferApi(jobId, context)

      // Vérifier que addWarning n'a pas été appelé car le job a été trouvé
      expect(context.addWarning).not.toHaveBeenCalled()

      // Vérifier que le résultat n'est pas null
      expect(result).not.toBeNull()

      // Valider que le résultat correspond au schéma attendu
      const validationResult = zJobOfferApiReadV3.safeParse(result)

      // Afficher les erreurs en cas d'échec de validation
      if (!validationResult.success) {
        console.error("Validation errors:", validationResult.error.format())
      }

      // Vérifier que la validation a réussi
      expect(validationResult.success).toBe(true)
    })
  })

  describe("findJobOpportunityById", () => {
    beforeEach(async () => {
      vi.useFakeTimers()
      vi.setSystemTime(now)
      await getDbCollection("jobs_partners").insertOne(originalJob)
      await getDbCollection("referentielromes").insertMany(romes)
      await getDbCollection("recruiters").insertOne(lbaJob)

      return () => {
        vi.useRealTimers()
      }
    })

    it("should throw an error when no job is found on findJobOpportunityById", async () => {
      // Créer un contexte mock
      const context = {
        addWarning: vi.fn(),
      } as unknown as JobOpportunityRequestContext

      // Utiliser un ID inexistant
      const nonExistentId = new ObjectId()

      // Vérifier que la fonction lance une erreur
      await expect(findJobOpportunityById(nonExistentId, context)).rejects.toThrowError("Aucune offre d'emploi trouvée")
    })

    it("should find an offer from jobs_partners collection on findJobOpportunityById", async () => {
      // Créer un contexte mock
      const context = {
        addWarning: vi.fn(),
      } as unknown as JobOpportunityRequestContext

      // Exécuter la fonction avec un ID existant lié à un élément de la collection jobs_partners
      const result = await findJobOpportunityById(jobPartnerId, context)

      // Vérifier que le résultat n'est pas nul
      expect(result).not.toBeNull()

      // Vérifier que l'objet retourné correspond bien au schéma IJobOfferApiReadV3
      const validationResult = zJobOfferApiReadV3.safeParse(result)
      expect(validationResult.success).toBe(true)

      // En cas d'erreur, afficher les détails
      if (!validationResult.success) {
        console.error("Validation errors:", validationResult.error.format())
      }
    })

    it("should find an offer from recruiters collection on findJobOpportunityById", async () => {
      // Créer un contexte mock
      const context = {
        addWarning: vi.fn(),
      } as unknown as JobOpportunityRequestContext

      // Exécuter la fonction avec un ID existant lié à un élément de la collection recruiters
      const lbaJobId = lbaJob.jobs[0]._id
      const result = await findJobOpportunityById(lbaJobId, context)

      // Vérifier que le résultat n'est pas nul
      expect(result).not.toBeNull()

      // Vérifier que l'objet retourné correspond bien au schéma IJobOfferApiReadV3
      const validationResult = zJobOfferApiReadV3.safeParse(result)
      expect(validationResult.success).toBe(true)

      // En cas d'erreur, afficher les détails
      if (!validationResult.success) {
        console.error("Validation errors:", validationResult.error.format())
      }
    })
  })
})
