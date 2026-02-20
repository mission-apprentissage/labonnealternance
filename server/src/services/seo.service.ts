import { JOB_STATUS_ENGLISH } from "shared"
import jobsPartnersModel, { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import seoVilleModel from "shared/models/seoVille.model"
import seoMetierModel from "shared/models/seoMetier.model"

import { getPartnerJobsCount } from "./jobs/jobOpportunity/jobOpportunity.service"
import { getDbCollection } from "@/common/utils/mongodbUtils.js"
import { asyncForEach } from "@/common/utils/asyncUtils"

const DEFAULT_RADIUS_KM = 30

export const getSeoVille = async ({ ville }: { ville: string }) => {
  const seoVille = await getDbCollection(seoVilleModel.collectionName).findOne({ slug: ville })
  return seoVille
}

export const updateSeoVilleJobCounts = async () => {
  const villes = await getDbCollection(seoVilleModel.collectionName).find({}).toArray()

  for (const ville of villes) {
    const jobCount = await getPartnerJobsCount({
      latitude: ville.geopoint.lat,
      longitude: ville.geopoint.long,
      radius: DEFAULT_RADIUS_KM,
      partnerLabel: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      includePartnerLabel: false,
    })

    const recruteurCount = await getPartnerJobsCount({
      latitude: ville.geopoint.lat,
      longitude: ville.geopoint.long,
      radius: DEFAULT_RADIUS_KM,
      partnerLabel: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      includePartnerLabel: true,
    })

    await getDbCollection(seoVilleModel.collectionName).updateOne(
      { _id: ville._id },
      {
        $set: {
          job_count: jobCount,
          recruteur_count: recruteurCount,
        },
      }
    )
  }
}

export const updateSeoVilleActivities = async () => {
  const villes = await getDbCollection(seoVilleModel.collectionName)
    .find({}, { projection: { _id: 1, slug: 1, geopoint: 1 } })
    .toArray()

  for (const ville of villes) {
    const activities = await getDbCollection(jobsPartnersModel.collectionName)
      .aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [ville.geopoint.long, ville.geopoint.lat] },
            distanceField: "distance",
            maxDistance: DEFAULT_RADIUS_KM * 1000,
            spherical: true,
            query: {
              offer_status: JOB_STATUS_ENGLISH.ACTIVE,
              workplace_naf_label: {
                $ne: null,
              },
            },
          },
        },
        {
          $group: {
            _id: "$workplace_naf_label",
            count: {
              $sum: 1,
            },
            rome_codes: {
              $addToSet: "$offer_rome_codes", // Collects all unique rome_codes
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
        {
          $limit: 5,
        },
        {
          $project: {
            naf_label: "$_id",
            rome_codes: 1,
            _id: 0,
          },
        },
      ])
      .toArray()

    await getDbCollection(seoVilleModel.collectionName).updateOne(
      { _id: ville._id },
      {
        $set: {
          "content.vie.activites": activities.map((activity) => {
            return { naf_label: activity.naf_label, rome_codes: activity.rome_codes.flat() }
          }),
        },
      }
    )
  }
}

export const getSeoMetier = async ({ metier }: { metier: string }) => {
  const seoMetier = await getDbCollection(seoMetierModel.collectionName).findOne({ slug: metier })
  return seoMetier
}

const getJobCountForMetier = async (romes: string[]) => {
  return await getDbCollection("jobs_partners").countDocuments({ offer_rome_codes: { $in: romes }, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
}

const getCompanyCountForMetier = async (romes: string[]) => {
  const companyCountResult = await getDbCollection("jobs_partners")
    .aggregate([
      {
        $match: {
          offer_status: JOB_STATUS_ENGLISH.ACTIVE,
          partner_label: { $ne: JOBPARTNERS_LABEL.RECRUTEURS_LBA },
          offer_rome_codes: { $in: romes },
        },
      },
      {
        $group: {
          _id: "$workplace_siret",
        },
      },
      {
        $count: "distinctSirets",
      },
    ])
    .toArray()

  return companyCountResult[0]?.distinctSirets || 0
}

const getApplicantCountForMetier = async (romes: string[]) => {
  const monthAgo = 3
  const dateThreshold = new Date()
  dateThreshold.setMonth(dateThreshold.getMonth() - monthAgo)
  const applicantCountResult = await getDbCollection("applications")
    .aggregate([
      {
        $match: {
          created_at: { $gte: dateThreshold },
        },
      },
      {
        $lookup: {
          from: "jobs_partners",
          let: { jobId: "$job_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$jobId"] },
                offer_status: JOB_STATUS_ENGLISH.ACTIVE,
                offer_rome_codes: { $in: romes },
              },
            },
            {
              $project: { _id: 1 },
            },
          ],
          as: "job",
        },
      },
      {
        $match: {
          "job.0": { $exists: true },
        },
      },
      {
        $group: {
          _id: "$applicant_id",
        },
      },
      {
        $count: "distinctApplicants",
      },
    ])
    .toArray()

  return applicantCountResult[0]?.distinctApplicants || 0
}

const getTopCompaniesForMetier = async (romes: string[]) => {
  const topLimit = 6

  const topCompanies = await getDbCollection("jobs_partners")
    .aggregate([
      // 1. Filtrer par statut Active et codes ROME
      {
        $match: {
          offer_status: JOB_STATUS_ENGLISH.ACTIVE,
          offer_rome_codes: { $in: romes },
        },
      },
      // 2. Grouper par SIRET
      {
        $group: {
          _id: "$workplace_siret",
          workplace_legal_name: { $first: "$workplace_legal_name" },
          workplace_brand: { $first: "$workplace_brand" },
          workplace_name: { $first: "$workplace_name" },
          count: { $sum: 1 },
        },
      },
      // 3. Trier par count décroissant
      {
        $sort: { count: -1 },
      },
      // 4. Limiter à topLimit
      {
        $limit: topLimit,
      },

      // 5. Formatter le résultat
      {
        $project: {
          _id: 0,
          workplace_siret: "$_id",
          workplace_legal_name: 1,
          workplace_brand: 1,
          workplace_name: 1,
          count: 1,
        },
      },
    ])
    .toArray()

  return topCompanies.map((company) => ({
    nom: company.workplace_name || company.workplace_brand || company.workplace_legal_name || "Entreprise inconnue",
    job_count: company.count,
  }))
}

const cities = [
  { name: "Paris", lat: 48.8566, long: 2.3522 },
  { name: "Marseille", lat: 43.2965, long: 5.3698 },
  { name: "Lyon", lat: 45.764, long: 4.8357 },
  { name: "Toulouse", lat: 43.6047, long: 1.4442 },
  { name: "Nice", lat: 43.7102, long: 7.262 },
  { name: "Lille", lat: 50.6292, long: 3.0573 },
  { name: "Nantes", lat: 47.2184, long: -1.5536 },
  { name: "Bordeaux", lat: 44.8378, long: -0.5792 },
  { name: "Strasbourg", lat: 48.5734, long: 7.7521 },
  { name: "Montpellier", lat: 43.6108, long: 3.8767 },
  { name: "Rennes", lat: 48.1173, long: -1.6778 },
  { name: "Reims", lat: 49.2583, long: 4.0317 },
  { name: "Le Havre", lat: 49.4944, long: 0.1079 },
  { name: "Saint-Étienne", lat: 45.4397, long: 4.3872 },
  { name: "Grenoble", lat: 45.1885, long: 5.7245 },
  { name: "Aix-en-Provence", lat: 43.5297, long: 5.4474 },
  { name: "Angers", lat: 47.4784, long: -0.5632 },
  { name: "Tours", lat: 47.3941, long: 0.6848 },
  { name: "Metz", lat: 49.1193, long: 6.1757 },
  { name: "Clermont-Ferrand", lat: 45.7772, long: 3.087 },
]

const getTopCitiesForMetier = async (romes: string[]) => {
  const topLimit = 6
  const radius = 30_000

  const cityCounts = await Promise.all(
    cities.map(async (city) => {
      const count = await getDbCollection("jobs_partners")
        .aggregate([
          {
            $geoNear: {
              near: { type: "Point", coordinates: [city.long, city.lat] },
              distanceField: "distance",
              key: "workplace_geopoint",
              maxDistance: radius,
              query: {
                offer_status: JOB_STATUS_ENGLISH.ACTIVE,
                offer_rome_codes: { $in: romes },
              },
            },
          },
          {
            $group: {
              _id: "$_id",
            },
          },
          {
            $count: "distinctJobs",
          },
        ])
        .toArray()

      return {
        nom: city.name,
        job_count: count[0]?.distinctJobs || 0,
        geopoint: { lat: city.lat, long: city.long },
      }
    })
  )

  return cityCounts.sort((a, b) => b.job_count - a.job_count).slice(0, topLimit)
}

const getFormationsForMetier = async (romes: string[]) => {
  const diplomes = await getDbCollection("formationcatalogues")
    .aggregate([
      {
        $match: { rome_codes: { $in: romes } },
      },
      {
        $group: {
          _id: "$diplome",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $project: {
          _id: 0,
          diplome: "$_id",
          count: 1,
        },
      },
    ])
    .toArray()

  return diplomes.map((diplome) => ({
    title: diplome.diplome,
    description: "",
    duree: "",
    niveau: "",
    count: diplome.count,
    competences: [],
  }))
}

export const updateSeoMetierJobCounts = async () => {
  const metiers = await getDbCollection(seoMetierModel.collectionName).find({}).toArray()

  await asyncForEach(metiers, async (metier) => {
    const jobCount = await getJobCountForMetier(metier.romes)
    const companyCount = await getCompanyCountForMetier(metier.romes)
    const applicantCount = await getApplicantCountForMetier(metier.romes)

    const entreprises = await getTopCompaniesForMetier(metier.romes)
    const villes = await getTopCitiesForMetier(metier.romes)
    const formations = await getFormationsForMetier(metier.romes)

    // build cards: [], TODO dans un ticket à venir

    await getDbCollection(seoMetierModel.collectionName).updateOne(
      { slug: metier.slug },
      { $set: { job_count: jobCount, company_count: companyCount, applicant_count: applicantCount, entreprises, formations, villes, cards: [] } }
    )
  })
}
