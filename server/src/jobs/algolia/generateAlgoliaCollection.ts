import { ObjectId } from "bson"
import { IFormationCatalogue, JOB_STATUS_ENGLISH } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { IAlgolia } from "shared/models/algolia.model"
import { IJobsPartnersOfferPrivate, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sendMistralMessages } from "@/services/mistralai/mistralai.service"

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

const getKeywords = async (description: string): Promise<string[] | null> => {
  if (!description) return null
  try {
    const response = await sendMistralMessages({
      messages: [
        {
          role: "system",
          content: `Tu es un extracteur de mots-clés pour des offres d'emploi en alternance.

**Contexte** : Les mots-clés extraits seront indexés dans un moteur de recherche sémantique. En indexant toute la description brute, le moteur analyse du bruit et perd en qualité. Ton rôle est de filtrer et extraire uniquement les termes pertinents. Tu ne dois en aucun cas inventer ou déduire des mots qui te sembleraient pertinents, mais bien te cantonner à extraire des mots du texte qui t'es fournis en entrée.

**Critères de sélection** :
- Compétences techniques et humaines (ex: JavaScript, Excel, gestion de projet)
- Secteurs d'activité (ex: commerce, santé, informatique)

**Contraintes** :
- Extrais 5-15 mots-clés maximum
- Ignore les balises HTML et le formatage
- Retourne UNIQUEMENT un tableau JSON : ["mot1", "mot2", ...]
- Pas de commentaire ni texte additionnel`,
        },
        { role: "user", content: `Description : ${description.substring(0, 2000)}` },
      ],
      maxTokens: 100,
      responseFormat: { type: "json_object" },
    })

    if (!response) return []
    return JSON.parse(response)
  } catch {
    return []
  }
}

export const fillAlgoliaCollection = async () => {
  // Récupérer les documents existants pour conserver les mots-clés et identifier les suppressions
  const existingDocs = await getDbCollection("algolia")
    .find({}, { projection: { _id: 1, keywords: 1 } })
    .toArray()
  const keywordsMap = new Map(existingDocs.map((doc) => [doc._id.toString(), doc.keywords]))
  const existingIds = new Set(existingDocs.map((doc) => doc._id.toString()))
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
          $lookup: {
            from: "raw_recruteurslba",
            localField: "workplace_siret",
            foreignField: "siret",
            as: "rawR",
          },
        },
        {
          $addFields: {
            rome_codes: {
              $slice: [
                {
                  $map: {
                    input: {
                      $ifNull: [{ $first: "$rawR.rome_codes" }, []],
                    },
                    as: "rc",
                    in: "$$rc.rome_code",
                  },
                },
                6,
              ],
            },
            application_count: {
              $size: "$applications",
            },
          },
        },
        {
          $lookup: {
            from: "referentielromes",
            let: { romes: "$rome_codes" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$rome.code_rome", "$$romes"],
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  intitule: "$rome.intitule",
                },
              },
            ],
            as: "romes",
          },
        },
        {
          $addFields: {
            intitule_romes: {
              $map: {
                input: "$romes",
                as: "r",
                in: "$$r.intitule",
              },
            },
          },
        },
        {
          $project: {
            ...jobsProjection,
            application_count: 1,
            intitule_romes: 1,
          },
        },
      ])
      .limit(80_000)
      .toArray(),
  ])

  const processedIds = new Set<string>()
  const algoliaCollection = getDbCollection("algolia")

  // Process formations and insert immediately
  await asyncForEach(formations, async (formation) => {
    const formationDoc: IAlgolia = {
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
      keywords: null,
    }

    await algoliaCollection.replaceOne({ _id: formationDoc._id }, formationDoc, { upsert: true })
    processedIds.add(formationDoc._id.toString())
  })

  // Process jobs and insert immediately
  await asyncForEach(jobs, async (job) => {
    const jobId = job._id.toString()
    const existingKeywordsForJob = keywordsMap.get(jobId)
    const keywords = existingKeywordsForJob || (await getKeywords(job.offer_description))

    const jobDoc: IAlgolia = {
      _id: job._id,
      objectID: job._id.toString(),
      url_id: job._id.toString(),
      type: "offre",
      type_filter_label: getTypeFilterLabel(job.partner_label, job.is_delegated),
      sub_type: getJobType(job.partner_label),
      contract_type: job.contract_type,
      publication_date: job.offer_creation?.getTime() || null,
      smart_apply: job.apply_email ? true : false,
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
      keywords,
    }

    await algoliaCollection.replaceOne({ _id: jobDoc._id }, jobDoc, { upsert: true })
    processedIds.add(jobDoc._id.toString())
  })

  // Process recruteurs and insert immediately
  await asyncForEach(recruteur, async (job) => {
    const jobId = job._id.toString()
    const existingKeywordsForJob = keywordsMap.get(jobId)
    const keywords = existingKeywordsForJob || (await getKeywords(job.intitule_romes.join(", ") || null))

    const recruteurDoc: IAlgolia = {
      _id: job._id,
      objectID: job._id.toString(),
      url_id: job.workplace_siret,
      type: "offre",
      type_filter_label: getTypeFilterLabel(job.partner_label),
      sub_type: getJobType(job.partner_label),
      contract_type: ["Apprentissage", "Professionnalisation"],
      publication_date: job.offer_creation?.getTime() || null,
      smart_apply: job.apply_email ? true : false,
      application_count: job.application_count,
      title: job.workplace_name || job.workplace_brand || job.workplace_legal_name || "",
      description: job.intitule_romes.join(", ") || "",
      address: job.workplace_address_label || "",
      _geoloc: {
        lat: job.workplace_geopoint.coordinates[1],
        lng: job.workplace_geopoint.coordinates[0],
      },
      organization_name: job.workplace_name || job.workplace_brand || job.workplace_legal_name || "",
      level: job.offer_target_diploma?.label || "",
      activity_sector: job.workplace_naf_label,
      keywords: keywords,
    }

    await algoliaCollection.replaceOne({ _id: recruteurDoc._id }, recruteurDoc, { upsert: true })
    processedIds.add(recruteurDoc._id.toString())
  })

  // Delete documents that are no longer in the sources
  const idsToDelete = [...existingIds].filter((id) => !processedIds.has(id))
  if (idsToDelete.length > 0) {
    await algoliaCollection.deleteMany({
      _id: { $in: idsToDelete.map((id) => new ObjectId(id)) },
    })
  }
}
