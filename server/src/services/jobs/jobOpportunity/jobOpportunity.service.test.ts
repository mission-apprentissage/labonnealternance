import { internal } from "@hapi/boom"
import { generateFtJobFixture } from "@tests/fixtures/ftJobs.fixture"
import { useMongo } from "@tests/utils/mongo.test.utils"
import nock from "nock"
import { NIVEAUX_POUR_LBA, NIVEAUX_POUR_OFFRES_PE, RECRUITER_STATUS } from "shared/constants"
import { generateCfaFixture } from "shared/fixtures/cfa.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { generateRecruiterFixture } from "shared/fixtures/recruiter.fixture"
import { generateLbaConpanyFixture } from "shared/fixtures/recruteurLba.fixture"
import { parisFixture, clichyFixture, marseilleFixture, levalloisFixture, generateReferentielCommuneFixtures } from "shared/fixtures/referentiel/commune.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/userWithAccount.fixture"
import { ILbaCompany, IRecruiter, IReferentielRome, JOB_STATUS } from "shared/models"
import { IJobsPartnersOfferPrivate, INiveauDiplomeEuropeen } from "shared/models/jobsPartners.model"
import { beforeEach, beforeAll, afterEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { certificationFixtures } from "@/services/external/api-alternance/certification.fixture"

import { FTJob } from "../../ftjob.service.types"

import { findJobsOpportunities } from "./jobOpportunity.service"
import { JobOpportunityRequestContext } from "./JobOpportunityRequestContext"

useMongo()

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
  const recruiters: ILbaCompany[] = [
    generateLbaConpanyFixture({
      siret: "11000001500013",
      raison_sociale: "ASSEMBLEE NATIONALE",
      enseigne: "ASSEMBLEE NATIONALE - La vraie",
      rome_codes: ["M1602"],
      geopoint: parisFixture.centre,
      insee_city_code: parisFixture.code,
      phone: "0100000000",
      last_update_at: new Date("2021-01-01"),
    }),
    generateLbaConpanyFixture({
      siret: "77555848900073",
      raison_sociale: "GRAND PORT MARITIME DE MARSEILLE (GPMM)",
      rome_codes: ["M1602", "D1212"],
      geopoint: marseilleFixture.centre,
      insee_city_code: marseilleFixture.code,
      phone: "0200000000",
      last_update_at: new Date("2022-01-01"),
    }),
    generateLbaConpanyFixture({
      siret: "52951974600034",
      raison_sociale: "SOCIETE PARISIENNE DE LA PISCINE PONTOISE (S3P)",
      enseigne: "SOCIETE PARISIENNE DE LA PISCINE PONTOISE (S3P)",
      rome_codes: ["D1211"],
      geopoint: levalloisFixture.centre,
      insee_city_code: levalloisFixture.code,
      phone: "0100000001",
      last_update_at: new Date("2023-01-01"),
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
          rome_code: ["M1602"],
          is_multi_published: true,
          job_status: JOB_STATUS.ACTIVE,
          job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
          job_creation_date: new Date("2021-01-01"),
        },
      ],
      address_detail: {
        code_insee_localite: parisFixture.code,
      },
      phone: "0300000000",
    }),
    generateRecruiterFixture({
      establishment_siret: "11000001500013",
      establishment_raison_sociale: "ASSEMBLEE NATIONALE",
      geopoint: marseilleFixture.centre,
      status: RECRUITER_STATUS.ACTIF,
      jobs: [
        {
          rome_code: ["M1602", "D1212"],
          is_multi_published: true,
          job_status: JOB_STATUS.ACTIVE,
          job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
          job_creation_date: new Date("2022-01-01"),
        },
      ],
      address_detail: {
        code_insee_localite: marseilleFixture.code,
      },
      phone: "0400000000",
    }),
    generateRecruiterFixture({
      establishment_siret: "20003277900015",
      establishment_raison_sociale: "PARIS MUSEES",
      geopoint: levalloisFixture.centre,
      status: RECRUITER_STATUS.ACTIF,
      jobs: [
        {
          rome_code: ["D1209"],
          is_multi_published: true,
          job_status: JOB_STATUS.ACTIVE,
          job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
          job_creation_date: new Date("2023-01-01"),
        },
      ],
      address_detail: {
        code_insee_localite: levalloisFixture.code,
      },
      phone: "0400000001",
    }),
  ]
  const partnerJobs: IJobsPartnersOfferPrivate[] = [
    generateJobsPartnersOfferPrivate({
      offer_rome_code: ["M1602"],
      workplace_geopoint: parisFixture.centre,
      offer_creation: new Date("2021-01-01"),
    }),
    generateJobsPartnersOfferPrivate({
      offer_rome_code: ["M1602", "D1214"],
      workplace_geopoint: marseilleFixture.centre,
      offer_creation: new Date("2022-01-01"),
    }),
    generateJobsPartnersOfferPrivate({
      offer_rome_code: ["D1212"],
      workplace_geopoint: levalloisFixture.centre,
      offer_creation: new Date("2023-01-01"),
    }),
  ]
  const ftJobs: FTJob[] = [
    generateFtJobFixture({
      id: "1",
      romeCode: "M1602",
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

  let scopeAuth: nock.Scope
  let scopeFtApi: nock.Scope

  beforeEach(async () => {
    await getDbCollection("recruteurslba").insertMany(recruiters)
    await getDbCollection("recruiters").insertMany(lbaJobs)
    await getDbCollection("jobs_partners").insertMany(partnerJobs)
    await getDbCollection("referentielromes").insertMany(romes)
    await getDbCollection("referentiel.communes").insertMany(generateReferentielCommuneFixtures([parisFixture, clichyFixture, levalloisFixture, marseilleFixture]))

    scopeAuth = nock("https://entreprise.francetravail.fr:443")
      .post(
        "/connexion/oauth2/access_token",
        [
          "grant_type=client_credentials",
          "client_id=LBA_ESD_CLIENT_ID",
          "client_secret=LBA_ESD_CLIENT_SECRET",
          "scope=application_LBA_ESD_CLIENT_ID%20api_offresdemploiv2%20o2dsoffre",
        ].join("&")
      )
      .query({
        realm: "partenaire",
      })
      .reply(200, { access_token: "ft_token", expires_in: 300 })
  })

  it("should execute query", async () => {
    scopeFtApi = nock("https://api.francetravail.io:443")
      .get("/partenaire/offresdemploi/v2/offres/search")
      .query({
        codeROME: "M1602",
        commune: "75101", // Special case for paris
        sort: "2",
        natureContrat: "E2,FS",
        range: "0-149",
        distance: "30",
        partenaires: "LABONNEALTERNANCE",
        modeSelectionPartenaires: "EXCLU",
      })
      .matchHeader("Authorization", "Bearer ft_token")
      .reply(200, { resultats: ftJobs })

    const results = await findJobsOpportunities(
      {
        longitude: parisFixture.centre.coordinates[0],
        latitude: parisFixture.centre.coordinates[1],
        radius: 30,
        romes: ["M1602"],
        rncp: null,
      },
      new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
    )

    expect(results).toEqual({
      jobs: [
        expect.objectContaining({
          _id: lbaJobs[0].jobs[0]._id.toString(),
          workplace_geopoint: lbaJobs[0].geopoint,
        }),
        expect.objectContaining({
          _id: null,
          partner_job_id: ftJobs[0].id,
          partner: "France Travail",
        }),
        expect.objectContaining({
          _id: partnerJobs[0]._id,
          workplace_geopoint: partnerJobs[0].workplace_geopoint,
        }),
      ],
      recruiters: [
        expect.objectContaining({
          _id: recruiters[0]._id,
          workplace_geopoint: recruiters[0].geopoint,
          workplace_name: recruiters[0].enseigne,
        }),
      ],
      warnings: [],
    })
    expect(scopeAuth.isDone()).toBeTruthy()
    expect(scopeFtApi.isDone()).toBeTruthy()
    expect(
      results.jobs.map(({ _id, apply_url, ...j }) => {
        return j
      })
    ).toMatchSnapshot()
    expect(
      results.recruiters.map(({ _id, ...j }) => {
        return j
      })
    ).toMatchSnapshot()
  })

  it("should support query without rncp or rome filter", async () => {
    scopeFtApi = nock("https://api.francetravail.io:443")
      .get("/partenaire/offresdemploi/v2/offres/search")
      .query({
        commune: "75101", // Special case for paris
        sort: "2",
        natureContrat: "E2,FS",
        range: "0-149",
        distance: "30",
        partenaires: "LABONNEALTERNANCE",
        modeSelectionPartenaires: "EXCLU",
      })
      .matchHeader("Authorization", "Bearer ft_token")
      .reply(200, { resultats: ftJobs })

    const results = await findJobsOpportunities(
      {
        longitude: parisFixture.centre.coordinates[0],
        latitude: parisFixture.centre.coordinates[1],
        radius: 30,
        romes: null,
        rncp: null,
      },
      new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
    )

    expect(results).toEqual({
      jobs: [
        expect.objectContaining({
          _id: lbaJobs[0].jobs[0]._id.toString(),
          workplace_geopoint: lbaJobs[0].geopoint,
        }),
        expect.objectContaining({
          _id: lbaJobs[2].jobs[0]._id.toString(),
          workplace_geopoint: lbaJobs[2].geopoint,
        }),
        expect.objectContaining({
          _id: null,
          partner_job_id: ftJobs[0].id,
          partner: "France Travail",
        }),
        expect.objectContaining({
          _id: partnerJobs[0]._id,
          workplace_geopoint: partnerJobs[0].workplace_geopoint,
        }),
        expect.objectContaining({
          _id: partnerJobs[2]._id,
          workplace_geopoint: partnerJobs[2].workplace_geopoint,
        }),
      ],
      recruiters: [
        expect.objectContaining({
          _id: recruiters[0]._id,
          workplace_geopoint: recruiters[0].geopoint,
          workplace_name: recruiters[0].enseigne,
        }),
        expect.objectContaining({
          _id: recruiters[2]._id,
          workplace_geopoint: recruiters[2].geopoint,
          workplace_name: recruiters[2].enseigne,
        }),
      ],
      warnings: [],
    })
    expect(scopeAuth.isDone()).toBeTruthy()
    expect(scopeFtApi.isDone()).toBeTruthy()
  })

  it("should support query without geo filter", async () => {
    scopeFtApi = nock("https://api.francetravail.io:443")
      .get("/partenaire/offresdemploi/v2/offres/search")
      .query({
        sort: "2",
        natureContrat: "E2,FS",
        range: "0-149",
        codeROME: "M1602",
        partenaires: "LABONNEALTERNANCE",
        modeSelectionPartenaires: "EXCLU",
      })
      .matchHeader("Authorization", "Bearer ft_token")
      .reply(200, { resultats: ftJobs })

    const results = await findJobsOpportunities(
      {
        longitude: null,
        latitude: null,
        radius: 30,
        romes: ["M1602"],
        rncp: null,
      },
      new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
    )

    // Order is most recent first
    expect(results).toEqual({
      jobs: [
        expect.objectContaining({
          _id: lbaJobs[1].jobs[0]._id.toString(),
        }),
        expect.objectContaining({
          _id: lbaJobs[0].jobs[0]._id.toString(),
        }),
        expect.objectContaining({
          _id: null,
          partner_job_id: ftJobs[0].id,
          partner: "France Travail",
        }),
        expect.objectContaining({
          _id: partnerJobs[1]._id,
        }),
        expect.objectContaining({
          _id: partnerJobs[0]._id,
        }),
      ],
      recruiters: [
        expect.objectContaining({
          _id: recruiters[1]._id,
          workplace_name: recruiters[1].enseigne,
        }),
        expect.objectContaining({
          _id: recruiters[0]._id,
          workplace_name: recruiters[0].enseigne,
        }),
      ],
      warnings: [],
    })
    expect(scopeAuth.isDone()).toBeTruthy()
    expect(scopeFtApi.isDone()).toBeTruthy()
  })

  describe("searching by rncp code", async () => {
    it("should return jobs corresponding to the romes codes associated with the requested rncp code", async () => {
      scopeFtApi = nock("https://api.francetravail.io:443")
        .get("/partenaire/offresdemploi/v2/offres/search")
        .query({
          // Code ROME correspondant au code RNCP
          codeROME: "D1210,D1212,D1209,D1214,D1211",
          commune: "75101", // Special case for paris
          sort: "2",
          natureContrat: "E2,FS",
          range: "0-149",
          distance: "30",
          partenaires: "LABONNEALTERNANCE",
          modeSelectionPartenaires: "EXCLU",
        })
        .matchHeader("Authorization", "Bearer ft_token")
        .reply(200, { resultats: [] })

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
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      expect(results).toEqual({
        jobs: [
          expect.objectContaining({
            _id: lbaJobs[2].jobs[0]._id.toString(),
            workplace_geopoint: lbaJobs[2].geopoint,
          }),
          expect.objectContaining({
            _id: partnerJobs[2]._id,
            workplace_geopoint: partnerJobs[2].workplace_geopoint,
          }),
        ],
        recruiters: [
          expect.objectContaining({
            _id: recruiters[2]._id,
            workplace_geopoint: recruiters[2].geopoint,
            workplace_name: recruiters[2].enseigne,
          }),
        ],
        warnings: [],
      })
      expect(scopeAuth.isDone()).toBeTruthy()
      expect(scopeFtApi.isDone()).toBeTruthy()
      expect(scopeApiAlternance.isDone()).toBeTruthy()
    })

    it("should error internal when API Alternance request fail", async () => {
      await expect(
        findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            rncp: "RNCP37098",
            romes: null,
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )
      ).rejects.toThrowError(internal("Erreur lors de la récupération des informations de certification"))
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
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )
      ).rejects.toThrowError(internal("Cannot find an active Certification for the given RNCP"))

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
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )
      ).rejects.toThrowError(internal("Cannot find an active Certification for the given RNCP"))

      expect(scopeApiAlternance.isDone()).toBeTruthy()
    })

    it("should resolve RNCP continuity", async () => {
      scopeFtApi = nock("https://api.francetravail.io:443")
        .get("/partenaire/offresdemploi/v2/offres/search")
        .query({
          // Code ROME correspondant au code RNCP
          codeROME: "D1210,D1212,D1209,D1214,D1211",
          commune: "75101", // Special case for paris
          sort: "2",
          natureContrat: "E2,FS",
          range: "0-149",
          distance: "30",
          partenaires: "LABONNEALTERNANCE",
          modeSelectionPartenaires: "EXCLU",
        })
        .matchHeader("Authorization", "Bearer ft_token")
        .reply(200, { resultats: [] })

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
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      expect(results).toEqual({
        jobs: [
          expect.objectContaining({
            _id: lbaJobs[2].jobs[0]._id.toString(),
            workplace_geopoint: lbaJobs[2].geopoint,
          }),
          expect.objectContaining({
            _id: partnerJobs[2]._id,
            workplace_geopoint: partnerJobs[2].workplace_geopoint,
          }),
        ],
        recruiters: [
          expect.objectContaining({
            _id: recruiters[2]._id,
            workplace_geopoint: recruiters[2].geopoint,
            workplace_name: recruiters[2].enseigne,
          }),
        ],
        warnings: [],
      })
      expect(scopeAuth.isDone()).toBeTruthy()
      expect(scopeFtApi.isDone()).toBeTruthy()
      expect(scopeApiAlternance.isDone()).toBeTruthy()
    })
  })

  it("should RNCP & ROME filter appliy as OR condition", async () => {
    scopeFtApi = nock("https://api.francetravail.io:443")
      .get("/partenaire/offresdemploi/v2/offres/search")
      .query({
        // Code ROME correspondant au code RNCP
        codeROME: "M1602,D1210,D1212,D1209,D1214,D1211",
        commune: "75101", // Special case for paris
        sort: "2",
        natureContrat: "E2,FS",
        range: "0-149",
        distance: "30",
        partenaires: "LABONNEALTERNANCE",
        modeSelectionPartenaires: "EXCLU",
      })
      .matchHeader("Authorization", "Bearer ft_token")
      .reply(200, { resultats: ftJobs })

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
      },
      new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
    )

    expect(results).toEqual({
      jobs: [
        expect.objectContaining({
          _id: lbaJobs[0].jobs[0]._id.toString(),
          workplace_geopoint: lbaJobs[0].geopoint,
        }),
        expect.objectContaining({
          _id: lbaJobs[2].jobs[0]._id.toString(),
          workplace_geopoint: lbaJobs[2].geopoint,
        }),
        expect.objectContaining({
          _id: null,
          partner_job_id: ftJobs[0].id,
          partner: "France Travail",
        }),
        expect.objectContaining({
          _id: partnerJobs[0]._id,
          workplace_geopoint: partnerJobs[0].workplace_geopoint,
        }),
        expect.objectContaining({
          _id: partnerJobs[2]._id,
          workplace_geopoint: partnerJobs[2].workplace_geopoint,
        }),
      ],
      recruiters: [
        expect.objectContaining({
          _id: recruiters[0]._id,
          workplace_geopoint: recruiters[0].geopoint,
          workplace_name: recruiters[0].enseigne,
        }),
        expect.objectContaining({
          _id: recruiters[2]._id,
          workplace_geopoint: recruiters[2].geopoint,
          workplace_name: recruiters[2].enseigne,
        }),
      ],
      warnings: [],
    })
    expect(scopeAuth.isDone()).toBeTruthy()
    expect(scopeFtApi.isDone()).toBeTruthy()
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
      const extraLbaCompanies: ILbaCompany[] = Array.from({ length: 200 }, () =>
        generateLbaConpanyFixture({
          geopoint: parisFixture.centre,
          rome_codes: ["M1602"],
        })
      )
      await getDbCollection("recruteurslba").insertMany(extraLbaCompanies)

      const results = await findJobsOpportunities(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
          rncp: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

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
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      expect(results2.recruiters).toHaveLength(0)
    })
  })

  describe("labonnealternance jobs", () => {
    beforeEach(async () => {
      scopeFtApi = nock("https://api.francetravail.io:443")
        .get("/partenaire/offresdemploi/v2/offres/search")
        .query(() => {
          return true
        })
        .reply(200, { resultats: [] })

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
                is_multi_published: true,
                job_status: JOB_STATUS.ACTIVE,
                job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
              },
            ],
            address_detail: {
              code_insee_localite: parisFixture.code,
            },
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
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      expect(scopeFtApi.isDone()).toBeTruthy()
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
              is_multi_published: true,
              job_status: JOB_STATUS.ANNULEE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
            },
            {
              rome_code: ["M1602"],
              is_multi_published: true,
              job_status: JOB_STATUS.EN_ATTENTE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
            },
            {
              rome_code: ["M1602"],
              is_multi_published: true,
              job_status: JOB_STATUS.POURVUE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
            },
            {
              rome_code: ["M1602"],
              is_multi_published: true,
              job_status: JOB_STATUS.ACTIVE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
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
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

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
                is_multi_published: true,
                job_status: JOB_STATUS.ACTIVE,
                job_level_label: NIVEAUX_POUR_LBA["3 (CAP...)"],
              },
              {
                rome_code: ["M1602"],
                is_multi_published: true,
                job_status: JOB_STATUS.ACTIVE,
                job_level_label: NIVEAUX_POUR_LBA["4 (BAC...)"],
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
            diplomaLevel: "4",
            rncp: null,
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )

        expect.soft(results.jobs).toHaveLength(2)
        expect.soft(results.jobs.map((j) => j.offer_diploma_level)).toEqual(
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

    it("should returns only job with the multi published flag", async () => {
      await getDbCollection("recruiters").insertOne(
        generateRecruiterFixture({
          establishment_siret: "11000001500013",
          geopoint: parisFixture.centre,
          status: RECRUITER_STATUS.ACTIF,
          jobs: [
            {
              rome_code: ["M1602"],
              is_multi_published: false,
              job_status: JOB_STATUS.ACTIVE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
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
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      expect(results.jobs).toHaveLength(1)
    })

    it("should limit the number of jobs to 150", async () => {
      const JOB_PER_RECRUITER = 10

      const extraRecruiters: IRecruiter[] = Array.from({ length: 500 }, () => {
        const jobs = Array.from({ length: JOB_PER_RECRUITER }, () => ({
          rome_code: ["M1602"],
          is_multi_published: true,
          job_status: JOB_STATUS.ACTIVE,
          job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
        }))

        return generateRecruiterFixture({
          establishment_siret: "11000001500013",
          geopoint: parisFixture.centre,
          status: RECRUITER_STATUS.ACTIF,
          jobs,
          address_detail: {
            code_insee_localite: parisFixture.code,
          },
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
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

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
              is_multi_published: true,
              job_status: JOB_STATUS.ACTIVE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
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
          romes: ["C1110"],
          rncp: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

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
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

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
              is_multi_published: true,
              job_status: JOB_STATUS.ACTIVE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
              custom_geo_coordinates: `${marseilleFixture.centre.coordinates[1]},${marseilleFixture.centre.coordinates[0]}`,
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
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      expect(results.jobs).toHaveLength(2)
    })

    describe("when recruiter is delegated", () => {
      it("should return info from the cfa_delegated_siret", async () => {
        const cfa = generateCfaFixture({
          siret: "78430824900019",
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
              is_multi_published: true,
              job_status: JOB_STATUS.ACTIVE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
            },
            {
              rome_code: ["M1602"],
              is_multi_published: true,
              job_status: JOB_STATUS.ACTIVE,
              job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
            },
          ],
          address_detail: {
            code_insee_localite: parisFixture.code,
          },
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
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )

        expect(results.jobs).toHaveLength(3)
        expect(
          results.jobs.map((j) => ({
            _id: j._id,
            workspace_siret: j.workplace_siret,
            workplace_geopoint: j.workplace_geopoint,
            apply_phone: j.apply_phone,
          }))
        ).toEqual(
          expect.arrayContaining([
            {
              _id: lbaJobs[0].jobs[0]._id.toString(),
              workplace_geopoint: lbaJobs[0].geopoint,
              workspace_siret: lbaJobs[0].establishment_siret,
              apply_phone: lbaJobs[0].phone,
            },
            {
              _id: delegatedLbaJob.jobs[0]._id.toString(),
              workplace_geopoint: delegatedLbaJob.geopoint,
              workspace_siret: cfa.siret,
              apply_phone: userWithAccount.phone,
            },
            {
              _id: delegatedLbaJob.jobs[1]._id.toString(),
              workplace_geopoint: delegatedLbaJob.geopoint,
              workspace_siret: cfa.siret,
              apply_phone: userWithAccount.phone,
            },
          ])
        )
      })
    })
  })

  describe("jobs partners", () => {
    beforeEach(async () => {
      nock("https://api.francetravail.io")
        .get("/partenaire/offresdemploi/v2/offres/search")
        .query(() => true)
        .reply(200, { resultats: [] })
    })
    it("should limit jobs to 150", async () => {
      const extraOffers: IJobsPartnersOfferPrivate[] = Array.from({ length: 300 }, () =>
        generateJobsPartnersOfferPrivate({
          workplace_geopoint: parisFixture.centre,
          offer_rome_code: ["M1602"],
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
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

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
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      expect(results.jobs).toHaveLength(0)
    })

    it("should not include offer_multicast=false jobs", async () => {
      await getDbCollection("jobs_partners").insertOne(
        generateJobsPartnersOfferPrivate({
          offer_rome_code: ["M1602"],
          workplace_geopoint: parisFixture.centre,
          offer_multicast: false,
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
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      expect(results.jobs).toHaveLength(1)
    })

    describe("when filtered by diploma", () => {
      beforeEach(async () => {
        await getDbCollection("jobs_partners").insertMany([
          generateJobsPartnersOfferPrivate({
            offer_rome_code: ["M1602"],
            workplace_geopoint: parisFixture.centre,
            offer_diploma_level: { european: "4", label: "BP, Bac, autres formations niveau (Bac)" },
          }),
          generateJobsPartnersOfferPrivate({
            offer_rome_code: ["M1602"],
            workplace_geopoint: parisFixture.centre,
            offer_diploma_level: { european: "3", label: "CAP, BEP, autres formations niveau (CAP)" },
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
            diplomaLevel: "3",
            rncp: null,
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )

        expect(results.jobs).toHaveLength(2)
        expect(results.jobs.map((j) => j.offer_diploma_level)).toEqual([null, { european: "3", label: "CAP, BEP, autres formations niveau (CAP)" }])
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
        const scopeFtApi = nock("https://api.francetravail.io")
          .get("/partenaire/offresdemploi/v2/offres/search")
          .query({
            codeROME: "M1602",
            commune: "75101", // Special case for paris
            sort: "2",
            natureContrat: "E2,FS",
            range: "0-149",
            distance: "30",
            partenaires: "LABONNEALTERNANCE",
            modeSelectionPartenaires: "EXCLU",
          })
          .matchHeader("Authorization", "Bearer ft_token")
          .reply(500, { error: "Internal server error" })

        const results = await findJobsOpportunities(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
            rncp: null,
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )

        expect(results.jobs).toHaveLength(0)
        expect(results.warnings).toEqual([
          {
            code: "FRANCE_TRAVAIL_API_ERROR",
            message: "Unable to retrieve job offers from France Travail API",
          },
        ])

        expect(scopeAuth.isDone()).toBeTruthy()
        expect(scopeFtApi.isDone()).toBeTruthy()
      })
    })

    it("should select jobs within the radius", async () => {
      const scopeFtApi = nock("https://api.francetravail.io")
        .get("/partenaire/offresdemploi/v2/offres/search")
        .query({
          codeROME: "M1602",
          commune: clichyFixture.code,
          sort: "2",
          natureContrat: "E2,FS",
          range: "0-149",
          distance: "100",
          partenaires: "LABONNEALTERNANCE",
          modeSelectionPartenaires: "EXCLU",
        })
        .matchHeader("Authorization", "Bearer ft_token")
        .reply(200, { resultats: [] })

      const results = await findJobsOpportunities(
        {
          longitude: clichyFixture.centre.coordinates[0],
          latitude: clichyFixture.centre.coordinates[1],
          radius: 100,
          romes: ["M1602"],
          rncp: null,
        },
        new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
      )

      expect(results.jobs).toHaveLength(0)
      expect(results.warnings).toHaveLength(0)

      expect(scopeAuth.isDone()).toBeTruthy()
      expect(scopeFtApi.isDone()).toBeTruthy()
    })

    describe("when searching for jobs with a specific diploma", () => {
      it.each<[INiveauDiplomeEuropeen, (typeof NIVEAUX_POUR_OFFRES_PE)[keyof typeof NIVEAUX_POUR_OFFRES_PE]]>([
        ["3", "NV5"],
        ["4", "NV4"],
        ["5", "NV3"],
        ["6", "NV2"],
        ["7", "NV1"],
      ])("should support filter by diploma %s as level %s", async (diplomaLevel, ftLevel) => {
        const scopeFtApi = nock("https://api.francetravail.io")
          .get("/partenaire/offresdemploi/v2/offres/search")
          .query({
            codeROME: "M1602",
            commune: clichyFixture.code,
            sort: "2",
            natureContrat: "E2,FS",
            range: "0-149",
            distance: "30",
            partenaires: "LABONNEALTERNANCE",
            modeSelectionPartenaires: "EXCLU",
            niveauFormation: ftLevel,
          })
          .matchHeader("Authorization", "Bearer ft_token")
          .reply(200, { resultats: [] })

        const results = await findJobsOpportunities(
          {
            longitude: clichyFixture.centre.coordinates[0],
            latitude: clichyFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
            diplomaLevel,
            rncp: null,
          },
          new JobOpportunityRequestContext({ path: "/api/route" }, "api-alternance")
        )

        expect(results.jobs).toHaveLength(0)
        expect(results.warnings).toHaveLength(0)

        expect(scopeAuth.isDone()).toBeTruthy()
        expect(scopeFtApi.isDone()).toBeTruthy()
      })
    })
  })
})
