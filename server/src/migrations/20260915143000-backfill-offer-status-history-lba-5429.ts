import { JOB_STATUS_ENGLISH } from "shared"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

const GRANTED_BY = "20260915143000-backfill-offer-status-history-lba-5429"

/** Motif posé par cancelRemovedJobsPartners, impossible à obtenir légitimement sur une offre LBA. */
const FLUX_REMOVAL_REASON = "supprimée du flux source"
const JUNE_2026_BUG_REASON = "bug du 06 2026"

/**
 * Reconstitue une trace de clôture sur les offres OFFRES_EMPLOI_LBA closes dont
 * `offer_status_history` est resté vide (issue #5429).
 *
 * Quatre chemins changeaient le statut sans pousser d'entrée — clôture par le recruteur, archivage
 * du formulaire, anonymisation des comptes, anonymisation des offres. Le correctif les branche sur
 * `buildJobStatusChangeUpdate`, mais les offres déjà closes gardent un historique vide : les
 * tableaux de bord ne peuvent pas distinguer « annulée sans motif connu » de « donnée absente », ce
 * qui est précisément le trou de mesure du ticket.
 *
 * Deux populations, traitées différemment :
 *  - clôtures passées par la modale (`job_status_comment` renseigné) : le motif choisi par le
 *    recruteur existe, on le recopie tel quel dans `reason` pour qu'il soit regroupable comme les
 *    motifs écrits à partir de maintenant ;
 *  - toutes les autres : aucun motif n'a jamais été enregistré, on pose un libellé explicite plutôt
 *    que de laisser un tableau vide.
 *
 * Les statuts POURVUE et ANNULEE sont tous deux repris : ils sortent du même appel
 * (`closeOffreWithMotif`) et « pourvue avec l'aide de La bonne alternance » est la mesure d'impact
 * la plus utile du lot.
 *
 * `updated_at` sert de date faute de mieux et **n'est pas la date de clôture** : plusieurs écritures
 * ultérieures (mise à jour du SIRET, de l'OPCO, des coordonnées du recruteur) l'ont rafraîchi sans
 * changer le statut. La trace posée ici est donc datée de façon approximative, et `granted_by` la
 * marque explicitement comme reconstituée pour qu'une analyse puisse l'exclure.
 *
 * Les autres partenaires ne sont pas touchés : leurs annulations passent par des chemins qui
 * tracent déjà (expiration, retrait du flux, doublons), et leurs historiques vides sont des
 * reliquats antérieurs à l'introduction du champ le 13/02/2025.
 *
 * Second volet, indépendant : requalifier le motif "supprimée du flux source" porté par des offres
 * OFFRES_EMPLOI_LBA. Ce motif y est faux par construction — ces offres ne transitent jamais par
 * computed_jobs_partners, elles ne peuvent donc pas « disparaître d'un flux ». Elles l'ont hérité
 * d'un run de cancelRemovedJobsPartners lancé sans filtre en juin 2026 : le filtre était alors
 * optionnel et le job exposé tel quel en CLI, si bien qu'un appel sans argument annulait tout le
 * catalogue actif, tous partenaires confondus. Corrigé depuis par #4814 (filtre obligatoire, garde
 * runtime, sous-jobs dédiés), et la donnée partiellement réparée par #4813 — qui n'a réactivé que
 * les offres non expirées, laissant les autres définitivement closes avec ce motif trompeur.
 */
export const up = async () => {
  const filter = {
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    offer_status: { $in: [JOB_STATUS_ENGLISH.ANNULEE, JOB_STATUS_ENGLISH.POURVUE] },
    offer_status_history: { $size: 0 },
  }

  const total = await getDbCollection("jobs_partners").countDocuments(filter)
  logger.info(`backfill offer_status_history : ${total} offres closes sans historique`)

  // Pipeline d'update : la trace dépend de champs du document (statut, motif, updated_at), qu'un
  // update classique ne sait pas lire. $ifNull couvre à la fois le champ absent et la valeur null.
  const { modifiedCount } = await getDbCollection("jobs_partners").updateMany(filter, [
    {
      $set: {
        offer_status_history: [
          {
            date: "$updated_at",
            status: "$offer_status",
            reason: { $ifNull: ["$job_status_comment", "motif non enregistré (clôture antérieure au correctif #5429)"] },
            granted_by: GRANTED_BY,
          },
        ],
      },
    },
  ])

  logger.info(`backfill offer_status_history : ${modifiedCount}/${total} offres complétées`)

  // Requalification du motif hérité du run sans filtre de juin 2026. Pas de filtre sur offer_status :
  // les offres réactivées par #4813 portent toujours l'entrée fautive dans leur historique, à côté de
  // leur entrée de réactivation. arrayFilters requalifie chaque entrée concernée et laisse les autres
  // intactes — une offre peut avoir été annulée puis réactivée plusieurs fois.
  const fluxRemovalFilter = {
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    "offer_status_history.reason": FLUX_REMOVAL_REASON,
  }
  const fluxRemovalTotal = await getDbCollection("jobs_partners").countDocuments(fluxRemovalFilter)
  logger.info(`requalification "${FLUX_REMOVAL_REASON}" : ${fluxRemovalTotal} offres concernées`)

  const { modifiedCount: requalified } = await getDbCollection("jobs_partners").updateMany(
    fluxRemovalFilter,
    { $set: { "offer_status_history.$[entry].reason": JUNE_2026_BUG_REASON } },
    { arrayFilters: [{ "entry.reason": FLUX_REMOVAL_REASON }] }
  )

  logger.info(`requalification "${FLUX_REMOVAL_REASON}" : ${requalified}/${fluxRemovalTotal} offres requalifiées en "${JUNE_2026_BUG_REASON}"`)
}

// Aucun changement de schéma ni de contrat : un serveur de la version précédente lit sans problème
// une offre dont l'historique est passé de [] à une entrée.
export const requireShutdown: boolean = false
