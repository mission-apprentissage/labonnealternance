//import { ObjectId } from "mongodb"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { meteojobJobToJobsPartners } from "./meteojobMapper"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("meteojobJobToJobsPartners", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    return () => {
      vi.useRealTimers()
    }
  })

  it("should convert a meteojob job to a partner_label job", () => {
    expect(
      meteojobJobToJobsPartners({
        $: {
          id: "43954570",
          reference: "AD4310AL",
          lang: "fr",
        },
        title: "VENDEUR MAGASINIER H/F",
        description:
          "<p>- Identifier les pièces détachées sur les différents logiciels constructeurs.</p><p>- Gérer les appels téléphoniques et les emails pour répondre à chaque demande.</p><p>- Gérer les commandes et réceptions fournisseurs.</p><p>- Réaliser les ventes clients au comptoir.</p><p>- Préparer les commandes clients et techniciens.</p><p>- Assurer les différents mouvements de stock via notre logiciel.</p><p>- Gérer les problèmes de retour pièces.</p><p>- Participer à la bonne tenue du magasin (étiquetage, rangement et nettoyage).</p><p>Vous êtes emmené à faire une semaine d'école à Nantes par mois.</p>",
        link: "https://www.meteojob.com/jobads/43954570?utm_source=labonnealternance&utm_medium=aggregator-free&utm_campaign=alternance",
        publicationDate: "2025-02-25T02:46:50.131Z",
        lastModificationDate: "2025-02-25T02:46:50.131Z",
        position: "Vendeur-magasinier (H/F)",
        industry: "Recrutement et placement",
        company: {
          $: {
            id: "39837261500128",
            anonymous: "false",
          },
          name: "Tralala",
          description: "Tralala est une entreprise qui recrute des gens",
        },
        workplace: {
          locations: {
            location: {
              $: {
                label: "Bruguières (31)",
                lat: "43.72417",
                lng: "1.41139",
              },
              city: "Bruguières",
              postalCode: "31150",
              department: {
                _: "Haute-Garonne",
                $: {
                  code: "31",
                },
              },
              state: {
                _: "Occitanie",
                $: {
                  code: "76",
                },
              },
              country: {
                _: "France",
                $: {
                  code: "FR",
                },
              },
            },
          },
        },
        contract: {
          types: {
            type: {
              _: "Alternance / Apprentissage",
              $: {
                code: "apprentice",
              },
            },
          },
          length: {
            _: "12 month",
            $: {
              value: "12",
              unit: "month",
            },
          },
        },
        workSchedule: {
          types: {
            type: {
              _: "Temps plein",
              $: {
                code: "full-time",
              },
            },
          },
        },
        benefits: {
          salary: {
            _: "à partir de 11,88 € par an",
            $: {
              currency: "EUR",
              lowEnd: "11.88",
              period: "annum",
            },
          },
        },
        profile: {
          description:
            "<p>Vous êtes organisé, polyvalent, curieux et vous avez le sens du contact.</p><p>Vous avez des connaissances en mécanique, électricité, hydraulique et en informatique, et ou vous avez une première expérience dans la recherche de pièce en automobile ou autre.</p>",
          degrees: {
            degree: {
              _: "Aucun diplôme",
              $: {
                code: "none",
              },
            },
          },
          experienceLevels: {
            experienceLevel: [
              {
                _: "débutant à 1 an",
                $: {
                  code: "beginner",
                },
              },
              {
                _: "1-2 ans",
                $: {
                  code: "one_two",
                },
              },
            ],
          },
        },
      })
    ).toMatchObject({
      //_id: expect.any(ObjectId),
      apply_phone: null,
      created_at: now,
      updated_at: new Date("2025-02-25T02:46:50.131Z"),
      partner_label: "Meteojob",
      partner_job_id: "43954570",
      contract_start: null,
      contract_type: ["Apprentissage", "Professionnalisation"],
      contract_remote: null,
      contract_duration: 12,
      offer_title: "VENDEUR MAGASINIER H/F",
      //offer_description:
      //  "\r\n- Identifier les pièces détachées sur les différents logiciels constructeurs.\r\n- Gérer les appels téléphoniques et les emails pour répondre à chaque demande.- Gérer les commandes et réceptions fournisseurs.- Réaliser les ventes clients au comptoir.- Préparer les commandes clients et techniciens.- Assurer les différents mouvements de stock via notre logiciel.- Gérer les problèmes de retour pièces.- Participer à la bonne tenue du magasin (étiquetage, rangement et nettoyage).Vous êtes emmené à faire une semaine d'école à Nantes par mois.\r\n\r\nSecteur: Recrutement et placement\r\n \r\n \r\n  Poste: Vendeur-magasinier (H/F)\r\n \r\n  Temps plein\r\n\r\n\r\n  Avantages: à partir de 11,88 € par an\r\n\r\n\r\n  Profil: Vous êtes organisé, polyvalent, curieux et vous avez le sens du contact.Vous avez des connaissances en mécanique, électricité, hydraulique et en informatique, et ou vous avez une première expérience dans la recherche de pièce en automobile ou autre.",
      offer_status: "Active",
      offer_target_diploma: null,
      offer_desired_skills: [],
      offer_access_conditions: ["débutant à 1 an", "1-2 ans"],
      offer_to_be_acquired_skills: [],
      offer_rome_codes: undefined,
      offer_creation: new Date("2025-02-25T02:46:50.131Z"),
      offer_expiration: new Date("2025-04-25T02:46:50.131Z"),
      offer_origin: null,
      offer_opening_count: 1,
      offer_multicast: true,
      workplace_siret: null,
      workplace_name: "Tralala",
      workplace_description: "Tralala est une entreprise qui recrute des gens",
      workplace_size: null,
      workplace_website: null,
      workplace_opco: null,
      workplace_naf_label: null,
      workplace_naf_code: null,
      workplace_idcc: null,
      workplace_legal_name: null,
      workplace_brand: null,
      workplace_address_label: "Bruguières (31)",
      workplace_address_zipcode: "31150",
      workplace_address_city: "Bruguières",
      workplace_address_street_label: null,
      workplace_geopoint: {
        type: "Point",
        coordinates: [1.41139, 43.72417],
      },
      apply_url: "https://www.meteojob.com/jobads/43954570?utm_source=labonnealternance&utm_medium=aggregator-free&utm_campaign=alternance",
      errors: [],
      validated: false,
      business_error: null,
      jobs_in_success: [],
    })
  })

  it("should convert a meteojob job to a partner_label job", () => {
    expect(
      meteojobJobToJobsPartners({
        $: {
          id: "43954570",
          reference: "AD4310AL",
          lang: "fr",
        },
        title: "VENDEUR MAGASINIER H/F",
        description:
          "<p>- Identifier les pièces détachées sur les différents logiciels constructeurs.</p><p>- Gérer les appels téléphoniques et les emails pour répondre à chaque demande.</p><p>- Gérer les commandes et réceptions fournisseurs.</p><p>- Réaliser les ventes clients au comptoir.</p><p>- Préparer les commandes clients et techniciens.</p><p>- Assurer les différents mouvements de stock via notre logiciel.</p><p>- Gérer les problèmes de retour pièces.</p><p>- Participer à la bonne tenue du magasin (étiquetage, rangement et nettoyage).</p><p>Vous êtes emmené à faire une semaine d'école à Nantes par mois.</p>",
        link: "https://www.meteojob.com/jobads/43954570?utm_source=labonnealternance&utm_medium=aggregator-free&utm_campaign=alternance",
        publicationDate: "2025-02-25T02:46:50.131Z",
        lastModificationDate: "2025-02-25T02:46:50.131Z",
        position: "Vendeur-magasinier (H/F)",
        industry: "Recrutement et placement",
        company: {
          $: {
            id: "39837261500128",
            anonymous: "false",
          },
          name: "Iscod",
          description: "Tralala est une entreprise qui recrute des gens",
        },
        workplace: {
          locations: {
            location: {
              $: {
                label: "Bruguières (31)",
                lat: "43.72417",
                lng: "1.41139",
              },
              city: "Bruguières",
              postalCode: "31150",
              department: {
                _: "Haute-Garonne",
                $: {
                  code: "31",
                },
              },
              state: {
                _: "Occitanie",
                $: {
                  code: "76",
                },
              },
              country: {
                _: "France",
                $: {
                  code: "FR",
                },
              },
            },
          },
        },
        contract: {
          types: {
            type: {
              _: "Alternance / Apprentissage",
              $: {
                code: "apprentice",
              },
            },
          },
          length: {
            _: "12 month",
            $: {
              value: "12",
              unit: "month",
            },
          },
        },
        workSchedule: {
          types: {
            type: {
              _: "Temps plein",
              $: {
                code: "full-time",
              },
            },
          },
        },
        benefits: {
          salary: {
            _: "à partir de 11,88 € par an",
            $: {
              currency: "EUR",
              lowEnd: "11.88",
              period: "annum",
            },
          },
        },
        profile: {
          description:
            "<p>Vous êtes organisé, polyvalent, curieux et vous avez le sens du contact.</p><p>Vous avez des connaissances en mécanique, électricité, hydraulique et en informatique, et ou vous avez une première expérience dans la recherche de pièce en automobile ou autre.</p>",
          degrees: {
            degree: {
              _: "Aucun diplôme",
              $: {
                code: "none",
              },
            },
          },
          experienceLevels: {
            experienceLevel: [
              {
                _: "débutant à 1 an",
                $: {
                  code: "beginner",
                },
              },
              {
                _: "1-2 ans",
                $: {
                  code: "one_two",
                },
              },
            ],
          },
        },
      })
    ).toMatchObject({
      //_id: expect.any(ObjectId),
      apply_phone: null,
      created_at: now,
      updated_at: new Date("2025-02-25T02:46:50.131Z"),
      partner_label: "Meteojob",
      partner_job_id: "43954570",
      contract_start: null,
      contract_type: ["Apprentissage", "Professionnalisation"],
      contract_remote: null,
      contract_duration: 12,
      offer_title: "VENDEUR MAGASINIER H/F",
      //offer_description:
      //  "\r\n- Identifier les pièces détachées sur les différents logiciels constructeurs.\r\n- Gérer les appels téléphoniques et les emails pour répondre à chaque demande.- Gérer les commandes et réceptions fournisseurs.- Réaliser les ventes clients au comptoir.- Préparer les commandes clients et techniciens.- Assurer les différents mouvements de stock via notre logiciel.- Gérer les problèmes de retour pièces.- Participer à la bonne tenue du magasin (étiquetage, rangement et nettoyage).Vous êtes emmené à faire une semaine d'école à Nantes par mois.\r\n\r\nSecteur: Recrutement et placement\r\n \r\n \r\n  Poste: Vendeur-magasinier (H/F)\r\n \r\n  Temps plein\r\n\r\n\r\n  Avantages: à partir de 11,88 € par an\r\n\r\n\r\n  Profil: Vous êtes organisé, polyvalent, curieux et vous avez le sens du contact.Vous avez des connaissances en mécanique, électricité, hydraulique et en informatique, et ou vous avez une première expérience dans la recherche de pièce en automobile ou autre.",
      offer_status: "Active",
      offer_target_diploma: null,
      offer_desired_skills: [],
      offer_access_conditions: ["débutant à 1 an", "1-2 ans"],
      offer_to_be_acquired_skills: [],
      offer_rome_codes: undefined,
      offer_creation: new Date("2025-02-25T02:46:50.131Z"),
      offer_expiration: new Date("2025-04-25T02:46:50.131Z"),
      offer_origin: null,
      offer_opening_count: 1,
      offer_multicast: true,
      workplace_siret: null,
      workplace_name: "Iscod",
      workplace_description: "Tralala est une entreprise qui recrute des gens",
      workplace_size: null,
      workplace_website: null,
      workplace_opco: null,
      workplace_naf_label: null,
      workplace_naf_code: null,
      workplace_idcc: null,
      workplace_legal_name: null,
      workplace_brand: null,
      workplace_address_label: "Bruguières (31)",
      workplace_address_zipcode: "31150",
      workplace_address_city: "Bruguières",
      workplace_address_street_label: null,
      workplace_geopoint: {
        type: "Point",
        coordinates: [1.41139, 43.72417],
      },
      apply_url: "https://www.meteojob.com/jobads/43954570?utm_source=labonnealternance&utm_medium=aggregator-free&utm_campaign=alternance",
      errors: [],
      validated: false,
      business_error: JOB_PARTNER_BUSINESS_ERROR.CFA,
      jobs_in_success: [],
    })
  })
})
