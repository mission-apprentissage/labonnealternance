import type { ObjectId } from "bson"
import type { IFormationCatalogue } from "shared"
import { JOB_STATUS_ENGLISH } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { ISearchItem } from "shared/models/searchItems.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { sanitizeTextField } from "@/common/utils/stringUtils"
import { GEIQ_WHITELIST } from "@/jobs/offrePartenaire/geiqWhitelist"

/**
 * Construction et synchronisation des documents `search_items` (index MongoDB Search).
 *
 * - Builders purs (formation / offre / recruteur) partagés entre le batch nightly
 *   (`fillSearchItemsCollection`) et la synchronisation incrémentale.
 * - Sync incrémentale : `upsertJobPartnersToSearchItems` (appels explicites des actions
 *   unitaires + cron delta `syncSearchItemsDelta` basé sur `updated_at` pour les écritures
 *   de masse), `removeJobPartnersFromSearchItems` pour les suppressions physiques.
 * - Garde-fou : `controlSearchItemsDrift` (alerte Slack si l'index dérive des sources).
 *
 * Le requêtage de l'index vit dans `search.service.ts` — ce fichier n'en dépend pas.
 */

export const formationProjection: Partial<Record<keyof IFormationCatalogue, 1>> = {
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

export const jobsProjection: Partial<Record<keyof IJobsPartnersOfferPrivate, 1>> = {
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
  contract_start: 1,
  contract_start_type: 1,
  contract_start_is_flexible: 1,
  contract_is_disabled_elligible: 1,
}

type ProjectedJobFields =
  | "offer_title"
  | "offer_description"
  | "offer_rome_codes"
  | "offer_target_diploma"
  | "offer_creation"
  | "workplace_legal_name"
  | "workplace_address_label"
  | "workplace_geopoint"
  | "workplace_naf_label"
  | "workplace_siret"
  | "workplace_brand"
  | "workplace_name"
  | "partner_label"
  | "apply_email"
  | "is_delegated"
  | "contract_type"
  | "contract_start"
  | "contract_start_type"
  | "contract_start_is_flexible"
  | "contract_is_disabled_elligible"

/** Offre jobs_partners projetée + champs dérivés des lookups (batch et sync incrémentale). */
export type IJobPartnerForSearchItem = Pick<IJobsPartnersOfferPrivate, ProjectedJobFields> & {
  _id: ObjectId
  application_count: number
  offer_status?: JOB_STATUS_ENGLISH
  rome_codes?: (string | null)[] | null
}

type ProjectedFormationFields =
  | "intitule_rco"
  | "contenu"
  | "niveau"
  | "lieu_formation_geopoint"
  | "lieu_formation_adresse"
  | "code_postal"
  | "localite"
  | "etablissement_formateur_entreprise_raison_sociale"
  | "entierement_a_distance"
  | "cle_ministere_educatif"
  | "rome_codes"

/** Formation catalogue projetée (batch nightly). */
export type IFormationForSearchItem = Pick<IFormationCatalogue, ProjectedFormationFields> & { _id: ObjectId }

/**
 * Charge une fois le référentiel ROME en mémoire : code_rome → intitulé.
 * Réutilisé pour dériver `rome_labels` (signal métier déterministe) sur les 3 types de docs.
 */
export const loadRomeLabelByCode = async (): Promise<Map<string, string>> => {
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
export const resolveRomeLabels = (codes: (string | null | undefined)[] | null | undefined, romeLabelByCode: Map<string, string>): string[] => {
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

export const buildCanonicalCaseMap = async (field: "organization_name" | "activity_sector"): Promise<Map<string, string>> => {
  const rows = await getDbCollection("search_items")
    .aggregate<{ _id: string; variants: { v: string; c: number }[] }>([
      { $match: { [field]: { $nin: [null, ""] } } },
      { $group: { _id: { lower: { $toLower: `$${field}` }, exact: `$${field}` }, count: { $sum: 1 } } },
      { $group: { _id: "$_id.lower", variants: { $push: { v: "$_id.exact", c: "$count" } } } },
    ])
    .toArray()
  return new Map(rows.map((row) => [row._id, pickCanonicalVariant(row.variants)]))
}

/** Applique la forme canonique ; une valeur inédite devient la référence de son groupe (cohérence intra-run). */
export const canonicalizeCase = (map: Map<string, string>, value: string): string => {
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
export const convertFormationNiveauDiplome = (niveau: string) => {
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

/**
 * Descriptions en texte brut : les sources livrent du HTML (balises + entités) qui s'affiche
 * tel quel dans les previews et pollue l'index (tokens parasites p/li/ul, cf. bug synonymes
 * "plaquiste"). Les fins de blocs deviennent des sauts de ligne pour ne pas coller les mots.
 */
export const stripHtmlToText = (text: string | null | undefined): string => {
  if (!text) return ""
  const withBreaks = text.replace(/<\/(p|li|ul|ol|div|h[1-6])>|<br\s*\/?>/gi, "\n")
  return sanitizeTextField(withBreaks)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export const getTypeFilterLabel = (partner_label: string, fromCfa?: boolean | null) => {
  if (fromCfa) return "Offres d'emploi postées par des écoles"
  switch (partner_label) {
    case "offres_emploi_lba":
      return "Offres d'emploi La bonne alternance"
    case "recruteurs_lba":
      return "Candidatures spontanées"
    default:
      return "Offres d'emploi partenaires"
  }
}

const GEIQ_SIRETS = new Set(GEIQ_WHITELIST)

// Certains intitulés sources arrivent dupliqués (« BTS bâtiment BTS bâtiment » — formations
// catalogue comme offres partenaires) : on ne garde qu'une occurrence, sinon le doublon
// pollue les suggestions d'autocomplétion et les titres affichés.
export const dedupeRepeatedTitle = (title: string): string => {
  const trimmed = title.trim()
  if (trimmed.length <= 6) return trimmed
  const half = Math.floor(trimmed.length / 2)
  const first = trimmed.slice(0, half).trim()
  const second = trimmed.slice(half).trim()
  return first.toLowerCase() === second.toLowerCase() ? first : trimmed
}

// contract_start à l'epoch (01/01/1970) = date manquante mal encodée côté source partenaire →
// null (sinon ces offres passent tous les filtres start_date $lte et trient en tête du tri
// par date de début).
export const sanitizeContractStart = (date: Date | null | undefined): Date | null => (date && date.getTime() > 0 ? date : null)

/**
 * « Emploi avec formation incluse » : offre émise par un CFA (délégation à un mandataire)
 * ou par un GEIQ (whitelist SIRET). Ces offres sont exclues du mode « Emplois uniquement ».
 */
export const isFormationIncluded = (job: { is_delegated?: boolean | null; workplace_siret?: string | null }): boolean =>
  job.is_delegated === true || (job.workplace_siret != null && GEIQ_SIRETS.has(job.workplace_siret))

export const getJobType = (partner_label: string) => {
  switch (partner_label) {
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
      return LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
    case LBA_ITEM_TYPE.RECRUTEURS_LBA:
      return LBA_ITEM_TYPE.RECRUTEURS_LBA
    default:
      return LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES
  }
}

/** Référentiels chargés une fois et partagés par les builders (batch comme sync incrémentale). */
export type SearchItemBuildContext = {
  romeLabelByCode: Map<string, string>
  organizationCaseMap: Map<string, string>
  sectorCaseMap: Map<string, string>
}

export const loadSearchItemBuildContext = async (): Promise<SearchItemBuildContext> => {
  const [romeLabelByCode, organizationCaseMap, sectorCaseMap] = await Promise.all([
    loadRomeLabelByCode(),
    buildCanonicalCaseMap("organization_name"),
    buildCanonicalCaseMap("activity_sector"),
  ])
  return { romeLabelByCode, organizationCaseMap, sectorCaseMap }
}

// buildCanonicalCaseMap = 2 agrégations $group sur TOUTE la collection search_items : trop
// coûteux pour être payé à chaque appel unitaire (fire-and-forget des actions métier) ou à
// chaque chunk du cron delta → mémoïsation avec TTL. Les référentiels évoluent lentement ;
// canonicalizeCase enrichit les maps en mémoire entre deux rechargements (cohérence intra-process).
const CTX_CACHE_TTL_MS = 10 * 60 * 1000
let ctxCache: { ctx: SearchItemBuildContext; loadedAt: number } | null = null

export const getSearchItemBuildContext = async (): Promise<SearchItemBuildContext> => {
  if (ctxCache && Date.now() - ctxCache.loadedAt < CTX_CACHE_TTL_MS) return ctxCache.ctx
  const ctx = await loadSearchItemBuildContext()
  ctxCache = { ctx, loadedAt: Date.now() }
  return ctx
}

/** Invalide la mémoïsation du contexte (isolation des tests). */
export const resetSearchItemBuildContextCache = (): void => {
  ctxCache = null
}

export const buildFormationSearchItem = (formation: IFormationForSearchItem, ctx: SearchItemBuildContext): ISearchItem => ({
  _id: formation._id,
  url_id: formation.cle_ministere_educatif,
  type: "formation",
  type_filter_label: formation.entierement_a_distance ? "Formation à distance" : "Formation en présentiel",
  sub_type: LBA_ITEM_TYPE.FORMATION,
  contract_type: null,
  publication_date: null,
  is_disabled_elligible: null,
  start_date: null,
  start_type: null,
  is_start_flexible: null,
  is_algo_company: false,
  is_formation_included: null,
  smart_apply: null,
  application_count: null,
  title: dedupeRepeatedTitle(formation.intitule_rco || ""),
  description: stripHtmlToText(formation.contenu),
  address: [formation.lieu_formation_adresse, formation.code_postal, formation.localite].filter(Boolean).join(" "),
  location: {
    type: "Point",
    coordinates: [formation.lieu_formation_geopoint!.coordinates[0], formation.lieu_formation_geopoint!.coordinates[1]],
  },
  organization_name: canonicalizeCase(ctx.organizationCaseMap, formation.etablissement_formateur_entreprise_raison_sociale || ""),
  level: convertFormationNiveauDiplome(formation.niveau || ""),
  activity_sector: null,
  keywords: null,
  rome_labels: resolveRomeLabels(formation.rome_codes, ctx.romeLabelByCode),
})

export const buildJobOfferSearchItem = (job: IJobPartnerForSearchItem, ctx: SearchItemBuildContext): ISearchItem => ({
  _id: job._id,
  url_id: job._id.toString(),
  type: "offre",
  type_filter_label: getTypeFilterLabel(job.partner_label, job.is_delegated),
  sub_type: getJobType(job.partner_label),
  contract_type: job.contract_type,
  publication_date: job.offer_creation ?? null,
  is_disabled_elligible: job.contract_is_disabled_elligible ?? false,
  start_date: sanitizeContractStart(job.contract_start),
  start_type: job.contract_start_type ?? null,
  is_start_flexible: job.contract_start_is_flexible ?? null,
  is_algo_company: false,
  is_formation_included: isFormationIncluded(job),
  smart_apply: job.apply_email ? true : false,
  application_count: job.application_count,
  title: dedupeRepeatedTitle(job.offer_title || ""),
  description: stripHtmlToText(job.offer_description),
  address: job.workplace_address_label || "",
  location: {
    type: "Point",
    coordinates: [job.workplace_geopoint.coordinates[0], job.workplace_geopoint.coordinates[1]],
  },
  organization_name: canonicalizeCase(ctx.organizationCaseMap, job.workplace_name || job.workplace_brand || job.workplace_legal_name || ""),
  level: job.offer_target_diploma?.label || "",
  activity_sector: job.workplace_naf_label ? canonicalizeCase(ctx.sectorCaseMap, job.workplace_naf_label) : job.workplace_naf_label,
  keywords: null,
  rome_labels: resolveRomeLabels(job.offer_rome_codes, ctx.romeLabelByCode),
})

export const buildRecruteurSearchItem = (job: IJobPartnerForSearchItem, ctx: SearchItemBuildContext): ISearchItem => {
  // title des recruteurs = nom d'entreprise → même canonicalisation que organization_name.
  const organizationName = canonicalizeCase(ctx.organizationCaseMap, job.workplace_name || job.workplace_brand || job.workplace_legal_name || "")
  return {
    _id: job._id,
    // url_id des recruteurs = SIRET (page détail /emploi/recruteurs_lba/{siret}) ; fallback
    // _id pour satisfaire le schéma si le SIRET manque (cas théorique).
    url_id: job.workplace_siret ?? job._id.toString(),
    type: "offre",
    type_filter_label: getTypeFilterLabel(job.partner_label),
    sub_type: getJobType(job.partner_label),
    contract_type: ["Apprentissage", "Professionnalisation"],
    publication_date: job.offer_creation ?? null,
    is_disabled_elligible: job.contract_is_disabled_elligible ?? false,
    // Candidature spontanée, pas une offre : aucune date/mode de démarrage de contrat.
    start_date: null,
    start_type: null,
    is_start_flexible: null,
    is_algo_company: true,
    // Entreprise, pas une offre : ni CFA ni GEIQ au sens « formation incluse ».
    is_formation_included: false,
    smart_apply: job.apply_email ? true : false,
    application_count: job.application_count,
    title: organizationName,
    // Pas une offre d'emploi → pas de vraie description. Le signal métier vit dans rome_labels.
    description: "",
    address: job.workplace_address_label || "",
    location: {
      type: "Point",
      coordinates: [job.workplace_geopoint.coordinates[0], job.workplace_geopoint.coordinates[1]],
    },
    organization_name: organizationName,
    level: job.offer_target_diploma?.label || "",
    activity_sector: job.workplace_naf_label ? canonicalizeCase(ctx.sectorCaseMap, job.workplace_naf_label) : job.workplace_naf_label,
    keywords: null,
    rome_labels: resolveRomeLabels(job.rome_codes, ctx.romeLabelByCode),
  }
}

// ─── Synchronisation incrémentale jobs_partners → search_items ─────────────────────────────

/** Pipelines de récupération des jobs_partners avec leurs champs dérivés (application_count, rome_codes recruteurs). */
const fetchJobPartnersForSync = async (ids: ObjectId[]): Promise<{ offers: IJobPartnerForSearchItem[]; recruteurs: IJobPartnerForSearchItem[] }> => {
  const [offers, recruteurs] = await Promise.all([
    getDbCollection("jobs_partners")
      .aggregate<IJobPartnerForSearchItem>([
        { $match: { _id: { $in: ids }, partner_label: { $ne: JOBPARTNERS_LABEL.RECRUTEURS_LBA } } },
        {
          $lookup: {
            from: "applications",
            let: { jobIdStr: { $toString: "$_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$job_id", "$$jobIdStr"] } } }],
            as: "applications",
          },
        },
        { $addFields: { application_count: { $size: "$applications" } } },
        { $project: { ...jobsProjection, application_count: 1, offer_status: 1 } },
      ])
      .toArray(),
    getDbCollection("jobs_partners")
      .aggregate<IJobPartnerForSearchItem>([
        { $match: { _id: { $in: ids }, partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA } },
        { $lookup: { from: "applications", localField: "workplace_siret", foreignField: "company_siret", as: "applications" } },
        { $lookup: { from: "raw_recruteurslba", localField: "workplace_siret", foreignField: "siret", as: "rawR" } },
        {
          // rome_codes : priorité au classement de raw_recruteurslba (codes ordonnés par
          // pertinence par l'algo), fallback sur offer_rome_codes de jobs_partners si la
          // collection raw est vide/absente — même logique que le batch nightly.
          $addFields: {
            rome_codes: {
              $let: {
                vars: { fromRaw: { $map: { input: { $ifNull: [{ $first: "$rawR.rome_codes" }, []] }, as: "rc", in: "$$rc.rome_code" } } },
                in: { $slice: [{ $cond: [{ $gt: [{ $size: "$$fromRaw" }, 0] }, "$$fromRaw", { $ifNull: ["$offer_rome_codes", []] }] }, 6] },
              },
            },
            application_count: { $size: "$applications" },
          },
        },
        { $project: { ...jobsProjection, application_count: 1, rome_codes: 1, offer_status: 1 } },
      ])
      .toArray(),
  ])
  return { offers, recruteurs }
}

/**
 * Upsert préservant les `keywords` (enrichissement Mistral asynchrone) des docs déjà indexés.
 * Utilisé par la sync incrémentale ET le nightly : un `replaceOne` remettrait `keywords: null`
 * sur un doc inséré/enrichi par un autre chemin entre deux lectures (course sync ↔ cron keywords).
 */
export const upsertSearchItem = async (doc: ISearchItem) => {
  const { keywords: _keywords, _id, ...fields } = doc
  await getDbCollection("search_items").updateOne({ _id }, { $set: fields, $setOnInsert: { keywords: null } }, { upsert: true })
}

/**
 * Synchronise des jobs_partners identifiés vers search_items :
 * - offre ACTIVE → upsert (keywords Mistral préservés) ;
 * - offre non-ACTIVE ou _id disparu de jobs_partners → retrait de l'index ;
 * - recruteurs_lba → upsert inconditionnel (le batch nightly n'a jamais filtré leur statut).
 * Ne touche JAMAIS les documents `type: "formation"`.
 */
export const upsertJobPartnersToSearchItems = async (ids: ObjectId[], sharedCtx?: SearchItemBuildContext): Promise<{ upserted: number; removed: number }> => {
  if (!ids.length) return { upserted: 0, removed: 0 }

  const { offers, recruteurs } = await fetchJobPartnersForSync(ids)
  const ctx = sharedCtx ?? (await getSearchItemBuildContext())

  const toRemove: ObjectId[] = []
  let upserted = 0

  for (const offer of offers) {
    if (offer.offer_status !== JOB_STATUS_ENGLISH.ACTIVE) {
      toRemove.push(offer._id)
      continue
    }
    await upsertSearchItem(buildJobOfferSearchItem(offer, ctx))
    upserted++
  }

  for (const recruteur of recruteurs) {
    await upsertSearchItem(buildRecruteurSearchItem(recruteur, ctx))
    upserted++
  }

  // _id demandés mais absents de jobs_partners (suppression physique) → retrait de l'index.
  const found = new Set([...offers, ...recruteurs].map((doc) => doc._id.toString()))
  toRemove.push(...ids.filter((id) => !found.has(id.toString())))

  const removed = await removeJobPartnersFromSearchItems(toRemove)
  return { upserted, removed }
}

/** Retire des jobs_partners de l'index (garde-fou : ne touche jamais les formations). */
export const removeJobPartnersFromSearchItems = async (ids: ObjectId[]): Promise<number> => {
  if (!ids.length) return 0
  const result = await getDbCollection("search_items").deleteMany({ _id: { $in: ids }, type: "offre" })
  return result.deletedCount
}

/**
 * Variante fire-and-forget pour les actions métier unitaires (création, activation,
 * annulation, pourvue…) : la synchronisation de l'index ne doit JAMAIS faire échouer
 * l'action — erreur capturée Sentry, rattrapage par le cron delta puis le nightly.
 */
export const syncJobPartnersToSearchItemsInBackground = (ids: ObjectId[]): void => {
  upsertJobPartnersToSearchItems(ids).catch((err) => sentryCaptureException(err))
}

// Fenêtre du delta : 2× l'intervalle du cron (15 min) — un run raté est rattrapé par le
// suivant, les upserts sont idempotents, et le nightly réconcilie l'ensemble.
const DELTA_DEFAULT_WINDOW_MS = 30 * 60 * 1000
const DELTA_CHUNK_SIZE = 500

/**
 * Cron delta : synchronise les jobs_partners modifiés depuis `since` (défaut : 30 min).
 * Couvre les écritures de masse (expiration, imports, dédoublonnage…) qui bumpent
 * `updated_at` — les suppressions physiques, invisibles ici, sont traitées par les appels
 * explicites et la purge des orphelins du nightly.
 */
export const syncSearchItemsDelta = async (payload?: { since?: Date | string }) => {
  // `since` peut arriver sérialisé en string (payload CLI / job queued JSON) : sans coercition,
  // `$gte: "2026-…"` (string vs Date BSON) ne matcherait silencieusement aucun document.
  const since = payload?.since ? new Date(payload.since) : new Date(Date.now() - DELTA_DEFAULT_WINDOW_MS)
  if (Number.isNaN(since.getTime())) throw new Error(`syncSearchItemsDelta: paramètre since invalide (${payload?.since})`)
  const ids = await getDbCollection("jobs_partners")
    .find({ updated_at: { $gte: since } }, { projection: { _id: 1 } })
    .map((doc) => doc._id)
    .toArray()

  // Contexte chargé UNE fois pour tout le run (pas par chunk : 2 agrégations full-scan sinon).
  const ctx = ids.length ? await loadSearchItemBuildContext() : undefined

  let upserted = 0
  let removed = 0
  for (let i = 0; i < ids.length; i += DELTA_CHUNK_SIZE) {
    const result = await upsertJobPartnersToSearchItems(ids.slice(i, i + DELTA_CHUNK_SIZE), ctx)
    upserted += result.upserted
    removed += result.removed
  }

  logger.info(`syncSearchItemsDelta: ${ids.length} jobs_partners modifiés depuis ${since.toISOString()} — ${upserted} upserts, ${removed} retraits`)
  return { scanned: ids.length, upserted, removed }
}

// Dérive tolérée entre les sources et l'index : le delta (15 min) et les candidatures en
// continu créent un écart transitoire normal.
const DRIFT_ABSOLUTE_THRESHOLD = 500
const DRIFT_RELATIVE_THRESHOLD = 0.01

/**
 * Garde-fou : compare les volumes attendus (jobs_partners) aux volumes indexés
 * (search_items) et alerte Slack en cas de dérive — symptôme d'une sync cassée
 * (cron delta muet, écriture de masse sans bump updated_at…).
 */
export const controlSearchItemsDrift = async () => {
  const [expectedOffers, expectedRecruteurs, indexedOffers, indexedRecruteurs] = await Promise.all([
    getDbCollection("jobs_partners").countDocuments({ partner_label: { $ne: JOBPARTNERS_LABEL.RECRUTEURS_LBA }, offer_status: JOB_STATUS_ENGLISH.ACTIVE }),
    getDbCollection("jobs_partners").countDocuments({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }),
    getDbCollection("search_items").countDocuments({ type: "offre", sub_type: { $ne: LBA_ITEM_TYPE.RECRUTEURS_LBA } }),
    getDbCollection("search_items").countDocuments({ sub_type: LBA_ITEM_TYPE.RECRUTEURS_LBA }),
  ])

  const drifts = [
    { label: "offres", expected: expectedOffers, indexed: indexedOffers },
    { label: "recruteurs", expected: expectedRecruteurs, indexed: indexedRecruteurs },
  ].filter(({ expected, indexed }) => {
    const gap = Math.abs(expected - indexed)
    return gap > Math.max(DRIFT_ABSOLUTE_THRESHOLD, expected * DRIFT_RELATIVE_THRESHOLD)
  })

  if (drifts.length) {
    const message = drifts.map(({ label, expected, indexed }) => `${label} : ${indexed} indexés vs ${expected} attendus (écart ${Math.abs(expected - indexed)})`).join(" — ")
    await notifyToSlack({ subject: "Dérive de l'index search_items", message: `La synchronisation jobs_partners → search_items dérive. ${message}`, error: true })
  }

  logger.info(
    `controlSearchItemsDrift: offres ${indexedOffers}/${expectedOffers}, recruteurs ${indexedRecruteurs}/${expectedRecruteurs}${drifts.length ? " — DÉRIVE DÉTECTÉE" : ""}`
  )
  return { expectedOffers, expectedRecruteurs, indexedOffers, indexedRecruteurs, drift: drifts.length > 0 }
}
