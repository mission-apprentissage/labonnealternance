import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { type IEntreprise, type IReferentielRome, JOB_STATUS_ENGLISH } from "shared"
import { generateCfaFixture } from "shared/fixtures/cfa.fixture"
import { generateEntrepriseFixture } from "shared/fixtures/entreprise.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import dayjs from "shared/helpers/dayjs"
import type { ICFA } from "shared/models/cfa.model"
import { type IJobsPartnersOfferPrivate, JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { exportJobsToFranceTravail, getJobsToExport, offerToFTOffer } from "@/jobs/partenaire-export/export-to-france-travail"

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

  it("should override Par_cle and Par_nom when override is provided", () => {
    const romeAppellation = "Assistant / Assistante de gestion en ressources humaines"
    const referentielRome: IReferentielRome = generateReferentielRome({
      appellations: [{ code_ogr: "11235", libelle: romeAppellation, libelle_court: romeAppellation }],
    })
    const geopoint = { type: "Point", coordinates: [1.45264, 43.643652] } as IJobsPartnersOfferPrivate["workplace_geopoint"]
    const entreprise: IEntreprise = generateEntrepriseFixture({ geo_coordinates: `${geopoint.coordinates[1]},${geopoint.coordinates[0]}` })
    const cfa: ICFA = generateCfaFixture()
    const job = generateJobsPartnersOfferPrivate({
      offer_rome_appellation: romeAppellation,
      offer_rome_codes: ["M1501"],
      workplace_geopoint: geopoint,
      is_delegated: true,
      cfa_siret: cfa.siret,
      cfa_legal_name: cfa.raison_sociale,
      workplace_siret: entreprise.siret,
    })

    const result = offerToFTOffer({ ...job, referentielRome, entreprise, cfa }, { Par_cle: "LABONNEALTERNANCE_CONFIEE", Par_nom: "LABONNEALTERNANCE_CONFIEE" })

    expect(result?.Par_cle).toBe("LABONNEALTERNANCE_CONFIEE")
    expect(result?.Par_nom).toBe("LABONNEALTERNANCE_CONFIEE")
  })

  it("should truncate Description to 450 chars for the confiée feed", () => {
    const romeAppellation = "Assistant / Assistante de gestion en ressources humaines"
    const referentielRome: IReferentielRome = generateReferentielRome({
      appellations: [{ code_ogr: "11235", libelle: romeAppellation, libelle_court: romeAppellation }],
    })
    const geopoint = { type: "Point", coordinates: [1.45264, 43.643652] } as IJobsPartnersOfferPrivate["workplace_geopoint"]
    const entreprise: IEntreprise = generateEntrepriseFixture({ geo_coordinates: `${geopoint.coordinates[1]},${geopoint.coordinates[0]}` })
    const cfa: ICFA = generateCfaFixture()
    const longDescription = "a".repeat(600)
    const job = generateJobsPartnersOfferPrivate({
      offer_rome_appellation: romeAppellation,
      offer_rome_codes: ["M1501"],
      workplace_geopoint: geopoint,
      is_delegated: true,
      cfa_siret: cfa.siret,
      cfa_legal_name: cfa.raison_sociale,
      workplace_siret: entreprise.siret,
      offer_description: longDescription,
    })

    const ftOffer = offerToFTOffer({ ...job, referentielRome, entreprise, cfa }, { Par_cle: "LABONNEALTERNANCE_CONFIEE", Par_nom: "LABONNEALTERNANCE_CONFIEE" })
    const truncated = ftOffer?.Description?.slice(0, 450)

    expect(truncated).toHaveLength(450)
    expect(truncated).toBe(`Offre collectée par La bonne alternance : ${longDescription}`.slice(0, 450))
  })
})

describe("getJobsToExport", () => {
  useMongo()

  const insertExportableJob = async (overrides: Partial<IJobsPartnersOfferPrivate> = {}) => {
    const entreprise = generateEntrepriseFixture({})
    const referentielRome = generateReferentielRome({})
    // Les fixtures entreprise et rome portent des identifiants fixes (siret, code_rome) :
    // upsert pour permettre plusieurs offres partageant la même entreprise et le même ROME sans dupliquer les jointures.
    await getDbCollection("entreprises").updateOne({ siret: entreprise.siret }, { $setOnInsert: entreprise }, { upsert: true })
    await getDbCollection("referentielromes").updateOne({ "rome.code_rome": referentielRome.rome.code_rome }, { $setOnInsert: referentielRome }, { upsert: true })
    const job = generateJobsPartnersOfferPrivate({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      updated_at: new Date(),
      offer_target_diploma: { european: "3", label: "CAP" },
      offer_rome_codes: [referentielRome.rome.code_rome],
      workplace_siret: entreprise.siret,
      ...overrides,
    })
    await getDbCollection("jobs_partners").insertOne(job)
    return { job, referentielRome }
  }

  it("retourne les offres exportables avec le champ referentielRome peuplé par la jointure", async () => {
    const { job, referentielRome } = await insertExportableJob()

    const jobs = await getJobsToExport()

    // Garde-fou de régression : un décalage entre le `as` du $lookup et le champ du $unwind
    // (ex. "referentiel-rome" vs "$referentielRome") fait renvoyer 0 document à l'agrégation.
    expect(jobs).toHaveLength(1)
    expect(jobs[0]._id.toString()).toBe(job._id.toString())
    expect(jobs[0].referentielRome.rome.code_rome).toBe(referentielRome.rome.code_rome)
  })

  it("exclut une offre dont le code ROME n'a pas d'entrée dans le référentiel", async () => {
    const { job } = await insertExportableJob()
    await getDbCollection("jobs_partners").insertOne(
      generateJobsPartnersOfferPrivate({
        partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
        offer_status: JOB_STATUS_ENGLISH.ACTIVE,
        updated_at: new Date(),
        offer_target_diploma: { european: "3", label: "CAP" },
        offer_rome_codes: ["Z9999"],
        workplace_siret: job.workplace_siret,
      })
    )

    const jobs = await getJobsToExport()

    expect(jobs).toHaveLength(1)
    expect(jobs[0]._id.toString()).toBe(job._id.toString())
  })

  it("sépare le flux principal du flux confiée via ft_support", async () => {
    const { job } = await insertExportableJob()
    const { job: jobConfiee } = await insertExportableJob({
      ft_support: true,
      offer_expiration: dayjs().add(30, "days").toDate(),
    })

    const jobs = await getJobsToExport()
    const jobsConfiee = await getJobsToExport({ ftSupport: true })

    expect(jobs.map((j) => j._id.toString())).toEqual([job._id.toString()])
    expect(jobsConfiee.map((j) => j._id.toString())).toEqual([jobConfiee._id.toString()])
  })

  it("fait échouer le job (rejet) quand le flux principal est vide, pour que le run soit marqué errored", async () => {
    await expect(exportJobsToFranceTravail()).rejects.toThrow("Aucune offre à exporter")
  })
})
