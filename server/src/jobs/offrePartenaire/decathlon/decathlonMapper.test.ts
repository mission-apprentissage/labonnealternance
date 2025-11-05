import { ObjectId } from "mongodb"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { decathlonJobToJobsPartners } from "@/jobs/offrePartenaire/decathlon/decathlonMapper"

const now = new Date("2024-07-21T04:49:06.000+02:00")

const decathlonJob = {
  locale: "fr_FR",
  reference: "KWYLVLYSRRKVGO513",
  published_at: "2025-11-24T10:18:17+00:00",
  catch_phrase: "",
  contract_type: "Contrat d'alternance (pro, apprentissage)",
  contract_duration: {
    min: "12",
    max: "24",
  },
  contract_work_period: "Temps plein",
  service: "Manager Commerce",
  service_internal_ref: "RSP.UNI|HFR37",
  service_hash_id: "dZwEd6Vx",
  experience_level: "Indifférent",
  education_level: "BUT, Licence, Bac+3",
  title: "ALTERNANCE Manager Commerce (H/F)",
  description: "description",
  profile: "profile",
  skills: ["entrepreneur", "Esprit d'équipe", "Management", "Accueil", "Produit", "Relation Sportif"],
  salary: {
    min: null,
    max: null,
    kind: "Horaire",
    rate_type: "Brut",
    variable: "",
    currency: "EUR",
  },
  pictures: [
    {
      default: "https://app.digitalrecruiters.com/generated_contents/images/career_picture/9rWnvp4x-8.jpg",
      wide: "https://app.digitalrecruiters.com/generated_contents/images/career_wide_picture/9rWnvp4x-8png52973103cropped.jpg",
    },
  ],
  videos: [],
  internal_apply_url: null,
  apply_url: "https://joinus.decathlon.fr/fr/annonce/3977401-alternance-manager-commerce-hf-78140-velizy-villacoublay#declareStep1",
  address: {
    parts: {
      street: "2 Avenue de l'Europe",
      zip: "78140",
      city: "Vélizy-Villacoublay",
      county: "Yvelines",
      state: "Île-de-France",
      country: "France",
    },
    formatted: "2 Avenue de l'Europe,  78140 Vélizy-Villacoublay, France",
    position: {
      lon: "2.2201465",
      lat: "48.7812805",
    },
  },
  entity: {
    public_name: "Vélizy",
    internal_ref: "F016",
    around: "",
    address: {
      parts: {
        street: "2 Avenue de l'Europe",
        zip: "78140",
        city: "Vélizy-Villacoublay",
        county: "Yvelines",
        state: "Île-de-France",
        country: "France",
      },
      formatted: "2 Avenue de l'Europe,  78140 Vélizy-Villacoublay, France",
      position: {
        lon: "2.2201465",
        lat: "48.7812805",
      },
    },
    manager: {
      section_title: "",
      section_body: "",
      picture_url: null,
      firstname: "",
      lastname: "",
      position: "",
    },
    hierarchy: [
      {
        depth: 6,
        column_name: "Magasins",
        public_name: "Vélizy",
      },
      {
        depth: 5,
        column_name: "Régions / Sites",
        public_name: "Paris Ouest",
      },
      {
        depth: 4,
        column_name: "Zones / Régions",
        public_name: "PARIS BIG CITY",
      },
      {
        depth: 3,
        column_name: "Filière",
        public_name: "Commerce (Magasin)/ E-commerce",
      },
      {
        depth: 2,
        column_name: "Pays",
        public_name: "France",
      },
      {
        depth: 1,
        column_name: "Compte enfant",
        public_name: "Decathlon",
      },
    ],
  },
  referent_recruiter: {
    firstname: "Benjamin",
    lastname: "POULEUR",
    picture_url: null,
  },
  brand: {
    name: "DECATHLON Retail Omnichannel",
    description: "DECATHLON Retail Omnichannel",
    logo: "https://app.digitalrecruiters.com/generated_contents/images/company_logo_career/RPJ4yka9-logo-7.png",
    favicon: "https://app.digitalrecruiters.com/generated_contents/images/company_logo_career/x1rjeVLR-favicon-7.png",
  },
}

describe("decathlonMapper", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    return () => {
      vi.useRealTimers()
    }
  })

  it("should convert a job to a decathlon job", () => {
    expect(decathlonJobToJobsPartners(decathlonJob)).toEqual({
      _id: expect.any(ObjectId),
      apply_phone: null,
      apply_url: "https://joinus.decathlon.fr/fr/annonce/3977401-alternance-manager-commerce-hf-78140-velizy-villacoublay?s_o=la-bonne-alternance#declareStep1",
      business_error: null,
      contract_duration: 12,
      contract_is_disabled_elligible: false,
      contract_remote: null,
      contract_start: null,
      contract_type: ["Apprentissage"],
      created_at: new Date("2024-07-21T02:49:06.000Z"),
      errors: [],
      jobs_in_success: [],
      offer_access_conditions: [],
      offer_creation: new Date("2025-11-24T10:18:17.000Z"),
      offer_description: "description",
      offer_desired_skills: ["entrepreneur", "Esprit d'équipe", "Management", "Accueil", "Produit", "Relation Sportif"],
      offer_expiration: new Date("2026-01-24T09:18:17.000Z"),
      offer_multicast: true,
      offer_opening_count: 1,
      offer_origin: null,
      offer_rome_codes: undefined,
      offer_status: "Active",
      offer_target_diploma: {
        european: "6",
        label: "Licence, Maîtrise, autres formations (Bac+3 à Bac+4)",
      },
      offer_title: "ALTERNANCE Manager Commerce (H/F)",
      offer_to_be_acquired_knowledge: [],
      offer_to_be_acquired_skills: [],
      partner_job_id: "KWYLVLYSRRKVGO513",
      partner_label: JOBPARTNERS_LABEL.DECATHLON,
      updated_at: new Date("2024-07-21T02:49:06.000Z"),
      validated: false,
      workplace_address_city: "Vélizy-Villacoublay",
      workplace_address_label: "2 Avenue de l'Europe,  78140 Vélizy-Villacoublay, France",
      workplace_address_street_label: "2 Avenue de l'Europe",
      workplace_address_zipcode: "78140",
      workplace_brand: null,
      workplace_description: "DECATHLON Retail Omnichannel",
      workplace_geopoint: {
        coordinates: [2.2201465, 48.7812805],
        type: "Point",
      },
      workplace_idcc: null,
      workplace_legal_name: null,
      workplace_naf_code: null,
      workplace_naf_label: null,
      workplace_name: "DECATHLON Retail Omnichannel",
      workplace_opco: null,
      workplace_siret: null,
      workplace_size: null,
      workplace_website: null,
      lba_url: null,
    })
  })
  it("should format apply_url correctly", () => {
    expect(
      decathlonJobToJobsPartners({
        ...decathlonJob,
        apply_url: "https://joinus.decathlon.fr/fr/annonce/3977401-alternance-manager-commerce-hf-78140-velizy-villacoublay#declareStep1",
      }).apply_url
    ).toEqual("https://joinus.decathlon.fr/fr/annonce/3977401-alternance-manager-commerce-hf-78140-velizy-villacoublay?s_o=la-bonne-alternance#declareStep1")
  })
})
