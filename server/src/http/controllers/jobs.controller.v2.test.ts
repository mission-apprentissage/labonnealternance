import { getApiApprentissageTestingToken } from "@tests/utils/jwt.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { createRecruteurLbaTest, saveJobPartnerTest } from "@tests/utils/user.test.utils"
import nock from "nock"
import { IJobsPartnersOfferPrivate, ZJobsPartnersPostApiBody } from "shared/models/jobsPartners.model"
import { afterEach, describe, expect, it } from "vitest"

describe("/jobs", () => {
  const httpClient = useServer()
  const token = getApiApprentissageTestingToken({ email: "test@test.fr" })

  const rome = ["D1214", "D1212", "D1211"]
  const rncpQuery = "RNCP13620"
  const geopoint = { type: "Point", coordinates: [7.120835315436125, -45.16534931026399] as [number, number] }
  const romesQuery = rome.join(",")
  const [longitude, latitude] = geopoint.coordinates
  let jobPartnerOffer: IJobsPartnersOfferPrivate

  const mockData = async () => {
    jobPartnerOffer = await saveJobPartnerTest({ offer_rome_code: rome, workplace_geopoint: geopoint })
    await createRecruteurLbaTest({ rome_codes: rome, geopoint: geopoint, siret: "58006820882692" })
  }

  useMongo(mockData, "beforeAll")

  describe("/rome", () => {
    it("should return 401 if no api key provided", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/v2/jobs/rome" })
      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unauthorized" })
    })
    it("should return 401 if no api key is invalid", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/v2/jobs/rome", headers: { authorization: `Bearer ${token}invalid` } })
      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unauthorized" })
    })
    it("should throw ZOD error if ROME is not formatted correctly", async () => {
      const romesQuery = "D4354,D864,F67"
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs/rome?romes=${romesQuery}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const { data } = response.json()
      expect(response.statusCode).toBe(400)
      expect(data.validationError.code).toBe("FST_ERR_VALIDATION")
    })
    it("should throw ZOD error if GEOLOCATION is not formatted correctly", async () => {
      const [latitude, longitude] = [300, 200]
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs/rome?romes=${romesQuery}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const { data } = response.json()
      expect(response.statusCode).toBe(400)
      expect(data.validationError.code).toBe("FST_ERR_VALIDATION")
    })
    it("should perform search and return data", async () => {
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs/rome?romes=${romesQuery}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const data = response.json()
      expect(response.statusCode).toBe(200)
      expect(!!data.jobs.length).toBe(true)
      expect(!!data.recruiters.length).toBe(true)
    })
  })
  describe("/rncp", () => {
    it("should return 401 if no api key provided", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/v2/jobs/rncp" })
      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unauthorized" })
    })
    it("should return 401 if no api key is invalid", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/v2/jobs/rncp", headers: { authorization: `Bearer ${token}invalid` } })
      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unauthorized" })
    })
    it("should throw ZOD error if RNCP is not formatted correctly", async () => {
      const rncp = "RNCP13"
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs/rncp?rncp=${rncp}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const { data } = response.json()
      expect(response.statusCode).toBe(400)
      expect(data.validationError.code).toBe("FST_ERR_VALIDATION")
    })
    it("should throw ZOD error if GEOLOCATION is not formatted correctly", async () => {
      const [latitude, longitude] = [300, 200]
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs/rncp?romes=${rncpQuery}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const { data } = response.json()
      expect(response.statusCode).toBe(400)
      expect(data.validationError.code).toBe("FST_ERR_VALIDATION")
    })
    it("should perform search and return data", async () => {
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs/rncp?rncp=${rncpQuery}&latitude=${latitude}&longitude=${longitude}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const data = response.json()
      expect(response.statusCode).toBe(200)
      expect(!!data.jobs.length).toBe(true)
      expect(!!data.recruiters.length).toBe(true)
    })
  })
  describe("/jobs", async () => {
    describe("POST API entry validation", () => {
      const validData = {
        workplace_siret: "12345678901234",
        contract_start: "2024-01-01",
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

          const { data } = response.json()
          expect(response.statusCode).toBe(400)
          expect(data.validationError.code).toBe("FST_ERR_VALIDATION")
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
          contract_start: new Date(),
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
