import { ObjectId } from "mongodb"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { helloWorkJobToJobsPartners } from "./helloWorkMapper"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("helloWorkJobToJobsPartners", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    return () => {
      vi.useRealTimers()
    }
  })

  it("should convert a hellowork job to a partner_label job", () => {
    expect(
      helloWorkJobToJobsPartners({
        job_id: "73228597",
        reference: "1267078/12939556 GPEADPA/69V",
        cpc: "0",
        title: "Gestionnaire Paie et ADP - Alternance H/F",
        url: "https://www.url.com/redirect?poc=2&op=5989883668&o=1",
        description: "ceci est une longue description qui a du sens et qui va passer la limite de 30 caractères",
        profile: "profile",
        benefits: null,
        address: "Stem Propreté Lyon,Villeurbanne,69100",
        city: "VILLEURBANNE",
        geoloc: "45.770996568,4.889070834",
        region: "AUVERGNE RHONE ALPES",
        department: "RHONE",
        postal_code: "69100",
        country: "France",
        publication_date: "2024-07-05 22:14:56",
        updated_date: "2024-07-21 04:49:06",
        contract: "Alternance",
        contract_start_date: "2024-12-01 00:00:00",
        contract_end_date: null,
        contract_period_value: 1,
        contract_period_unit: "Year",
        qualification: "RJ/Qualif/Agent_maitrise_B3",
        experience: "Inf_1",
        function: "RH_Personnel_Formation",
        code_rome: "M1203",
        ogr_id: "12802",
        job_time: "Full time",
        education: "RJ/Qualif/Agent_maitrise_B3",
        language: null,
        remote: "Pas_teletravail",
        sector: "Serv_entreprise",
        company_title: "Stem Propreté Lyon",
        company_description: "ceci est une longue description de l'entreprise qui a du sens et qui va passer la limite de 30 caractères",
        logo: "https://f.hellowork.com/img/mail/logo/hellowork-black.png",
        company_logo: "http://ressources.regionsjob.com/img/entreprises/94930.png",
        siret: "39837261500128",
        naf_code: "8121Z",
        company_sector: "Nettoyage courant des bâtiments",
        csr_label: null,
      })
    ).toEqual({
      _id: expect.any(ObjectId),
      apply_phone: null,
      created_at: now,
      updated_at: new Date("2024-07-21T04:49:06.000+02:00"),
      partner_label: "Hellowork",
      partner_job_id: "73228597",
      contract_start: new Date("2024-12-01T00:00:00.000+01:00"),
      contract_type: ["Apprentissage", "Professionnalisation"],
      contract_remote: "onsite",
      contract_duration: 12,
      offer_title: "Gestionnaire Paie et ADP - Alternance H/F",
      offer_description: "ceci est une longue description qui a du sens et qui va passer la limite de 30 caractères",
      offer_status: "Active",
      offer_target_diploma: {
        european: "6",
        label: "Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)",
      },
      offer_desired_skills: ["profile"],
      offer_access_conditions: [],
      offer_to_be_acquired_knowledge: [],
      offer_to_be_acquired_skills: [],
      offer_rome_codes: ["M1203"],
      offer_creation: new Date("2024-07-05T22:14:56.000+02:00"),
      offer_expiration: new Date("2024-09-05T20:14:56.000Z"),
      offer_origin: null,
      offer_opening_count: 1,
      offer_multicast: true,
      workplace_siret: "39837261500128",
      workplace_name: "Stem Propreté Lyon",
      workplace_description: "ceci est une longue description de l'entreprise qui a du sens et qui va passer la limite de 30 caractères",
      workplace_size: null,
      workplace_website: null,
      workplace_opco: null,
      workplace_naf_label: null,
      workplace_naf_code: null,
      workplace_idcc: null,
      workplace_legal_name: null,
      workplace_brand: null,
      workplace_address_label: "VILLEURBANNE 69100",
      workplace_address_zipcode: "69100",
      workplace_address_city: "VILLEURBANNE",
      workplace_address_street_label: null,
      workplace_geopoint: {
        type: "Point",
        coordinates: [4.889070834, 45.770996568],
      },
      apply_url: "https://www.url.com/redirect?poc=2&op=5989883668&o=1",
      errors: [],
      validated: false,
      business_error: null,
      jobs_in_success: [],
    })
  })
})
