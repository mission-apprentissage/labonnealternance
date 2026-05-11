import { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared"
import jobsPartnersModel, { type IJobsPartnersOfferPrivateWithDistance, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import seoDiplomeModel, { type IDiplomeEcoleCard } from "shared/models/seoDiplome.model"
import seoMetierModel, { SEO_METIER_FORMATION_DESCRIPTIONS, SEO_METIER_FORMATION_TITRES } from "shared/models/seoMetier.model"
import seoVilleModel from "shared/models/seoVille.model"
import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils.js"
import { metierData } from "@/jobs/seo/dataMetierSEO"
import { getApplicationByCompanyCount, getApplicationByJobCount } from "@/services/application.service"
import { getJobsPartnersFromDBForUI, getPartnerJobsCount } from "./jobs/jobOpportunity/jobOpportunity.service"

const DEFAULT_RADIUS_KM = 30

export const getSeoVille = async ({ ville }: { ville: string }) => {
  const seoVille = await getDbCollection(seoVilleModel.collectionName).findOne({ slug: ville })
  return seoVille
}

export const updateSeoVilleJobCounts = async () => {
  logger.info("starting job updateSeoVilleJobCounts")
  const villes = await getDbCollection(seoVilleModel.collectionName).find({}).toArray()

  for (const ville of villes) {
    const [jobCount, recruteurCount] = await Promise.all([
      getPartnerJobsCount({
        latitude: ville.geopoint.lat,
        longitude: ville.geopoint.long,
        radius: DEFAULT_RADIUS_KM,
        partnerLabel: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
        includePartnerLabel: false,
      }),
      getPartnerJobsCount({
        latitude: ville.geopoint.lat,
        longitude: ville.geopoint.long,
        radius: DEFAULT_RADIUS_KM,
        partnerLabel: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
        includePartnerLabel: true,
      }),
    ])

    const cards = await getJobsForVille({
      latitude: ville.geopoint.lat,
      longitude: ville.geopoint.long,
      radius: DEFAULT_RADIUS_KM,
    })

    await getDbCollection(seoVilleModel.collectionName).updateOne(
      { _id: ville._id },
      {
        $set: {
          job_count: jobCount,
          recruteur_count: recruteurCount,
          cards,
        },
      }
    )
  }
}

export const updateSeoVilleActivities = async () => {
  logger.info("starting job updateSeoVilleActivities")
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
            key: "workplace_geopoint",
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

export const getSeoDiplome = async ({ diplome }: { diplome: string }) => {
  const seoDiplome = await getDbCollection(seoDiplomeModel.collectionName).findOne({ slug: diplome })
  return seoDiplome
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

  const applicantCountResult = await getDbCollection("jobs_partners")
    .aggregate([
      { $match: { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_rome_codes: { $in: romes } } },
      {
        $lookup: {
          from: "applications",
          localField: "_id",
          foreignField: "job_id",
          pipeline: [{ $match: { created_at: { $gte: dateThreshold } } }, { $project: { applicant_id: 1 } }],
          as: "apps",
        },
      },
      { $unwind: "$apps" },
      { $group: { _id: "$apps.applicant_id" } },
      { $count: "distinctApplicants" },
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

  const cityCounts: { nom: string; job_count: number; geopoint: { lat: number; long: number } }[] = await Promise.all(
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
                $or: [{ offer_expiration: null }, { offer_expiration: { $gt: new Date() } }],
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
  const niveaux = await getDbCollection("formationcatalogues")
    .aggregate([
      {
        $match: { rome_codes: { $in: romes } },
      },
      {
        $group: {
          _id: "$niveau",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $project: {
          _id: 0,
          niveau: "$_id",
          count: 1,
        },
      },
    ])
    .toArray()

  return niveaux
    .map((niveau) =>
      SEO_METIER_FORMATION_TITRES[niveau.niveau] !== undefined
        ? {
            title: SEO_METIER_FORMATION_TITRES[niveau.niveau] || "Autres formations",
            description: SEO_METIER_FORMATION_DESCRIPTIONS[niveau.niveau] || "",
            niveau: niveau.niveau,
            count: niveau.count,
          }
        : null
    )
    .filter((formation) => formation !== null)
    .sort((a, b) => parseInt(a.niveau) - parseInt(b.niveau))
}

const getJobPartnerDataForSeo = (jobPartner: IJobsPartnersOfferPrivateWithDistance) => {
  return {
    _id: jobPartner._id,
    partner_label: jobPartner.partner_label,
    partner_job_id: jobPartner.partner_job_id,
    offer_title: jobPartner.offer_title,
    workplace_naf_label: jobPartner.workplace_naf_label || null,
    workplace_name: jobPartner.workplace_name || jobPartner.workplace_legal_name || jobPartner.workplace_brand || null,
    workplace_address_city: jobPartner.workplace_address_city || null,
    workplace_address_zipcode: jobPartner.workplace_address_zipcode || null,
    application_count: 0,
    lba_url: jobPartner.lba_url || null,
    offer_creation: jobPartner.offer_creation || null,
  }
}

const getJobCards = async (params: { geo: { latitude: number; longitude: number; radius: number } | null; romes: string[] | null; rncp: null; opco: null }) => {
  const lbaJobs = await getJobsPartnersFromDBForUI({ ...params, force_partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA })
  const jobsForSeo = lbaJobs.slice(0, 6).map((job) => getJobPartnerDataForSeo(job))

  const lbaCompanies = await getJobsPartnersFromDBForUI({ ...params, force_partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA })
  jobsForSeo.push(...lbaCompanies.slice(0, 6).map((job) => getJobPartnerDataForSeo(job)))

  const partnerJobs = await getJobsPartnersFromDBForUI({ ...params, partners_to_exclude: [JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, JOBPARTNERS_LABEL.RECRUTEURS_LBA] })
  jobsForSeo.push(...partnerJobs.slice(0, 12 - jobsForSeo.length).map((job) => getJobPartnerDataForSeo(job)))

  const ids = jobsForSeo.flatMap((job) => (job.partner_label !== JOBPARTNERS_LABEL.RECRUTEURS_LBA ? [job._id] : []))
  const applicationCountByJob = await getApplicationByJobCount(ids)
  if (applicationCountByJob !== null) {
    applicationCountByJob.forEach((appCount) => {
      const job = jobsForSeo.find((j) => j._id.toString() === appCount._id)
      if (job) {
        job.application_count = appCount.count
      }
    })
  }

  const sirets = jobsForSeo.flatMap((job) => (job.partner_label === JOBPARTNERS_LABEL.RECRUTEURS_LBA ? [job.partner_job_id] : []))
  const applicationCountByCompany = await getApplicationByCompanyCount(sirets)
  if (applicationCountByCompany !== null) {
    applicationCountByCompany.forEach((appCount) => {
      const job = jobsForSeo.find((j) => j.partner_job_id === appCount._id)
      if (job) {
        job.application_count = appCount.count
      }
    })
  }

  return jobsForSeo
}

const getJobsForVille = async ({ radius, latitude, longitude }: { radius: number; latitude: number; longitude: number }) => {
  const params = {
    geo: { latitude, longitude, radius },
    romes: null,
    rncp: null,
    opco: null,
  }

  return await getJobCards(params)
}

const getJobsForMetier = async (romes: string[]) => {
  const params = {
    geo: null,
    romes: romes,
    rncp: null,
    opco: null,
  }

  return await getJobCards(params)
}

const getMetiersAfterRestoringDefaultMetiers = async () => {
  const now = new Date()
  await getDbCollection(seoMetierModel.collectionName).insertMany(
    metierData.map((metier) => ({ ...metier, _id: new ObjectId(), created_at: now, updated_at: now })),
    { ordered: false, bypassDocumentValidation: true }
  )
  return await getDbCollection(seoMetierModel.collectionName).find({}).toArray()
}

export const updateSeoMetierJobCounts = async () => {
  logger.info("starting job updateSeoMetierJobCounts")
  let metiers = await getDbCollection(seoMetierModel.collectionName).find({}).toArray()

  if (metiers.length === 0) {
    logger.warn("No metiers found in the database for updateSeoMetierJobCounts. Restoring default metiers.")
    metiers = await getMetiersAfterRestoringDefaultMetiers()
  }

  await asyncForEach(metiers, async (metier) => {
    logger.info(`updating SEO job counts for metier: ${metier.slug}`)

    try {
      const [jobCount, companyCount, applicantCount, entreprises, villes, formations, cards] = await Promise.all([
        getJobCountForMetier(metier.romes),
        getCompanyCountForMetier(metier.romes),
        getApplicantCountForMetier(metier.romes),
        getTopCompaniesForMetier(metier.romes),
        getTopCitiesForMetier(metier.romes),
        getFormationsForMetier(metier.romes),
        getJobsForMetier(metier.romes),
      ])

      await getDbCollection(seoMetierModel.collectionName).updateOne(
        { slug: metier.slug },
        { $set: { job_count: jobCount, company_count: companyCount, applicant_count: applicantCount, entreprises, formations, villes, cards } }
      )
    } catch (error) {
      logger.error("Error in updateSeoMetierJobCounts for metier " + metier.slug, error)
    }
  })

  logger.info("ended job updateSeoMetierJobCounts")
}

export const updateSeoDiplome = async () => {
  logger.info("starting job updateSeoDiplome")
  const diplomes = await getDbCollection(seoDiplomeModel.collectionName).find({}).toArray()

  if (diplomes.length === 0) {
    logger.warn("No diplomes found in the database for updateSeoDiplome.")
    return
  }

  await asyncForEach(diplomes, async (diplome) => {
    logger.info(`updating SEO data for diplome: ${diplome.slug}`)
    try {
      const entreprisesCount = await getCompanyCountForMetier(diplome.romes)
      const jobCount = await getJobCountForMetier(diplome.romes)
      const ecoles = (await getDbCollection("formationcatalogues")
        .aggregate([
          {
            $match: {
              intitule_long: { $regex: diplome.intituleLongFormation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
              catalogue_published: true,
            },
          },
          { $sample: { size: 9 } },
          {
            $project: {
              _id: 0,
              formationTitle: "$intitule_long",
              etablissement: "$etablissement_formateur_entreprise_raison_sociale",
              formationClefMinistereEducatif: "$cle_ministere_educatif",
              lieu: {
                $concat: [{ $ifNull: ["$etablissement_formateur_code_postal", ""] }, " ", { $ifNull: ["$etablissement_formateur_localite", ""] }],
              },
            },
          },
        ])
        .toArray()) as IDiplomeEcoleCard[]

      const metiersListe = await getDbCollection(jobsPartnersModel.collectionName)
        .aggregate([
          {
            $match: {
              offer_rome_codes: { $in: diplome.romes },
              offer_status: JOB_STATUS_ENGLISH.ACTIVE,
              partner_label: { $ne: JOBPARTNERS_LABEL.RECRUTEURS_LBA },
            },
          },
          { $group: { _id: "$offer_title", offres: { $sum: 1 } } },
          { $sort: { offres: -1 } },
          { $limit: 10 },
          { $project: { _id: 0, title: "$_id", offres: 1 } },
        ])
        .toArray()

      const cards = await getJobsForMetier(diplome.romes)

      await getDbCollection(seoDiplomeModel.collectionName).updateOne(
        { _id: diplome._id },
        { $set: { ecoles, "kpis.entreprises": entreprisesCount, "kpis.offres": jobCount, "metiers.liste": metiersListe, cards, updated_at: new Date() } }
      )
    } catch (error) {
      logger.error("Error in updateSeoDiplome for diplome " + diplome.slug, error)
    }
  })

  logger.info("ended job updateSeoDiplome")
}
