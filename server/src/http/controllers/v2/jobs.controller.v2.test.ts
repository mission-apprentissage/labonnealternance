import { getApiApprentissageTestingToken } from "@tests/utils/jwt.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { createRecruteurLbaTest } from "@tests/utils/user.test.utils"
import nock from "nock"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { clichyFixture, generateReferentielCommuneFixtures, levalloisFixture, marseilleFixture, parisFixture } from "shared/fixtures/referentiel/commune.fixture"
import { IGeoPoint } from "shared/models"
import { IJobsPartnersOfferPrivate, ZJobsPartnersPostApiBody } from "shared/models/jobsPartners.model"
import { afterEach, beforeAll, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { certificationFixtures } from "@/services/external/api-alternance/certification.fixture"

describe("/jobs", () => {
  const httpClient = useServer()
  const token = getApiApprentissageTestingToken({ email: "test@test.fr" })

  const rome = ["D1214", "D1212", "D1211"]
  const rncpQuery = "RNCP37098"
  const certification = certificationFixtures["RNCP37098-46T31203"]

  const porteDeClichy: IGeoPoint = {
    type: "Point",
    coordinates: [2.313262, 48.894891],
  }
  const romesQuery = rome.join(",")
  const [longitude, latitude] = porteDeClichy.coordinates
  const jobPartnerOffer: IJobsPartnersOfferPrivate = generateJobsPartnersOfferPrivate({
    offer_rome_codes: ["D1214"],
    workplace_geopoint: parisFixture.centre,
  })

  const mockData = async () => {
    await createRecruteurLbaTest({ rome_codes: rome, geopoint: clichyFixture.centre, siret: "58006820882692", email: "email@mail.com" })
  }

  useMongo(mockData, "beforeAll")

  describe("GET /jobs", () => {
    beforeAll(async () => {
      await getDbCollection("referentiel.communes").insertMany(generateReferentielCommuneFixtures([parisFixture, clichyFixture, levalloisFixture, marseilleFixture]))
      await getDbCollection("jobs_partners").insertOne(jobPartnerOffer)
    })

    it("should return 401 if no api key provided", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/v2/jobs" })
      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unauthorized" })
    })

    it("should return 401 if no api key is invalid", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/v2/jobs", headers: { authorization: `Bearer ${token}invalid` } })
      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unauthorized" })
    })

    it("should throw ZOD error if ROME is not formatted correctly", async () => {
      const romesQuery = "D4354,D864,F67"
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs?romes=${romesQuery}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const data = response.json()
      expect(response.statusCode).toBe(400)
      expect(data).toEqual({
        data: {
          validationError: {
            _errors: [],
            romes: {
              _errors: ["One or more ROME codes are invalid. Expected format is 'D1234'."],
            },
          },
        },
        error: "Bad Request",
        message: "Request validation failed",
        statusCode: 400,
      })
    })

    it("should throw ZOD error if GEOLOCATION is not formatted correctly", async () => {
      const [latitude, longitude] = [300, 200]
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs?romes=${romesQuery}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const data = response.json()
      expect(response.statusCode).toBe(400)
      expect(data).toEqual({
        data: {
          validationError: {
            _errors: [],
            latitude: {
              _errors: ["Latitude invalide"],
            },
            longitude: {
              _errors: ["Longitude invalide"],
            },
          },
        },
        error: "Bad Request",
        message: "Request validation failed",
        statusCode: 400,
      })
    })

    it("should perform search and return data", async () => {
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs?romes=${romesQuery}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const data = response.json()
      expect(response.statusCode).toBe(200)
      expect(data.jobs).toHaveLength(1)
      expect(data.recruiters).toHaveLength(1)

      expect(Object.keys(data.jobs[0]).toSorted()).toEqual([
        "_id",
        "apply_phone",
        "apply_url",
        "contract_duration",
        "contract_remote",
        "contract_start_date",
        "contract_type",
        "offer_access_conditions",
        "offer_creation",
        "offer_description",
        "offer_desired_skills",
        "offer_diploma_level",
        "offer_expiration",
        "offer_opening_count",
        "offer_rome_codes",
        "offer_status",
        "offer_title",
        "offer_to_be_acquired_skills",
        "partner",
        "partner_job_id",
        "workplace_address",
        "workplace_description",
        "workplace_geopoint",
        "workplace_idcc",
        "workplace_naf_code",
        "workplace_naf_label",
        "workplace_name",
        "workplace_opco",
        "workplace_siret",
        "workplace_size",
        "workplace_website",
      ])

      expect(Object.keys(data.recruiters[0]).toSorted()).toEqual([
        "_id",
        "apply_phone",
        "apply_url",
        "workplace_address",
        "workplace_description",
        "workplace_geopoint",
        "workplace_idcc",
        "workplace_naf_code",
        "workplace_naf_label",
        "workplace_name",
        "workplace_opco",
        "workplace_siret",
        "workplace_size",
        "workplace_website",
      ])
    })

    it("should support rncp param", async () => {
      const scope = nock("https://api.apprentissage.beta.gouv.fr").get(`/api/certification/v1`).query({ "identifiant.rncp": rncpQuery }).reply(200, [certification])

      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs?rncp=${rncpQuery}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })

      const data = response.json()
      expect(response.statusCode).toBe(200)
      expect(data.jobs).toHaveLength(1)
      expect(data.recruiters).toHaveLength(1)
      expect(data.warnings).toEqual([{ code: "FRANCE_TRAVAIL_API_ERROR", message: "Unable to retrieve job offers from France Travail API" }])
      expect(scope.isDone()).toBe(true)
    })

    it("should require latitude when longitude is provided", async () => {
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs?longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const data = response.json()
      expect(response.statusCode).toBe(400)
      expect(data).toEqual({
        data: {
          validationError: {
            _errors: [],
            latitude: {
              _errors: ["latitude is required when longitude is provided"],
            },
          },
        },
        error: "Bad Request",
        message: "Request validation failed",
        statusCode: 400,
      })
    })

    it("should require longitude when latitude is provided", async () => {
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs?latitude=${latitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const data = response.json()
      expect(response.statusCode).toBe(400)
      expect(data).toEqual({
        data: {
          validationError: {
            _errors: [],
            longitude: {
              _errors: ["longitude is required when latitude is provided"],
            },
          },
        },
        error: "Bad Request",
        message: "Request validation failed",
        statusCode: 400,
      })
    })

    it("should all params be optional", async () => {
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs`,
        headers: { authorization: `Bearer ${token}` },
      })

      const data = response.json()
      expect(response.statusCode).toBe(200)
      expect(data.jobs).toHaveLength(1)
      expect(data.recruiters).toHaveLength(1)
      expect(data.warnings).toEqual([{ code: "FRANCE_TRAVAIL_API_ERROR", message: "Unable to retrieve job offers from France Travail API" }])
    })
  })

  describe("POST /jobs", async () => {
    describe("POST API entry validation", () => {
      const validData = {
        workplace_siret: "12345678901234",
        contract_start_date: "2024-01-01",
        contract_duration: "12 months",
        offer_title: "Software Engineer",
        offer_description: "Develop and maintain software.",
        offer_diploma_level_label: "Bachelor's Degree",
      }

      const mandatoryFields = Object.keys(ZJobsPartnersPostApiBody._def.schema.shape).filter((key) => {
        const field = ZJobsPartnersPostApiBody._def.schema.shape[key]
        return !(field.isOptional() || field._def.defaultValue !== undefined)
      })

      describe.each(mandatoryFields)("Validation for missing %s", async (field) => {
        it(`should throw ZOD error if ${field} is missing`, async () => {
          const invalidData = { ...validData }
          delete invalidData[field]

          const response = await httpClient().inject({
            method: "POST",
            path: `/api/v2/jobs`,
            body: invalidData,
            headers: { authorization: `Bearer ${token}` },
          })

          const data = response.json()
          expect(response.statusCode).toBe(400)
          expect(data).toEqual(expect.objectContaining({ error: "Bad Request", message: "Request validation failed", statusCode: 400 }))
        })
      })
    })
    // TODO
    describe.skip("POST API create offer", () => {
      const apiEntrepriseResponse = {
        data: {
          siret: "30613890001294",
          siege_social: true,
          etat_administratif: "A",
          date_fermeture: 1634133818,
          activite_principale: {
            code: "8411Z",
            libelle: "Administration publique générale",
            nomenclature: "NAFRev2",
          },
          tranche_effectif_salarie: {
            code: "51",
            intitule: "2 000 à 4 999 salariés",
            date_reference: "2016",
            de: 2000,
            a: 4999,
          },
          status_diffusion: "diffusible",
          diffusable_commercialement: true,
          enseigne: "Coiff Land, CoiffureLand",
          unite_legale: {
            siren: "130025265",
            rna: "W751004076",
            siret_siege_social: "13002526500013",
            type: "personne_morale",
            personne_morale_attributs: {
              raison_sociale: "DIRECTION INTERMINISTERIELLE DU NUMERIQUE",
              sigle: "DINUM",
            },
            personne_physique_attributs: {
              pseudonyme: "DJ Falcon",
              prenom_usuel: "Jean",
              prenom_1: "Jean",
              prenom_2: "Jacques",
              prenom_3: "Pierre",
              prenom_4: "Paul",
              nom_usage: "Dupont",
              nom_naissance: "Martin",
              sexe: "M",
            },
            categorie_entreprise: "GE",
            status_diffusion: "diffusible",
            diffusable_commercialement: true,
            forme_juridique: {
              code: "7120",
              libelle: "Service central d'un ministère",
            },
            activite_principale: {
              code: "8411Z",
              libelle: "Administration publique générale",
              nomenclature: "NAFRev2",
            },
            tranche_effectif_salarie: {
              code: "51",
              intitule: "2 000 à 4 999 salariés",
              date_reference: "2016",
              de: 2000,
              a: 4999,
            },
            etat_administratif: "A",
            economie_sociale_et_solidaire: true,
            date_creation: 1634103818,
          },
          adresse: {
            numero_voie: "22",
            indice_repetition_voie: "bis",
            type_voie: "RUE",
            libelle_voie: "DE LA PAIX",
            complement_adresse: "ZAE SAINT GUENAULT",
            code_commune: "75112",
            code_postal: "75016",
            distribution_speciale: "dummy",
            code_cedex: "75590",
            libelle_cedex: "PARIS CEDEX 12",
            libelle_commune: "PARIS 12",
            libelle_commune_etranger: "dummy",
            code_pays_etranger: "99132",
            libelle_pays_etranger: "ROYAUME-UNI",
            status_diffusion: "diffusible",
            acheminement_postal: {
              l1: "DIRECTION INTERMINISTERIELLE DU NUMERIQUE",
              l2: "JEAN MARIE DURAND",
              l3: "ZAE SAINT GUENAULT",
              l4: "51 BIS RUE DE LA PAIX",
              l5: "CS 72809",
              l6: "75002 PARIS",
              l7: "FRANCE",
            },
          },
          date_creation: 1634103818,
        },
        links: {
          unite_legale: "https://entreprise.api.gouv.fr/api/v3/insee/unites_legales/130025265",
        },
        meta: {
          date_derniere_mise_a_jour: 1618396818,
          redirect_from_siret: "30613890000010",
        },
      }
      const apiRomeoResponse = [
        {
          contexte: " ",
          identifiant: "1",
          intitule: "Software Engineer",
          metiersRome: [
            {
              codeAppellation: "404251",
              codeRome: "E1206",
              libelleAppellation: "Software Designer",
              libelleRome: "UX - UI Designer",
              scorePrediction: 0.832,
            },
            {
              codeAppellation: "404250",
              codeRome: "E1206",
              libelleAppellation: "Software Design Specialist Designer",
              libelleRome: "UX - UI Designer",
              scorePrediction: 0.764,
            },
            {
              codeAppellation: "404252",
              codeRome: "E1206",
              libelleAppellation: "Software design leader",
              libelleRome: "UX - UI Designer",
              scorePrediction: 0.754,
            },
            {
              codeAppellation: "404307",
              codeRome: "M1813",
              libelleAppellation: "Ingénieur / Ingénieure progiciel",
              libelleRome: "Intégrateur / Intégratrice logiciels métiers",
              scorePrediction: 0.752,
            },
            {
              codeAppellation: "404278",
              codeRome: "M1811",
              libelleAppellation: "Data engineer",
              libelleRome: "Data engineer",
              scorePrediction: 0.744,
            },
          ],
          uuidInference: "180d530a-474a-496b-8d3b-f3d91928c663",
        },
      ]

      afterEach(() => nock.cleanAll())

      it("should create an offer", async () => {
        const newOffer = {
          workplace_siret: "42476141900045",
          contract_start_date: new Date(),
          contract_duration: 12,
          contract_type: ["Apprentissage"],
          offer_title: "Software Engineer",
          offer_description: "Develop and maintain software.",
          offer_diploma_level_label: "Indifférent",
          apply_email: "test@test.com",
        }

        nock("https://entreprise.api.gouv.fr").get(`/v3/insee/sirene/etablissements/diffusibles/42476141900045`).query(true).reply(200, apiEntrepriseResponse)

        // nock.disableNetConnect()
        // nock.recorder.rec()
        nock("https://entreprise.francetravail.fr")
          .post(
            "/connexion/oauth2/access_token",
            "grant_type=client_credentials&client_id=LBA_ESD_CLIENT_ID&client_secret=LBA_ESD_CLIENT_SECRET&scope=application_LBA_ESD_CLIENT_ID%20api_romeov2"
          )
          .query(true)
          .reply(200, "api-token")

        nock("https://api.francetravail.io", { reqheaders: { Authorization: "Bearer api-token" } })
          .post("/partenaire/romeo/v2/predictionMetiers")
          .query(true)
          .reply(200, apiRomeoResponse)

        const response = await httpClient().inject({
          method: "POST",
          path: `/api/v2/jobs`,
          body: newOffer,
          headers: { authorization: `Bearer ${token}` },
        })

        console.log(response.json())
      })
    })
    it("should update an existing offer", async () => {
      const response = await httpClient().inject({
        method: "PATCH",
        path: `/api/v2/jobs/${jobPartnerOffer._id}`,
        body: { contract_duration: 36 },
        headers: { authorization: `Bearer ${token}` },
      })
      const data: IJobsPartnersOfferPrivate = response.json()
      expect(response.statusCode).toBe(200)
      expect(data.contract_duration).toEqual(36)
    })
  })
})
