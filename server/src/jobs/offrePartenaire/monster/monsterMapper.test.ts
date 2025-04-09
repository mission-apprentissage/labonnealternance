//import { ObjectId } from "mongodb"
import { ObjectId } from "mongodb"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { monsterJobToJobsPartners } from "./monsterMapper"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("monsterJobToJobsPartners", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    return () => {
      vi.useRealTimers()
    }
  })

  it("should convert a monster job to a partner_label job", () => {
    expect(
      monsterJobToJobsPartners({
        postingId: "001003b0-a719-4a77-8b6b-01c8503afb8f",
        title: "Chargé d'Affaires Professionnels - Territoire de Boulogne Billancourt (92) H/F",
        JobActiveDate: "2025-02-26",
        CompanyName: "ISCOD",
        siretNumber: "66204244930730",
        JobPostalCode: "92400",
        JobCity: "Boulogne-Billancourt",
        State: "IDF",
        Country: "FR",
        Latitude: "48.834",
        Longitude: "2.243",
        Industry: null,
        JobCategory: "Sales/Retail/Business Development",
        JobOccupation: "4100688001001",
        JobLevel: "UNKNOWN",
        JobStatus: "FULL_TIME",
        JobType: "PERMANENT",
        CompanyJobLogoURL: "https://securemedia.newjobs.com/clu/xbnp/xbnpcpafrx/JobLogo.gif",
        JobBody:
          "<strong>Missions, équipe et environnement de travail, ça donne quoi ?</strong>Première banque de l’Union Européenne, Pognon inc. est au service de plus de 7 millions de clients particuliers et  clients professionnels (artisans, professions libérales, TPE) en France.Notre objectif en tant que banque...",
        guid: "https://www.monster.fr/emploi/recherche?q=Charg%C3%A9+dAffaires+Professionnels++Territoire+de+Boulogne+Billancourt++H&where=Boulogne-Billancourt&id=001003b0-a719-4a77-8b6b-01c8503afb8f&mstr_dist=true&utm_medium=feeds_boards&utm_term=unpaid&utm_content=prospecting&utm_source=labonnealternance&utm_campaign=labonnealternance_fr",
      })
    ).toMatchObject({
      _id: expect.any(ObjectId),
      apply_phone: null,
      created_at: now,
      updated_at: null,
      partner_label: "Monster",
      partner_job_id: "001003b0-a719-4a77-8b6b-01c8503afb8f",
      contract_start: null,
      contract_type: ["Apprentissage", "Professionnalisation"],
      contract_remote: null,
      contract_duration: null,
      offer_title: "Chargé d'Affaires Professionnels - Territoire de Boulogne Billancourt (92) H/F",
      offer_description:
        "Missions, équipe et environnement de travail, ça donne quoi ?Première banque de l’Union Européenne, Pognon inc. est au service de plus de 7 millions de clients particuliers et  clients professionnels (artisans, professions libérales, TPE) en France.Notre objectif en tant que banque...",
      offer_status: "Active",
      offer_target_diploma: null,
      offer_desired_skills: [],
      offer_access_conditions: [],
      offer_to_be_acquired_skills: [],
      offer_rome_codes: null,
      offer_creation: new Date("2025-02-26T00:00:00.000Z"),
      offer_expiration: new Date("2025-04-26T00:00:00.000Z"),
      offer_origin: null,
      offer_opening_count: 1,
      offer_multicast: true,
      workplace_siret: "66204244930730",
      workplace_name: "ISCOD",
      workplace_description: null,
      workplace_size: null,
      workplace_website: null,
      workplace_opco: null,
      workplace_naf_label: null,
      workplace_naf_code: null,
      workplace_idcc: null,
      workplace_legal_name: null,
      workplace_brand: null,
      workplace_address_label: "Boulogne-Billancourt 92400",
      workplace_address_zipcode: "92400",
      workplace_address_city: "Boulogne-Billancourt",
      workplace_address_street_label: null,
      workplace_geopoint: {
        type: "Point",
        coordinates: [2.243, 48.834],
      },
      apply_url:
        "https://www.monster.fr/emploi/recherche?q=Charg%C3%A9+dAffaires+Professionnels++Territoire+de+Boulogne+Billancourt++H&where=Boulogne-Billancourt&id=001003b0-a719-4a77-8b6b-01c8503afb8f&mstr_dist=true&utm_medium=feeds_boards&utm_term=unpaid&utm_content=prospecting&utm_source=labonnealternance&utm_campaign=labonnealternance_fr",
      errors: [],
      validated: false,
      business_error: JOB_PARTNER_BUSINESS_ERROR.CFA,
      jobs_in_success: [],
    })
  })
})
