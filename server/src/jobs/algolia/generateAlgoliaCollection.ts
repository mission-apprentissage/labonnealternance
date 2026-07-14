import { readFile } from "node:fs/promises"

import { ObjectId } from "bson"
import type { IFormationCatalogue } from "shared"
import { JOB_STATUS_ENGLISH } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import type { IAlgolia } from "shared/models/algolia.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import type { Message } from "@/services/mistralai/mistralai.service"
import { submitMistralBatch } from "@/services/mistralai/mistralai.service"

// Taille de tranche par job batch Mistral (mode fichier, jusqu'à 1M req / 512 Mo).
// On borne pour limiter la mémoire du JSONL et le wall-clock de polling par job.
const KEYWORDS_BATCH_CHUNK_SIZE = 50_000

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
  rome_codes: 1,
}

const jobsProjection: Partial<Record<keyof IJobsPartnersOfferPrivate, 1>> = {
  offer_title: 1,
  offer_description: 1,
  offer_rome_codes: 1,
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

/**
 * Charge une fois le référentiel ROME en mémoire : code_rome → intitulé.
 * Réutilisé pour dériver `rome_labels` (signal métier déterministe) sur les 3 types de docs.
 */
const loadRomeLabelByCode = async (): Promise<Map<string, string>> => {
  const docs = await getDbCollection("referentielromes")
    .find({}, { projection: { _id: 0, "rome.code_rome": 1, "rome.intitule": 1 } })
    .toArray()
  const map = new Map<string, string>()
  for (const doc of docs) {
    const code = doc.rome?.code_rome
    const intitule = doc.rome?.intitule
    if (code && intitule) map.set(code, intitule)
  }
  return map
}

/** Résout des codes ROME en intitulés uniques (ignore les codes inconnus / vides). */
const resolveRomeLabels = (codes: (string | null | undefined)[] | null | undefined, romeLabelByCode: Map<string, string>): string[] => {
  const labels = (codes ?? []).map((code) => (code ? romeLabelByCode.get(code) : undefined)).filter((label): label is string => Boolean(label))
  return [...new Set(labels)]
}

/**
 * Canonicalisation de casse des champs de facette (organization_name, activity_sector) :
 * les sources partenaires livrent des casses différentes ("CARREFOUR"/"Carrefour",
 * "PROGRAMMATION INFORMATIQUE"/"Programmation informatique") → chaque variante devient une
 * option distincte dans les filtres (type `token`, match exact). Toutes les variantes d'un
 * même libellé (comparaison insensible à la casse) convergent vers UNE forme canonique :
 * la plus "propre" (ni tout-majuscules ni tout-minuscules) déjà en base, sinon la plus
 * fréquente — on préserve ainsi "SNCF Voyageurs" ou "… PVC" au lieu de réécrire la casse.
 */
const pickCanonicalVariant = (variants: { v: string; c: number }[]): string => {
  let best = variants[0].v
  let bestScore = -1
  for (const { v, c } of variants) {
    const isAllUpper = v === v.toUpperCase()
    const isAllLower = v === v.toLowerCase()
    const score = (isAllUpper || isAllLower ? 0 : 1_000_000) + c
    if (score > bestScore) {
      bestScore = score
      best = v
    }
  }
  return best
}

const buildCanonicalCaseMap = async (field: "organization_name" | "activity_sector"): Promise<Map<string, string>> => {
  const rows = await getDbCollection("algolia")
    .aggregate<{ _id: string; variants: { v: string; c: number }[] }>([
      { $match: { [field]: { $nin: [null, ""] } } },
      { $group: { _id: { lower: { $toLower: `$${field}` }, exact: `$${field}` }, count: { $sum: 1 } } },
      { $group: { _id: "$_id.lower", variants: { $push: { v: "$_id.exact", c: "$count" } } } },
    ])
    .toArray()
  return new Map(rows.map((row) => [row._id, pickCanonicalVariant(row.variants)]))
}

/** Applique la forme canonique ; une valeur inédite devient la référence de son groupe (cohérence intra-run). */
const canonicalizeCase = (map: Map<string, string>, value: string): string => {
  if (!value) return value
  const key = value.toLowerCase()
  const canonical = map.get(key)
  if (!canonical) {
    map.set(key, value)
    return value
  }
  return canonical
}

// Vocabulaire de niveau UNIFIÉ avec celui des offres (offer_target_diploma.label, référentiel
// standard de jobs_partners) : sinon la facette Niveau affiche deux libellés quasi-identiques
// par niveau (un côté formations, un côté offres) et cocher l'un ne remonte pas l'autre.
const convertFormationNiveauDiplome = (niveau: string) => {
  switch (niveau) {
    case "3 (CAP...)":
      return "CAP, BEP (Infrabac)"
    case "4 (BAC...)":
      return "Bac, Bac Pro, BP (Bac)"
    case "5 (BTS, DEUST...)":
      return "BTS, DEUST (Bac+2)"
    case "6 (Licence, BUT...)":
      return "Licence, BUT, Licence Pro (Bac+3)"
    case "7 (Master, titre ingénieur...)":
      return "Master, titre ingénieur, grande école (Bac+5)"
    default:
      // Niveau inconnu = indifférent — remonte quel que soit le niveau coché (filtre inclusif).
      return "Indifférent"
  }
}

const getTypeFilterLabel = (partner_label: JOBPARTNERS_LABEL, fromCfa?: boolean) => {
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

const KEYWORDS_SYSTEM_PROMPT = `Extrais les mots-clés pertinents d'une offre d'alternance pour un moteur de recherche sémantique.
Règles : uniquement des termes PRÉSENTS dans le texte (n'invente rien) ; compétences techniques/humaines et secteurs d'activité ; 5 à 15 mots-clés ; ignore le HTML.
Réponds STRICTEMENT en JSON : {"keywords": ["mot1", "mot2"]}`

const buildKeywordsMessages = (text: string): Message[] => [
  { role: "system", content: KEYWORDS_SYSTEM_PROMPT },
  { role: "user", content: text.substring(0, 2000) },
]

/** Parse la réponse Mistral `{"keywords": [...]}` en tableau de strings (null si invalide). */
const parseKeywords = (content: string): string[] | null => {
  try {
    const parsed = JSON.parse(content)
    const keywords = parsed?.keywords
    if (Array.isArray(keywords) && keywords.every((k) => typeof k === "string")) return keywords
    return null
  } catch {
    return null
  }
}

/**
 * Applique un fichier JSONL de sortie d'un batch Mistral (téléchargé manuellement depuis
 * la console, ou via l'API) aux mots-clés de la collection `algolia`. Chaque ligne :
 * `{ custom_id, response: { body: { choices: [{ message: { content } }] } } }`.
 * Utile pour rattraper un batch finalisé après l'expiration du polling.
 */
export const applyKeywordsBatchFile = async (payload?: { file?: string }) => {
  const file = payload?.file
  if (!file) throw new Error("Paramètre --file requis (chemin du JSONL de sortie Mistral)")

  const algoliaCollection = getDbCollection("algolia")
  const text = await readFile(file, "utf8")

  let updated = 0
  let skipped = 0
  for (const line of text.split("\n")) {
    if (!line.trim()) continue
    try {
      const parsed = JSON.parse(line)
      const content = parsed?.response?.body?.choices?.[0]?.message?.content
      const keywords = typeof content === "string" ? parseKeywords(content) : null
      if (parsed.custom_id && keywords && keywords.length > 0) {
        await algoliaCollection.updateOne({ _id: new ObjectId(parsed.custom_id) }, { $set: { keywords } })
        updated++
      } else {
        skipped++
      }
    } catch {
      skipped++
    }
  }

  logger.info(`applyKeywordsBatchFile: ${updated} documents mis à jour, ${skipped} ignorés`)
}

/**
 * Soumet à Mistral (API Batch, fire-and-forget) la génération des mots-clés pour toutes les
 * offres de la collection `algolia` qui n'en ont pas encore — indépendamment de la façon dont
 * elles ont été insérées. Les formations sont exclues (pas de mots-clés). Découpé en tranches
 * (un job/fichier par tranche), PAS de polling : le script soumet tous les jobs et se termine.
 * Récupération : télécharger le JSONL de sortie de chaque job (console Mistral ou API) puis
 * l'appliquer via `yarn cli algolia:apply-keywords-batch --file <sortie.jsonl>`.
 * Exécutable seul via `yarn cli fillMissingAlgoliaKeywords` (simpleJobDefinitions).
 */
export const fillMissingAlgoliaKeywords = async () => {
  const algoliaCollection = getDbCollection("algolia")
  const docs = await algoliaCollection
    .find({ type: "offre", $or: [{ keywords: null }, { keywords: { $size: 0 } }] }, { projection: { _id: 1, title: 1, description: 1, rome_labels: 1 } })
    .toArray()

  // Texte source : titre + description (le titre porte souvent la forme la plus canonique du
  // métier), à défaut les intitulés ROME (recruteurs, description vide — leur title = nom
  // d'entreprise, sans valeur pour les mots-clés).
  const withText = docs
    .map((doc) => ({
      id: doc._id,
      text: (doc.description?.trim() ? [doc.title?.trim(), doc.description.trim()].filter(Boolean).join("\n") : (doc.rome_labels ?? []).join(", ")).trim(),
    }))
    .filter((d) => d.text)

  const jobIds: string[] = []
  for (let i = 0; i < withText.length; i += KEYWORDS_BATCH_CHUNK_SIZE) {
    const chunk = withText.slice(i, i + KEYWORDS_BATCH_CHUNK_SIZE)
    const jobId = await submitMistralBatch({
      requests: chunk.map((doc) => ({ customId: doc.id.toString(), messages: buildKeywordsMessages(doc.text) })),
      model: "mistral-small-latest",
      maxTokens: 200,
      inputFileName: `keywords_batch_input_${i / KEYWORDS_BATCH_CHUNK_SIZE + 1}.jsonl`,
    })
    if (jobId) jobIds.push(jobId)
    else logger.error(`fillMissingAlgoliaKeywords: échec de soumission de la tranche ${i / KEYWORDS_BATCH_CHUNK_SIZE + 1} (${chunk.length} requêtes)`)
  }

  logger.info(
    `fillMissingAlgoliaKeywords: ${withText.length} offres sans keywords, ${jobIds.length} job(s) batch Mistral soumis : ${jobIds.join(", ")}. ` +
      `Une fois terminés, appliquer chaque sortie via \`yarn cli algolia:apply-keywords-batch --file <sortie.jsonl>\`.`
  )
}

export const fillAlgoliaCollection = async () => {
  // Récupérer les _id existants : on saute les docs déjà présents et on identifie les suppressions.
  const existingDocs = await getDbCollection("algolia")
    .find({}, { projection: { _id: 1 } })
    .toArray()
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
      // .limit(100_000) // limite levée : import complet des offres actives
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
          // rome_codes : priorité au classement de raw_recruteurslba (codes ordonnés par
          // pertinence par l'algo), fallback sur offer_rome_codes de jobs_partners si la
          // collection raw est vide/absente (cas local ou raw purgée) — sinon rome_labels
          // resterait vide pour tous les recruteurs.
          $addFields: {
            rome_codes: {
              $let: {
                vars: {
                  fromRaw: {
                    $map: {
                      input: {
                        $ifNull: [{ $first: "$rawR.rome_codes" }, []],
                      },
                      as: "rc",
                      in: "$$rc.rome_code",
                    },
                  },
                },
                in: {
                  $slice: [
                    {
                      $cond: [{ $gt: [{ $size: "$$fromRaw" }, 0] }, "$$fromRaw", { $ifNull: ["$offer_rome_codes", []] }],
                    },
                    6,
                  ],
                },
              },
            },
            application_count: {
              $size: "$applications",
            },
          },
        },
        {
          // Les intitulés ROME sont résolus côté JS via une Map en mémoire (resolveRomeLabels),
          // partagée avec les offres/formations — plus de $lookup referentielromes par doc.
          $project: {
            ...jobsProjection,
            application_count: 1,
            rome_codes: 1,
          },
        },
      ])
      // .limit(80_000) // limite levée : import complet des recruteurs
      .toArray(),
  ])

  const romeLabelByCode = await loadRomeLabelByCode()
  // Cartes de canonicalisation de casse (facettes) — construites sur l'existant pour que les
  // nouveaux docs convergent vers les formes déjà en base.
  const [organizationCaseMap, sectorCaseMap] = await Promise.all([buildCanonicalCaseMap("organization_name"), buildCanonicalCaseMap("activity_sector")])

  const processedIds = new Set<string>()
  const algoliaCollection = getDbCollection("algolia")

  // Process formations and insert immediately
  await asyncForEach(formations, async (formation) => {
    // Déjà en base → on conserve tel quel (marqué traité pour ne pas le supprimer).
    if (existingIds.has(formation._id.toString())) {
      processedIds.add(formation._id.toString())
      return
    }

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
      address: [formation.lieu_formation_adresse, formation.code_postal, formation.localite].filter(Boolean).join(" "),
      location: {
        type: "Point",
        coordinates: [formation.lieu_formation_geopoint!.coordinates[0], formation.lieu_formation_geopoint!.coordinates[1]],
      },
      organization_name: canonicalizeCase(organizationCaseMap, formation.etablissement_formateur_entreprise_raison_sociale || ""),
      level: convertFormationNiveauDiplome(formation.niveau || ""),
      activity_sector: null,
      keywords: null,
      rome_labels: resolveRomeLabels(formation.rome_codes, romeLabelByCode),
    }

    await algoliaCollection.replaceOne({ _id: formationDoc._id }, formationDoc, { upsert: true })
    processedIds.add(formationDoc._id.toString())
  })

  // Process jobs and insert immediately
  await asyncForEach(jobs, async (job) => {
    const jobId = job._id.toString()
    // Déjà en base → on conserve tel quel (marqué traité pour ne pas le supprimer).
    if (existingIds.has(jobId)) {
      processedIds.add(jobId)
      return
    }

    const jobDoc: IAlgolia = {
      _id: job._id,
      objectID: job._id.toString(),
      url_id: job._id.toString(),
      type: "offre",
      type_filter_label: getTypeFilterLabel(job.partner_label, job.is_delegated),
      sub_type: getJobType(job.partner_label),
      contract_type: job.contract_type,
      publication_date: job.offer_creation ?? null,
      smart_apply: job.apply_email ? true : false,
      application_count: job.application_count,
      title: job.offer_title || "",
      description: job.offer_description || "",
      address: job.workplace_address_label || "",
      location: {
        type: "Point",
        coordinates: [job.workplace_geopoint.coordinates[0], job.workplace_geopoint.coordinates[1]],
      },
      organization_name: canonicalizeCase(organizationCaseMap, job.workplace_name || job.workplace_brand || job.workplace_legal_name || ""),
      level: job.offer_target_diploma?.label || "",
      activity_sector: job.workplace_naf_label ? canonicalizeCase(sectorCaseMap, job.workplace_naf_label) : job.workplace_naf_label,
      keywords: null,
      rome_labels: resolveRomeLabels(job.offer_rome_codes, romeLabelByCode),
    }

    await algoliaCollection.replaceOne({ _id: jobDoc._id }, jobDoc, { upsert: true })
    processedIds.add(jobDoc._id.toString())
  })

  // Process recruteurs and insert immediately
  await asyncForEach(recruteur, async (job) => {
    const jobId = job._id.toString()
    // Déjà en base → on conserve tel quel (marqué traité pour ne pas le supprimer).
    if (existingIds.has(jobId)) {
      processedIds.add(jobId)
      return
    }

    const recruteurDoc: IAlgolia = {
      _id: job._id,
      objectID: job._id.toString(),
      url_id: job.workplace_siret,
      type: "offre",
      type_filter_label: getTypeFilterLabel(job.partner_label),
      sub_type: getJobType(job.partner_label),
      contract_type: ["Apprentissage", "Professionnalisation"],
      publication_date: job.offer_creation ?? null,
      smart_apply: job.apply_email ? true : false,
      application_count: job.application_count,
      // title des recruteurs = nom d'entreprise → même canonicalisation que organization_name.
      title: canonicalizeCase(organizationCaseMap, job.workplace_name || job.workplace_brand || job.workplace_legal_name || ""),
      // Pas une offre d'emploi → pas de vraie description. Le signal métier vit dans rome_labels.
      description: "",
      address: job.workplace_address_label || "",
      location: {
        type: "Point",
        coordinates: [job.workplace_geopoint.coordinates[0], job.workplace_geopoint.coordinates[1]],
      },
      organization_name: canonicalizeCase(organizationCaseMap, job.workplace_name || job.workplace_brand || job.workplace_legal_name || ""),
      level: job.offer_target_diploma?.label || "",
      activity_sector: job.workplace_naf_label ? canonicalizeCase(sectorCaseMap, job.workplace_naf_label) : job.workplace_naf_label,
      keywords: null,
      rome_labels: resolveRomeLabels(job.rome_codes, romeLabelByCode),
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

  // Seconde passe : génération des mots-clés pour toutes les offres qui n'en ont pas.
  // Non lancée ici (wall-clock batch Mistral) → job dédié : `yarn cli fillMissingAlgoliaKeywords`.
}
