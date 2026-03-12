import omit from "lodash-es/omit"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { helloWorkBuddiJobToJobsPartners } from "./helloWorkBuddiMapper"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("helloWorkJobToJobsPartners", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)

    return () => {
      vi.useRealTimers()
    }
  })

  it("should convert a hellowork job to a partner_label job", () => {
    expect(
      omit(
        helloWorkBuddiJobToJobsPartners({
          job_id: "104010052",
          agence: null,
          reference: "3747976/27722448AQPDR/59M",
          cpc: "0,17",
          title: "ALTERNANCE - Équipier·ère Polyvalent·e de Restauration",
          url: "https://r.holeest.com/redirect?poc=2&op=11268409219&o=0&from=https%3A%2F%2Fwww.hw-recruteur.com%2Foffer%2Fjoboffer%2Foffre-82788-F1vycE",
          description:
            "Pour un restaurant partenaire spécialisé dans la restauration rapide de burgers, IDMN recrute un·e Équipier·ère Polyvalent·e de Restauration en alternance.\r\n\r\nLes missions du poste\r\n\r\n- Accueillir, servir et conseiller les clients\r\n- Participer à la préparation des burgers et des accompagnements selon les standards de l'établissement\r\n- Assurer la cuisson, l'assemblage et l'emballage des produits\r\n- Gérer la mise en place et le réassort des postes de travail\r\n- Participer à l'encaissement et au service en salle\r\n- Garantir la propreté du comptoir, de la salle et des espaces communs\r\n- Respecter strictement les règles d'hygiène, de sécurité et de qualité&nbsp;\r\nTu veux apprendre un vrai métier et découvrir le fonctionnement d'un grand restaurant de burgers ?\r\nRejoins l'IDMN et deviens Équipier·ère Polyvalent·e de Restauration en alternance !\r\nSe former en alternance\r\n\r\n- 1 jour en formation, 4 jours en entreprise\r\n- Entrées possibles toute l'année\r\n- Une montée en compétences rapide grâce à la pratique\r\n- La possibilité de décrocher un diplôme tout en étant rémunéré(e)\r\n\r\nDans notre centre, tu es accompagné(e), formé(e) et préparé(e) pour réussir dans le secteur du commerce et du service.",
          profile:
            "- Tu souhaites préparer un CAP en alternance\r\n- Dynamique, motivé·e et impliqué·e\r\n- À l'aise avec le contact client et le travail en équipe\r\n- Rigoureux·se, réactif·ve et prêt·e à suivre des process précis\r\n- Une première expérience en restauration serait un plus\r\nAvec l'IDMN, tu ne fais pas qu'obtenir un diplôme : tu deviens un futur professionnel, accompagné pas à pas vers la réussite.",
          benefits: null,
          apply_mail: "apply.82788-F1vycE.bonnealternance@apply-talentdetection.com",
          salary: "710,00 - 1 823,00 EUR",
          salary_details: {
            salary_max: {
              amount: "1823,00",
              currencyCode: "EUR",
            },
            salary_min: {
              amount: "710,00",
              currencyCode: "EUR",
            },
            period: "MONTHLY",
          },
          address: null,
          city: "La Chapelle-d'Armentières",
          geoloc: null,
          region: null,
          department: null,
          postal_code: "59930",
          country: "France",
          publication_date: "2026-01-15 08:54:45",
          updated_date: "2026-02-24 20:42:26",
          contract: "Alternance",
          contract_start_date: null,
          contract_end_date: null,
          contract_period_value: null,
          contract_period_unit: null,
          qualification: "BEP/CAP",
          experience: "- 1 an",
          function: "Restauration/Tourisme/Hôtellerie/Loisirs",
          code_rome: null,
          ogr_id: null,
          job_time: "Full time",
          education: "BEP/CAP",
          language: null,
          remote: null,
          sector: "Restauration",
          company_title: "Institut des Métiers Network - Lille",
          company_description:
            "Nous sommes spécialisé dans la formation par apprentissage sur des titres professionnels diplômants du Ministère du travail de niveau III, Niveau V (CAP, Bac, Bac +2) et NIVEAU VI (RM2C Bachelor) dans les domaines de la vente, Management, Commerce, Assistanat commercial et Restauration.",
          logo: "https://f.hellowork.com/holeest/logo/15-TalentDetection-v-1.png",
          company_logo: "https://f.hellowork.com/img/entreprises/137096.png",
          siret: "81272495300029",
          naf_code: "8559A",
          company_sector: "Restauration",
          csr_label: null,
          guid: null,
        }),
        ["_id"]
      )
    ).toMatchSnapshot()
  })
})
