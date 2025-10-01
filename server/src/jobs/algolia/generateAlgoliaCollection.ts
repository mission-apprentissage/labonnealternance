import { IFormationCatalogue, JOB_STATUS_ENGLISH } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { IAlgolia } from "shared/models/algolia.model"
import { IJobsPartnersOfferPrivate, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

const formationProjection: Partial<Record<keyof IFormationCatalogue, 1>> = {
  intitule_rco: 1,
  contenu: 1,
  niveau: 1,
  lieu_formation_geopoint: 1,
  lieu_formation_adresse: 1,
  code_postal: 1,
  localite: 1,
  etablissement_formateur_entreprise_raison_sociale: 1,
  entierement_a_distance: 1,
  cle_ministere_educatif: 1,
}

const jobsProjection: Partial<Record<keyof IJobsPartnersOfferPrivate, 1>> = {
  offer_title: 1,
  offer_description: 1,
  offer_target_diploma: 1,
  offer_creation: 1,

  workplace_legal_name: 1,
  workplace_address_label: 1,
  workplace_geopoint: 1,
  workplace_naf_label: 1,
  workplace_siret: 1,
  workplace_brand: 1,
  workplace_name: 1,

  partner_label: 1,
  apply_email: 1,
  is_delegated: 1,
  contract_type: 1,
}

const convertFormationNiveauDiplome = (niveau: string) => {
  switch (niveau) {
    case "3 (CAP...)":
      return "Cap, autres formations (Infrabac)"
    case "4 (BAC...)":
      return "BP, Bac, autres formations (Bac)"
    case "5 (BTS, DEUST...)":
      return "BTS, DEUST, autres formations (Bac+2)"
    case "6 (Licence, BUT...)":
      return "Licence, Maîtrise, autres formations (Bac+3 à Bac+4)"
    case "7 (Master, titre ingénieur...)":
      return "Master, titre ingénieur, autres formations (Bac+5)"
    default:
      return "Indifférent"
  }
}

const getTypeFilterLabel = (partner_label: string, fromCfa?: boolean) => {
  if (fromCfa) return "Offres d'emploi postées par des écoles"
  switch (partner_label) {
    case "offres_emploi_lba":
      return "Offres d'emploi La bonne alternance"
    case "recruteurs_lba":
      return "Candidatures spontannées"
    default:
      return "Offres d'emploi partenaires"
  }
}

const getJobType = (partner_label: string) => {
  switch (partner_label) {
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
      return LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
    case LBA_ITEM_TYPE.RECRUTEURS_LBA:
      return LBA_ITEM_TYPE.RECRUTEURS_LBA
    default:
      return LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES
  }
}

export const fillAlgoliaCollection = async () => {
  await getDbCollection("algolia").deleteMany({})
  const [formations, jobs, recruteur] = await Promise.all([
    getDbCollection("formationcatalogues").find({}, { projection: formationProjection }).toArray(),
    getDbCollection("jobs_partners")
      .aggregate([
        {
          $match: {
            partner_label: { $ne: JOBPARTNERS_LABEL.RECRUTEURS_LBA },
            offer_status: JOB_STATUS_ENGLISH.ACTIVE,
          },
        },
        {
          $lookup: {
            from: "applications",
            let: { jobIdStr: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$job_id", "$$jobIdStr"] },
                },
              },
            ],
            as: "applications",
          },
        },
        {
          $addFields: {
            application_count: { $size: "$applications" },
          },
        },
        {
          $project: {
            ...jobsProjection,
            application_count: 1,
          },
        },
      ])
      .limit(100_000)
      .toArray(),
    getDbCollection("jobs_partners")
      .aggregate([
        {
          $match: {
            partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
          },
        },
        {
          $lookup: {
            from: "applications",
            localField: "workplace_siret",
            foreignField: "company_siret",
            as: "applications",
          },
        },
        {
          $addFields: {
            application_count: { $size: "$applications" },
          },
        },
        {
          $project: {
            ...jobsProjection,
            application_count: 1,
          },
        },
      ])
      .limit(80_000)
      .toArray(),
  ])

  const payload: IAlgolia[] = []

  // Format formations and push to payload
  formations.forEach((formation) => {
    payload.push({
      _id: formation._id,
      objectID: formation._id.toString(),
      url_id: formation.cle_ministere_educatif,
      type: "formation",
      type_filter_label: formation.entierement_a_distance ? "Formation à distance" : "Formation en présentiel",
      sub_type: LBA_ITEM_TYPE.FORMATION,
      contract_type: null,
      publication_date: null,
      smart_apply: null,
      application_count: null,
      title: formation.intitule_rco || "",
      description: formation.contenu || "",
      address: `${formation.lieu_formation_adresse} ${formation.code_postal} ${formation.localite}` || "",
      _geoloc: {
        lat: formation.lieu_formation_geopoint!.coordinates[1],
        lng: formation.lieu_formation_geopoint!.coordinates[0],
      },
      organization_name: formation.etablissement_formateur_entreprise_raison_sociale || "",
      level: convertFormationNiveauDiplome(formation.niveau || ""),
      activity_sector: null,
    })
  })

  // Format jobs and push to payload
  jobs.forEach((job) => {
    payload.push({
      _id: job._id,
      objectID: job._id.toString(),
      url_id: job._id.toString(),
      type: "offre",
      type_filter_label: getTypeFilterLabel(job.partner_label, job.is_delegated),
      sub_type: getJobType(job.partner_label),
      contract_type: job.contract_type,
      publication_date: job.offer_creation?.getTime() || null,
      smart_apply: job.apply_email ? "Oui" : "Non",
      application_count: job.application_count,
      title: job.offer_title || "",
      description: job.offer_description || "",
      address: job.workplace_address_label || "",
      _geoloc: {
        lat: job.workplace_geopoint.coordinates[1],
        lng: job.workplace_geopoint.coordinates[0],
      },
      organization_name: job.workplace_name || job.workplace_brand || job.workplace_legal_name || "",
      level: job.offer_target_diploma?.label || "",
      activity_sector: job.workplace_naf_label,
    })
  })
  // Format jobs and push to payload
  recruteur.forEach((job) => {
    payload.push({
      _id: job._id,
      objectID: job._id.toString(),
      url_id: job.workplace_siret,
      type: "offre",
      type_filter_label: getTypeFilterLabel(job.partner_label),
      sub_type: getJobType(job.partner_label),
      contract_type: ["Apprentissage", "Professionnalisation"],
      publication_date: job.offer_creation?.getTime() || null,
      smart_apply: job.apply_email ? "Oui" : "Non",
      application_count: job.application_count,
      title: job.offer_title || "",
      description: job.offer_description || "",
      address: job.workplace_address_label || "",
      _geoloc: {
        lat: job.workplace_geopoint.coordinates[1],
        lng: job.workplace_geopoint.coordinates[0],
      },
      organization_name: job.workplace_name || job.workplace_brand || job.workplace_legal_name || "",
      level: job.offer_target_diploma?.label || "",
      activity_sector: job.workplace_naf_label,
    })
  })

  await getDbCollection("algolia").insertMany(payload)
}
