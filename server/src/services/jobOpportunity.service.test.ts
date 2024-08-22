import { generateFtJobFixture } from "@tests/fixtures/ftJobs.fixture"
import { useMongo } from "@tests/utils/mongo.test.utils"
import nock from "nock"
import { INiveauDiplomeEuropeen, NIVEAUX_POUR_LBA, NIVEAUX_POUR_OFFRES_PE, RECRUITER_STATUS } from "shared/constants"
import { generateCfaFixture } from "shared/fixtures/cfa.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { generateRecruiterFixture } from "shared/fixtures/recruiter.fixture"
import { generateLbaConpanyFixture } from "shared/fixtures/recruteurLba.fixture"
import { parisFixture, clichyFixture, marseilleFixture, levalloisFixture, generateReferentielCommuneFixtures } from "shared/fixtures/referentiel/commune.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/userWithAccount.fixture"
import { ILbaCompany, IRecruiter, IReferentielRome, JOB_STATUS } from "shared/models"
import { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { beforeEach, beforeAll, afterEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { FTJob } from "./ftjob.service.types"
import { findJobsOpportunityResponseFromRome } from "./jobOpportunity.service"

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

describe("findJobsOpportunityResponseFromRome", () => {
  const recruiters: ILbaCompany[] = [
    generateLbaConpanyFixture({
      siret: "11000001500013",
      raison_sociale: "ASSEMBLEE NATIONALE",
      enseigne: "ASSEMBLEE NATIONALE - La vraie",
      rome_codes: ["M1602"],
      geopoint: parisFixture.centre,
      insee_city_code: parisFixture.code,
      phone: "0100000000",
    }),
    generateLbaConpanyFixture({
      siret: "77555848900073",
      raison_sociale: "GRAND PORT MARITIME DE MARSEILLE (GPMM)",
      rome_codes: ["M1602"],
      geopoint: marseilleFixture.centre,
      insee_city_code: marseilleFixture.code,
      phone: "0200000000",
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
          rome_code: ["M1602"],
          is_multi_published: true,
          job_status: JOB_STATUS.ACTIVE,
          job_level_label: NIVEAUX_POUR_LBA.INDIFFERENT,
        },
      ],
      address_detail: {
        code_insee_localite: marseilleFixture.code,
      },
      phone: "0400000000",
    }),
  ]
  const partnerJobs: IJobsPartnersOfferPrivate[] = [
    generateJobsPartnersOfferPrivate({
      offer_rome_code: ["M1602"],
      workplace_geopoint: parisFixture.centre,
    }),
    generateJobsPartnersOfferPrivate({
      offer_rome_code: ["M1602"],
      workplace_geopoint: marseilleFixture.centre,
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

    const results = await findJobsOpportunityResponseFromRome(
      {
        longitude: parisFixture.centre.coordinates[0],
        latitude: parisFixture.centre.coordinates[1],
        radius: 30,
        romes: ["M1602"],
      },
      { route: { path: "/api/route" }, caller: "api-alternance" }
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

      const results = await findJobsOpportunityResponseFromRome(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
        },
        { route: { path: "/api/route" }, caller: "api-alternance" }
      )

      expect(results.recruiters).toHaveLength(150)
    })

    it("should exclude companies not within the radius", async () => {
      const results1 = await findJobsOpportunityResponseFromRome(
        {
          longitude: clichyFixture.centre.coordinates[0],
          latitude: clichyFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
        },
        { route: { path: "/api/route" }, caller: "api-alternance" }
      )

      expect(results1.recruiters).toHaveLength(1)

      const results2 = await findJobsOpportunityResponseFromRome(
        {
          longitude: clichyFixture.centre.coordinates[0],
          latitude: clichyFixture.centre.coordinates[1],
          radius: 2,
          romes: ["M1602"],
        },
        { route: { path: "/api/route" }, caller: "api-alternance" }
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

      const results = await findJobsOpportunityResponseFromRome(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
        },
        { route: { path: "/api/route" }, caller: "api-alternance" }
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

      const results = await findJobsOpportunityResponseFromRome(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
        },
        { route: { path: "/api/route" }, caller: "api-alternance" }
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

        const results = await findJobsOpportunityResponseFromRome(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
            diplomaLevel: "4",
          },
          { route: { path: "/api/route" }, caller: "api-alternance" }
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

      const results = await findJobsOpportunityResponseFromRome(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
        },
        { route: { path: "/api/route" }, caller: "api-alternance" }
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

      const results = await findJobsOpportunityResponseFromRome(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
        },
        { route: { path: "/api/route" }, caller: "api-alternance" }
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

      const results = await findJobsOpportunityResponseFromRome(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["C1110"],
        },
        { route: { path: "/api/route" }, caller: "api-alternance" }
      )

      expect(results.jobs).toHaveLength(0)
    })

    it("should exclude companies not within the radius", async () => {
      const results = await findJobsOpportunityResponseFromRome(
        {
          longitude: clichyFixture.centre.coordinates[0],
          latitude: clichyFixture.centre.coordinates[1],
          radius: 1,
          romes: ["M1602"],
        },
        { route: { path: "/api/route" }, caller: "api-alternance" }
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

      const results = await findJobsOpportunityResponseFromRome(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
        },
        { route: { path: "/api/route" }, caller: "api-alternance" }
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

        const results = await findJobsOpportunityResponseFromRome(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
          },
          { route: { path: "/api/route" }, caller: "api-alternance" }
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

      const results = await findJobsOpportunityResponseFromRome(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
        },
        { route: { path: "/api/route" }, caller: "api-alternance" }
      )

      expect(results.jobs).toHaveLength(150)
    })

    it("should exclude companies not within the radius", async () => {
      await getDbCollection("recruiters").deleteMany({})

      const results = await findJobsOpportunityResponseFromRome(
        {
          longitude: clichyFixture.centre.coordinates[0],
          latitude: clichyFixture.centre.coordinates[1],
          radius: 1,
          romes: ["M1602"],
        },
        { route: { path: "/api/route" }, caller: "api-alternance" }
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

      const results = await findJobsOpportunityResponseFromRome(
        {
          longitude: parisFixture.centre.coordinates[0],
          latitude: parisFixture.centre.coordinates[1],
          radius: 30,
          romes: ["M1602"],
        },
        { route: { path: "/api/route" }, caller: "api-alternance" }
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
        const results = await findJobsOpportunityResponseFromRome(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
            diplomaLevel: "3",
          },
          { route: { path: "/api/route" }, caller: "api-alternance" }
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
      // Ignorer + ajouter un warning dans la réponse
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

        const results = await findJobsOpportunityResponseFromRome(
          {
            longitude: parisFixture.centre.coordinates[0],
            latitude: parisFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
          },
          { route: { path: "/api/route" }, caller: "api-alternance" }
        )

        expect(results.jobs).toHaveLength(0)

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

      const results = await findJobsOpportunityResponseFromRome(
        {
          longitude: clichyFixture.centre.coordinates[0],
          latitude: clichyFixture.centre.coordinates[1],
          radius: 100,
          romes: ["M1602"],
        },
        { route: { path: "/api/route" }, caller: "api-alternance" }
      )

      expect(results.jobs).toHaveLength(0)

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

        const results = await findJobsOpportunityResponseFromRome(
          {
            longitude: clichyFixture.centre.coordinates[0],
            latitude: clichyFixture.centre.coordinates[1],
            radius: 30,
            romes: ["M1602"],
            diplomaLevel,
          },
          { route: { path: "/api/route" }, caller: "api-alternance" }
        )

        expect(results.jobs).toHaveLength(0)

        expect(scopeAuth.isDone()).toBeTruthy()
        expect(scopeFtApi.isDone()).toBeTruthy()
      })
    })
  })
})
