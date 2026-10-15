import type { ObjectId } from "mongodb"

import { notifyToSlack } from "@/common/utils/slack-utils"
import config from "@/config"

const SUBJECT = "MODÉRATION DES OFFRES"

// En attendant le back-office de revue (#5499) : la page du recruteur dans l'administration liste ses offres.
const backOfficeLink = (managedBy: ObjectId | null | undefined) => (managedBy ? `${config.publicUrl}/espace-pro/administration/users/${managedBy}` : "recruteur inconnu")

// Alertes provisoires sur le webhook des jobs, en attendant le socle #5421 : identifiants techniques seulement, aucun texte d'offre.
export const alertOffreNonConforme = async ({ _id, managed_by }: { _id: ObjectId; managed_by?: ObjectId | null }) =>
  notifyToSlack({ subject: SUBJECT, message: `Offre ${_id} bloquée : non conforme selon le classifieur. ${backOfficeLink(managed_by)}`, error: true })

export const alertClassifierIndisponible = async ({ jobName, pendingCount }: { jobName: string; pendingCount: number }) =>
  notifyToSlack({
    subject: SUBJECT,
    message: `Classifieur indisponible (${jobName}) : exécution interrompue au premier échec, ${pendingCount} offre(s) en attente d'une nouvelle tentative.`,
    error: true,
  })

export const alertClassifierRetryEpuise = async (offers: { _id: ObjectId; managed_by?: ObjectId | null }[]) =>
  notifyToSlack({
    subject: SUBJECT,
    message: `${offers.length} offre(s) bloquée(s) sans verdict après toutes les nouvelles tentatives, reprise quotidienne : ${offers.map(({ _id, managed_by }) => `${_id} (${backOfficeLink(managed_by)})`).join(", ")}`,
    error: true,
  })
