import { ObjectId } from "mongodb"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IRoleManagement } from "shared/models/role-management.model"
import { AccessEntityType, AccessStatus, CFA_NOT_REFERENCED_REASON } from "shared/models/role-management.model"
import { getLastStatusEvent } from "shared/utils/get-last-status-event"
import { z } from "zod"

import { getReferentielOrganismePresence, getReferentielOrganismesSirets } from "@/common/apis/referentiel-organismes/referentiel-organismes.client"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { changeJobsPartnersStatus } from "@/services/job-partner-status.service"
import { modifyPermissionToUser } from "@/services/role-management.service"

export const UNREFERENCED_CFA_JOB_NAME = "deactivate-unreferenced-cfa-accounts"

const CANCELLABLE_OFFER_STATUSES = [JOB_STATUS_ENGLISH.ACTIVE, JOB_STATUS_ENGLISH.EN_ATTENTE, JOB_STATUS_ENGLISH.EN_MODERATION]
const DEACTIVATABLE_ROLE_STATUSES = [AccessStatus.GRANTED, AccessStatus.AWAITING_VALIDATION]

/** Au-delà, le Référentiel est tenu pour indisponible : continuer ne ferait qu'empiler des erreurs. */
const MAX_CONSECUTIVE_ERRORS = 10

/** Nombre de CFA cités nommément dans le message Slack, le reste est résumé. */
const SLACK_LIST_LIMIT = 50

export const ZDeactivateUnreferencedCfaOptions = z.object({
  dryRun: z.boolean().default(false).describe("Interroge le Référentiel et liste les CFA concernés sans rien écrire en base"),
  minReferentielSize: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(5000)
    .describe("En dessous de ce nombre d'organismes, la liste du Référentiel est tenue pour incomplète et le job s'arrête avant toute écriture"),
  maxDeactivationRatio: z.coerce
    .number()
    .min(0)
    .max(1)
    .default(0.1)
    .describe("Au-delà de cette part des CFA à compte actif absents de la liste, le job s'arrête avant toute écriture"),
})

export type IDeactivateUnreferencedCfaOptions = z.input<typeof ZDeactivateUnreferencedCfaOptions>

type UnreferencedCfa = { _id: ObjectId; siret: string; raison_sociale: string | null }

export type IDeactivateUnreferencedCfaReport = {
  dryRun: boolean
  referentielSize: number
  /** CFA ayant au moins un rôle GRANTED ou AWAITING_VALIDATION. */
  cfasWithActiveRole: number
  /** Rôles actifs dont le CFA n'existe plus en base : ignorés. */
  rolesWithoutCfa: number
  /** CFA absents de la liste complète, avant confirmation SIRET par SIRET. */
  absentFromList: number
  /** CFA absents de la liste mais trouvés à l'appel unitaire : laissés intacts. */
  presentOnRecheck: number
  technicalErrors: number
  processingErrors: number
  deactivatedCfas: UnreferencedCfa[]
  rolesDenied: number
  offersCancelled: number
  aborted: string | null
}

const getActiveCfaRoles = async (): Promise<Map<string, IRoleManagement[]>> => {
  const roles = await getDbCollection("rolemanagements").find({ authorized_type: AccessEntityType.CFA }).toArray()
  const byCfaId = new Map<string, IRoleManagement[]>()
  for (const role of roles) {
    const lastStatus = getLastStatusEvent(role.status)?.status
    if (!lastStatus || !DEACTIVATABLE_ROLE_STATUSES.includes(lastStatus)) continue
    byCfaId.set(role.authorized_id, [...(byCfaId.get(role.authorized_id) ?? []), role])
  }
  return byCfaId
}

const deactivateCfa = async (cfa: UnreferencedCfa, roles: IRoleManagement[], dryRun: boolean, report: IDeactivateUnreferencedCfaReport) => {
  // Offres avant rôles : un CFA n'est resélectionné que par ses rôles actifs (cf. getActiveCfaRoles). Rôles désactivés
  // en premier, un échec sur les offres les laisserait diffusées sans reprise possible.
  const offersFilter = { cfa_siret: cfa.siret, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, offer_status: { $in: CANCELLABLE_OFFER_STATUSES } }
  report.offersCancelled += dryRun
    ? await getDbCollection("jobs_partners").countDocuments(offersFilter)
    : (
        await changeJobsPartnersStatus(offersFilter, {
          status: JOB_STATUS_ENGLISH.ANNULEE,
          reason: CFA_NOT_REFERENCED_REASON,
          grantedBy: UNREFERENCED_CFA_JOB_NAME,
          date: new Date(),
        })
      ).modifiedCount

  for (const role of roles) {
    if (!dryRun) {
      await modifyPermissionToUser(
        { user_id: role.user_id, authorized_id: role.authorized_id, authorized_type: role.authorized_type },
        { status: AccessStatus.DENIED, reason: CFA_NOT_REFERENCED_REASON, validation_type: VALIDATION_UTILISATEUR.AUTO, granted_by: UNREFERENCED_CFA_JOB_NAME }
      )
    }
    report.rolesDenied++
  }
  report.deactivatedCfas.push(cfa)
}

const formatReport = (report: IDeactivateUnreferencedCfaReport, failed: boolean): string => {
  const listed = report.deactivatedCfas.slice(0, SLACK_LIST_LIMIT).map(({ siret, raison_sociale }) => `• ${siret}${raison_sociale ? ` ${raison_sociale}` : ""}`)
  const hidden = report.deactivatedCfas.length - listed.length
  return [
    report.dryRun ? "*Dry-run* : aucune écriture en base." : null,
    report.aborted ? `*Arrêt* : ${report.aborted}` : null,
    failed && !report.aborted ? "*Échec partiel* : cf. erreurs ci-dessous et Sentry." : null,
    `Organismes au Référentiel : ${report.referentielSize}`,
    `CFA à compte actif : ${report.cfasWithActiveRole}, absents de la liste : ${report.absentFromList}`,
    report.presentOnRecheck ? `Trouvés à l'appel unitaire, laissés intacts : ${report.presentOnRecheck}` : null,
    report.technicalErrors ? `*Erreurs techniques du Référentiel* : ${report.technicalErrors} CFA non vérifiés` : null,
    report.processingErrors ? `*CFA en échec de traitement* : ${report.processingErrors}` : null,
    report.rolesWithoutCfa ? `Rôles actifs sans CFA en base, ignorés : ${report.rolesWithoutCfa}` : null,
    `CFA ${report.dryRun ? "à désactiver" : "désactivés"} : ${report.deactivatedCfas.length} (rôles ${report.rolesDenied}, offres annulées ${report.offersCancelled})`,
    ...listed,
    hidden > 0 ? `… et ${hidden} autres (cf. logs du job)` : null,
  ]
    .filter(Boolean)
    .join("\n")
}

/**
 * Désactive les comptes des CFA dont le SIRET n'est plus au Référentiel Onisep (#3316). Règles et garde-fous :
 * docs/desactivation-cfa-non-references.md.
 */
export const deactivateUnreferencedCfaAccounts = async (rawOptions: IDeactivateUnreferencedCfaOptions = {}): Promise<IDeactivateUnreferencedCfaReport> => {
  const options = ZDeactivateUnreferencedCfaOptions.parse(rawOptions)
  const report: IDeactivateUnreferencedCfaReport = {
    dryRun: options.dryRun,
    referentielSize: 0,
    cfasWithActiveRole: 0,
    rolesWithoutCfa: 0,
    absentFromList: 0,
    presentOnRecheck: 0,
    technicalErrors: 0,
    processingErrors: 0,
    deactivatedCfas: [],
    rolesDenied: 0,
    offersCancelled: 0,
    aborted: null,
  }

  let referentielSirets: Set<string> | null = null
  try {
    referentielSirets = await getReferentielOrganismesSirets()
    report.referentielSize = referentielSirets.size
  } catch (error) {
    report.aborted = `lecture du Référentiel impossible : ${error instanceof Error ? error.message : String(error)}`
    sentryCaptureException(error)
  }

  if (referentielSirets) {
    const referenced = referentielSirets
    const rolesByCfaId = await getActiveCfaRoles()
    const cfas = await getDbCollection("cfas")
      .find({ _id: { $in: [...rolesByCfaId.keys()].filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id)) } }, { projection: { _id: 1, siret: 1, raison_sociale: 1 } })
      .sort({ siret: 1 })
      .toArray()
    report.cfasWithActiveRole = cfas.length
    const foundIds = new Set(cfas.map(({ _id }) => _id.toString()))
    for (const [cfaId, roles] of rolesByCfaId) {
      if (!foundIds.has(cfaId)) report.rolesWithoutCfa += roles.length
    }

    const absent = cfas.filter(({ siret }) => !referenced.has(siret))
    report.absentFromList = absent.length

    if (report.referentielSize < options.minReferentielSize) {
      report.aborted = `${report.referentielSize} organismes reçus du Référentiel, moins que le minimum attendu (${options.minReferentielSize})`
    } else if (report.cfasWithActiveRole && absent.length / report.cfasWithActiveRole > options.maxDeactivationRatio) {
      report.aborted = `${absent.length} CFA sur ${report.cfasWithActiveRole} absents de la liste, au-delà du seuil de ${options.maxDeactivationRatio * 100} % (option --max-deactivation-ratio)`
    } else {
      let consecutiveErrors = 0
      for (const cfa of absent) {
        const presence = await getReferentielOrganismePresence(cfa.siret)
        if (presence.kind === "error") {
          report.technicalErrors++
          consecutiveErrors++
          logger.warn(`${UNREFERENCED_CFA_JOB_NAME}: SIRET ${cfa.siret} non vérifié (${presence.reason})`)
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            report.aborted = `${consecutiveErrors} erreurs consécutives du Référentiel (dernière : ${presence.reason})`
            break
          }
          continue
        }
        consecutiveErrors = 0
        if (presence.kind === "present") {
          report.presentOnRecheck++
          continue
        }
        try {
          await deactivateCfa({ _id: cfa._id, siret: cfa.siret, raison_sociale: cfa.raison_sociale ?? null }, rolesByCfaId.get(cfa._id.toString()) ?? [], options.dryRun, report)
        } catch (error) {
          report.processingErrors++
          sentryCaptureException(error, { extra: { siret: cfa.siret } })
        }
      }
    }
  }

  const failed = report.aborted !== null || report.technicalErrors > 0 || report.processingErrors > 0
  const message = formatReport(report, failed)
  logger.info(`${UNREFERENCED_CFA_JOB_NAME}: ${message}`)
  if (report.deactivatedCfas.length > SLACK_LIST_LIMIT) {
    logger.info(`${UNREFERENCED_CFA_JOB_NAME}: SIRET ${report.dryRun ? "à désactiver" : "désactivés"} : ${report.deactivatedCfas.map(({ siret }) => siret).join(", ")}`)
  }
  await notifyToSlack({ subject: "Désactivation des CFA absents du Référentiel", message, error: failed })

  if (failed) {
    throw new Error(
      `${UNREFERENCED_CFA_JOB_NAME}: ${report.aborted ?? `${report.technicalErrors} erreurs techniques du Référentiel, ${report.processingErrors} CFA en échec de traitement`}`
    )
  }
  return report
}
