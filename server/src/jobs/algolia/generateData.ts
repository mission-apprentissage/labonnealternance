import { IFormationCatalogue } from "shared"
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
}

const jobsProjection: Partial<Record<keyof IJobsPartnersOfferPrivate, 1>> = {
  offer_title: 1,
  offer_description: 1,
  offer_target_diploma: 1,
  workplace_legal_name: 1,
  workplace_address_label: 1,
  workplace_geopoint: 1,
  workplace_naf_label: 1,
  partner_label: 1,
}

const convertFormationNiveauDiplome = (niveau: string) => {
  switch (niveau) {
    case "3 (CAP...)":
      return "Cap, autres formations niveau (Infrabac)"
    case "4 (BAC...)":
      return "BP, Bac, autres formations niveau (Bac)"
    case "5 (BTS, DEUST...)":
      return "BTS, DEUST, autres formations niveaux (Bac+2)"
    case "6 (Licence, BUT...)":
      return "Licence, Maîtrise, autres formations niveau (Bac+3 à Bac+4)"
    case "7 (Master, titre ingénieur...)":
      return "Master, titre ingénieur, autres formations niveau (Bac+5)"
    default:
      return ""
  }
}

const getSubType = (partner_label: string) => {
  switch (partner_label) {
    case "offres_emploi_lba":
      return "offre-labonnealternance"
    case "recruteurs_lba":
      return "candidature-spontannée"
    default:
      return "offre-partenaire"
  }
}

export const fillAlgoliaCollection = async () => {
  await getDbCollection("algolia").deleteMany({})
  const [formations, jobs, recruteur] = await Promise.all([
    getDbCollection("formationcatalogues").find({}, { projection: formationProjection }).toArray(),
    getDbCollection("jobs_partners")
      .find({ partner_label: { $ne: JOBPARTNERS_LABEL.RECRUTEURS_LBA } }, { projection: jobsProjection })
      .toArray(),
    getDbCollection("jobs_partners").find({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }, { projection: jobsProjection }).limit(120_000).toArray(),
  ])

  const payload: IAlgolia[] = []

  // Format formations and push to payload
  formations.forEach((formation) => {
    payload.push({
      _id: formation._id,
      objectID: formation._id.toString(),
      type: "formation",
      sub_type: formation.entierement_a_distance ? "formation-a-distance" : "formation-presentiel",
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
      type: "offre",
      sub_type: getSubType(job.partner_label),
      title: job.offer_title || "",
      description: job.offer_description || "",
      address: job.workplace_address_label || "",
      _geoloc: {
        lat: job.workplace_geopoint.coordinates[1],
        lng: job.workplace_geopoint.coordinates[0],
      },
      organization_name: job.workplace_legal_name || "",
      level: job.offer_target_diploma?.label || "",
      activity_sector: job.workplace_naf_label,
    })
  })
  // Format jobs and push to payload
  recruteur.forEach((job) => {
    payload.push({
      _id: job._id,
      objectID: job._id.toString(),
      type: "offre",
      sub_type: getSubType(job.partner_label),
      title: job.offer_title || "",
      description: job.offer_description || "",
      address: job.workplace_address_label || "",
      _geoloc: {
        lat: job.workplace_geopoint.coordinates[1],
        lng: job.workplace_geopoint.coordinates[0],
      },
      organization_name: job.workplace_legal_name || "",
      level: job.offer_target_diploma?.label || "",
      activity_sector: job.workplace_naf_label,
    })
  })

  await getDbCollection("algolia").insertMany(payload)
}
