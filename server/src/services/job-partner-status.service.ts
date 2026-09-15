import type { Filter, UpdateFilter } from "mongodb"
import type { ComputedUserAccess } from "shared/models/computed-user-access.model"
import type { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOB_CLOSURE_ORIGIN } from "shared/models/job.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"

import { getDbCollection } from "@/common/utils/mongodb-utils"

export type IJobStatusChange = {
  status: JOB_STATUS_ENGLISH
  /** Motif du changement. C'est la valeur regroupée dans les tableaux de bord : préférer un libellé stable à une phrase construite. */
  reason: string
  /** Origine du changement : nom du cron, du module appelant, ou email de l'administrateur. */
  grantedBy: string
  /** Horodatage partagé par le $set et la trace, pour qu'ils ne divergent pas. Par défaut : maintenant. */
  date?: Date
  /** Champs métier écrits dans le même update (offer_expiration, managed_by...). Ne peut pas écraser offer_status ni updated_at. */
  extraSet?: Partial<IJobsPartnersOfferPrivate>
}

/**
 * Construit l'update Mongo d'un changement de statut d'offre : $set du statut et $push de la trace
 * correspondante dans offer_status_history, indissociables.
 *
 * Passer par ce constructeur plutôt que de réécrire les deux opérateurs site par site est ce qui
 * garantit qu'une offre ne peut pas changer de statut sans être tracée. Le $push recopié à la main
 * avait été oublié sur quatre chemins — clôture par le recruteur, archivage du formulaire,
 * anonymisation des comptes, anonymisation des offres — d'où des offres Cancelled avec
 * offer_status_history vide, sans aucun motif exploitable pour la mesure d'impact (issue #5429).
 *
 * `updated_at` est toujours rafraîchi : le cron delta search_items (syncSearchItemsDelta) s'en sert
 * pour retirer l'offre de l'index de recherche.
 *
 * Renvoie un document d'update utilisable tel quel par updateOne, updateMany, findOneAndUpdate et
 * les opérations bulkWrite. Les annulations écrites en pipeline d'agrégation
 * (cf. cancelRemovedJobsPartners, qui concatène l'historique avec $concatArrays) ne peuvent pas
 * l'utiliser et restent à jour manuellement.
 */
export const buildJobStatusChangeUpdate = ({ status, reason, grantedBy, date = new Date(), extraSet }: IJobStatusChange): UpdateFilter<IJobsPartnersOfferPrivate> => ({
  $set: { ...extraSet, offer_status: status, updated_at: date },
  $push: { offer_status_history: { date, status, reason, granted_by: grantedBy } },
})

/** Applique un changement de statut tracé à toutes les offres correspondant au filtre. */
export const changeJobsPartnersStatus = async (filter: Filter<IJobsPartnersOfferPrivate>, change: IJobStatusChange) =>
  getDbCollection("jobs_partners").updateMany(filter, buildJobStatusChangeUpdate(change))

/**
 * Déduit l'acteur d'une clôture faite depuis l'espace pro (PUT /formulaire/offre/f/:jobId/cancel).
 *
 * Les quatre rôles qui portent `job:manage` — administrateur, OPCO, CFA délégataire, recruteur
 * propriétaire — empruntent la même route. `req.userAccess` est déjà calculé par le middleware
 * d'autorisation, il n'y a donc aucune requête supplémentaire à faire ici.
 *
 * `admin` est le seul discriminant certain : le middleware court-circuite pour un administrateur et
 * renvoie `admin: true` avec toutes les autres listes vides, une session administrateur ne peut donc
 * pas être confondue. Les trois autres se lisent sur les rôles détenus par l'utilisateur, et non sur
 * son lien avec l'offre visée : un utilisateur cumulant un rôle CFA et un rôle entreprise serait
 * étiqueté CFA même en clôturant l'offre de sa propre entreprise. Cas rare, et la dégradation reste
 * lisible — le canal, lui, est toujours juste. Une attribution exacte demanderait de comparer les
 * rôles au `workplace_siret` / `cfa_siret` de l'offre.
 */
export const resolveEspaceProClosureOrigin = (userAccess: ComputedUserAccess | undefined): JOB_CLOSURE_ORIGIN => {
  if (!userAccess) return JOB_CLOSURE_ORIGIN.ESPACE_PRO_INDETERMINE
  if (userAccess.admin) return JOB_CLOSURE_ORIGIN.ESPACE_PRO_ADMIN
  if (userAccess.opcos.length) return JOB_CLOSURE_ORIGIN.ESPACE_PRO_OPCO
  if (userAccess.cfas.length) return JOB_CLOSURE_ORIGIN.ESPACE_PRO_CFA
  if (userAccess.entreprises.length) return JOB_CLOSURE_ORIGIN.ESPACE_PRO_RECRUTEUR
  return JOB_CLOSURE_ORIGIN.ESPACE_PRO_INDETERMINE
}
