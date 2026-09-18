import { JOB_STATUS_ENGLISH } from "shared"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

const GRANTED_BY = "20260915143000-backfill-offer-status-history-lba-5429"

/** Motif posé par cancelRemovedJobsPartners, impossible à obtenir légitimement sur une offre LBA. */
const FLUX_REMOVAL_REASON = "supprimée du flux source"
const JUNE_2026_BUG_REASON = "bug du 06 2026"
/** Clôture décidée par un humain, par opposition aux annulations automatiques. */
const MANUAL_CLOSURE_REASON = "Désactivation manuelle"
const NO_REASON_RECORDED = "motif non enregistré (clôture antérieure au correctif #5429)"

/** Statuts terminaux d'une offre clôturée. POURVUE vaut "Filled" en base, pas "Provided". */
const CLOSED_STATUSES = [JOB_STATUS_ENGLISH.POURVUE, JOB_STATUS_ENGLISH.ANNULEE] as const

/**
 * Remet d'aplomb `offer_status_history` sur les offres déjà closes (issue #5429), en trois volets
 * indépendants.
 *
 * Contexte : trois chemins changeaient le statut d'une offre sans pousser d'entrée d'historique —
 * clôture par le recruteur, archivage du formulaire, anonymisation des comptes. Le correctif les
 * branche sur `buildJobStatusChangeUpdate`, mais les offres déjà closes
 * gardent un historique vide : les tableaux de bord ne peuvent pas distinguer « close sans motif
 * connu » de « donnée absente », ce qui est précisément le trou de mesure du ticket.
 *
 * `updated_at` sert de date à toutes les traces reconstituées ici, faute de mieux. **Ce n'est pas la
 * date de clôture** : des écritures ultérieures (mise à jour du SIRET, de l'OPCO, des coordonnées du
 * recruteur) l'ont rafraîchie sans changer le statut. `granted_by` marque donc ces entrées comme
 * reconstituées, pour qu'une analyse puisse les exclure.
 */
export const up = async () => {
  await backfillClosedOffersWithoutComment()
  await requalifyFluxRemovalReason()
  await recordManualClosures()
}

/**
 * Volet 1 — offres LBA closes, historique vide, et aucun motif n'a jamais été enregistré.
 *
 * Les offres qui ont un `job_status_comment` sont volontairement exclues ici : elles relèvent du
 * volet 3, qui les traite qu'elles aient ou non déjà un historique.
 *
 * POURVUE est repris au même titre qu'ANNULEE : les deux sortent du même appel
 * (`closeOffreWithMotif`), et « pourvue avec l'aide de La bonne alternance » est la mesure d'impact
 * la plus utile du lot.
 */
const backfillClosedOffersWithoutComment = async () => {
  // $in: [null, ""] couvre aussi le champ absent : en Mongo, null matche une clé manquante.
  //
  // $size: 0 en revanche ne matche que le tableau vide, pas un document sans la clé. C'est assumé :
  // la migration 20250206000000 a posé offer_status_history: [] sur toute la collection et les
  // chemins de création le posent explicitement, donc le champ est toujours là. Le volet 3 se
  // protège quand même de son absence avec un $ifNull parce que l'enjeu n'y est pas le même — ici
  // le pire cas est une offre non complétée, là-bas c'est un historique effacé.
  const filter = {
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    offer_status: { $in: [...CLOSED_STATUSES] },
    offer_status_history: { $size: 0 },
    job_status_comment: { $in: [null, ""] },
  }

  const total = await getDbCollection("jobs_partners").countDocuments(filter)
  logger.info(`volet 1 — offres closes sans motif ni historique : ${total} offres`)

  // Pipeline d'update : la trace dépend de champs du document (statut, updated_at), qu'un update
  // classique ne sait pas lire.
  const { modifiedCount } = await getDbCollection("jobs_partners").updateMany(filter, [
    {
      $set: {
        offer_status_history: [{ date: "$updated_at", status: "$offer_status", reason: NO_REASON_RECORDED, granted_by: GRANTED_BY }],
      },
    },
  ])

  logger.info(`volet 1 — ${modifiedCount}/${total} offres complétées`)
}

/**
 * Volet 2 — requalifier le motif "supprimée du flux source" porté par des offres OFFRES_EMPLOI_LBA.
 *
 * Ce motif y est faux par construction : ces offres ne transitent jamais par computed_jobs_partners,
 * elles ne peuvent donc pas « disparaître d'un flux ». Elles l'ont hérité d'un run de
 * cancelRemovedJobsPartners lancé sans filtre en juin 2026 — le filtre était alors optionnel et le
 * job exposé tel quel en CLI, si bien qu'un appel sans argument annulait tout le catalogue actif,
 * tous partenaires confondus. Corrigé depuis par #4814 (filtre obligatoire, garde runtime, sous-jobs
 * dédiés), donnée partiellement réparée par #4813 — qui n'a réactivé que les offres non expirées.
 *
 * Pas de filtre sur offer_status : les offres réactivées par #4813 portent toujours l'entrée fautive
 * à côté de leur entrée de réactivation. arrayFilters requalifie chaque entrée concernée et laisse
 * les autres intactes — une offre a pu être annulée puis réactivée plusieurs fois.
 */
const requalifyFluxRemovalReason = async () => {
  const filter = {
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    "offer_status_history.reason": FLUX_REMOVAL_REASON,
  }

  const total = await getDbCollection("jobs_partners").countDocuments(filter)
  logger.info(`volet 2 — offres portant "${FLUX_REMOVAL_REASON}" : ${total} offres`)

  const { modifiedCount } = await getDbCollection("jobs_partners").updateMany(
    filter,
    { $set: { "offer_status_history.$[entry].reason": JUNE_2026_BUG_REASON } },
    { arrayFilters: [{ "entry.reason": FLUX_REMOVAL_REASON }] }
  )

  logger.info(`volet 2 — ${modifiedCount}/${total} offres requalifiées en "${JUNE_2026_BUG_REASON}"`)
}

/**
 * Volet 3 — reprise de stock des clôtures manuelles.
 *
 * Une offre close portant un `job_status_comment` a forcément été clôturée par un humain via la
 * modale : aucune annulation automatique (expiration, seuil de candidatures, doublons, retrait du
 * flux) ne renseigne ce champ. On trace donc ces clôtures sous un libellé unique, `reason` ne servant
 * pas ici à véhiculer le motif — celui-ci reste lisible dans `job_status_comment`, qui n'est pas
 * touché.
 *
 * Filtré sur `partner_label: OFFRES_EMPLOI_LBA` : ce champ n'est normalement écrit que sur ces offres,
 * et ce garde-fou évite de tracer par erreur d'autres partenaires. Une entrée n'est ajoutée que si
 * l'offre n'a pas déjà la sienne, ce qui rend le volet idempotent et non destructif — les entrées
 * existantes sont conservées, jamais remplacées.
 */
const recordManualClosures = async () => {
  for (const status of CLOSED_STATUSES) {
    // $nin: [null, ""] exclut aussi le champ absent, symétriquement au volet 1.
    const filter = {
      job_status_comment: { $nin: [null, ""] },
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status: status,
      offer_status_history: { $not: { $elemMatch: { status, reason: MANUAL_CLOSURE_REASON } } },
    }

    const total = await getDbCollection("jobs_partners").countDocuments(filter)
    logger.info(`volet 3 — offres ${status} clôturées manuellement et non tracées : ${total} offres`)

    // $ifNull : $concatArrays renvoie null si l'un de ses opérandes l'est, ce qui effacerait
    // l'historique d'un document où le champ serait absent. Le validateur de collection ne l'interdit
    // pas en production (validationAction "warn", cf. configureDbSchemaValidation), et la protection
    // est gratuite face à une perte de donnée.
    const { modifiedCount } = await getDbCollection("jobs_partners").updateMany(filter, [
      {
        $set: {
          offer_status_history: {
            $concatArrays: [{ $ifNull: ["$offer_status_history", []] }, [{ date: "$updated_at", status, reason: MANUAL_CLOSURE_REASON, granted_by: GRANTED_BY }]],
          },
        },
      },
    ])

    logger.info(`volet 3 — ${modifiedCount}/${total} offres ${status} tracées en "${MANUAL_CLOSURE_REASON}"`)
  }
}

// Aucun changement de schéma ni de contrat : un serveur de la version précédente lit sans problème
// une offre dont l'historique a gagné une entrée.
export const requireShutdown: boolean = false
