import { ObjectId } from "mongodb"
import type { IEntreprise, IReferentielRome } from "shared"
import { generateCfaFixture } from "shared/fixtures/cfa.fixture"
import { generateEntrepriseFixture } from "shared/fixtures/entreprise.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import type { ICFA } from "shared/models/cfa.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { describe, expect, it } from "vitest"
import { offerToFTOffer } from "@/jobs/partenaireExport/exportToFranceTravail"

describe("offerToFTOffer", () => {
  it("should convert a job to an exported offer for FT", async () => {
    const romeAppellation = "Assistant / Assistante de gestion en ressources humaines"
    const referentielRome: IReferentielRome = generateReferentielRome({
      appellations: [
        {
          code_ogr: "11235",
          libelle: romeAppellation,
          libelle_court: romeAppellation,
        },
      ],
    })
    const addressLabel = "8 RUE FRANCOISE D'EAUBONNE 31200 TOULOUSE"
    const geopoint = {
      type: "Point",
      coordinates: [1.45264, 43.643652],
    } as IJobsPartnersOfferPrivate["workplace_geopoint"]
    const entreprise: IEntreprise = generateEntrepriseFixture({
      geo_coordinates: `${geopoint.coordinates[1]},${geopoint.coordinates[0]}`,
    })
    const cfa: ICFA = generateCfaFixture()
    const job = generateJobsPartnersOfferPrivate({
      _id: new ObjectId("68511e2a21cc165dc45d3c35"),
      offer_rome_appellation: romeAppellation,
      offer_rome_codes: ["M1501"],
      workplace_naf_code: "85.32Z",
      workplace_naf_label: "Enseignement secondaire technique ou professionnel",
      created_at: new Date("2025-06-17T18:07:58.932+00:00"),
      updated_at: new Date("2025-08-18T18:07:58.932+00:00"),
      contract_duration: 24,
      contract_start: new Date("2025-09-01T18:07:58.932+00:00"),
      offer_opening_count: 5,
      workplace_geopoint: geopoint,
      is_delegated: true,
      cfa_siret: cfa.siret,
      cfa_legal_name: cfa.raison_sociale,
      workplace_siret: entreprise.siret,
      workplace_name: "entreprise cachée",
      workplace_address_label: addressLabel,
      offer_description:
        "L'Assistant Ressources Humaines (RH) assiste les responsables et optimise les processus de gestion administrative et opérationnelle des ressources humaines au sein d'une entreprise ou d'une organisation. Réalise le suivi administratif de la gestion du personnel (contrats, absences, visites médicales, déclarations aux organismes sociaux, etc.) Participe au processus de recrutement, de la publication des offres d'emploi à l'intégration des nouveaux employés Met en place le plan de formation professionnelle continue et en assure le suivi Assure la coordination et le soutien administratif des relations entre l'employeur et les instances représentatives du personnel Répond aux questions des salariés concernant les différents aspects liés aux ressources humaines Peut collecter et vérifier les informations nécessaires à l'élaboration des bulletins de salaire et effectuer le suivi des opérations de paie en lien avec le service comptabilité",
    })

    expect
      .soft(
        offerToFTOffer({
          ...job,
          referentielRome,
          entreprise,
          cfa,
        })
      )
      .toMatchSnapshot()
  })
})
