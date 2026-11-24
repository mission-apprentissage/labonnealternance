import type { Filter } from "mongodb"
import { ObjectId } from "mongodb"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import type { IClosedSiretActionLog } from "shared/models/closed-siret-actions.model"
import { CLOSED_SIRET_ACTION, CLOSED_SIRET_ORGANIZATION_TYPE, CLOSED_SIRET_REASON } from "shared/models/closed-siret-actions.model"
import { EntrepriseStatus } from "shared/models/entreprise.model"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import { getLastStatusEvent } from "shared/utils/get-last-status-event"
import { z } from "zod"
import type { IEtatAdministratifResult, IRateLimitState } from "@/common/apis/api-entreprise/api-entreprise.client"
import { getEtatAdministratifFromGouv, NO_RESPONSE_REASON } from "@/common/apis/api-entreprise/api-entreprise.client"
import { logger } from "@/common/logger"
import { sleep } from "@/common/utils/async-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { changeJobsPartnersStatus } from "@/services/job-partner-status.service"
import { modifyPermissionToUser } from "@/services/role-management.service"
import { deactivateEntreprise } from "@/services/user-recruteur.service"

export const CLOSED_SIRET_JOB_NAME = "deactivate-closed-siret-accounts"

/** Plafond de l'endpoint INSEE établissements, partagé avec le site (création de compte) : https://entreprise.api.gouv.fr/catalogue/insee/etablissements_diffusibles */
const API_ENTREPRISE_REQUESTS_PER_MINUTE = 250

/** Au-delà, le job s'arrête : insister après des 429 ou sans réponse expose l'IP à un bannissement de 12 h. */
const MAX_CONSECUTIVE_RATE_LIMITED = 3
const MAX_CONSECUTIVE_NO_RESPONSE = 10

const CANCELLABLE_OFFER_STATUSES = [JOB_STATUS_ENGLISH.ACTIVE, JOB_STATUS_ENGLISH.EN_ATTENTE, JOB_STATUS_ENGLISH.EN_MODERATION]
const DEACTIVATABLE_ROLE_STATUSES = [AccessStatus.GRANTED, AccessStatus.AWAITING_VALIDATION]

export const ZDeactivateClosedSiretOptions = z.object({
  dryRun: z.boolean().default(false).describe("Interroge l'API Entreprise et rapporte les actions sans rien écrire en base"),
  limit: z.coerce.number().int().positive().optional().describe("Nombre maximal de SIRET interrogés"),
  requestsPerMinute: z.coerce.number().int().positive().max(API_ENTREPRISE_REQUESTS_PER_MINUTE).default(200),
  rateLimitReserve: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(25)
    .describe("Requêtes laissées au site sur la minute en cours : sous ce reste (RateLimit-Remaining), le job attend la minute suivante"),
  recheckAfterDays: z.coerce
    .number()
    .nonnegative()
    .default(30)
    .describe("Ignore les organisations vérifiées plus récemment (lastUpdateFromSource) : une relance après interruption reprend où le job s'était arrêté"),
  maxTechnicalErrorRatio: z.coerce.number().min(0).max(1).default(0.05).describe("Au-delà de cette part de SIRET en erreur technique (5xx, timeout), le job termine en échec"),
})

export type IDeactivateClosedSiretOptions = z.input<typeof ZDeactivateClosedSiretOptions>

type Organization = { type: keyof typeof CLOSED_SIRET_ORGANIZATION_TYPE; _id: ObjectId; siret: string }

type ClosureContext = { runId: ObjectId; now: Date; dryRun: boolean; siret: string; dateFermeture: Date | null }

export type IDeactivateClosedSiretReport = {
  runId: string
  dryRun: boolean
  checked: number
  active: number
  closed: number
  unknown: Record<string, number>
  technicalErrors: number
  /** SIRET dont l'état a été lu mais dont le traitement en base a échoué (cf. Sentry). */
  processingErrors: number
  actions: Record<keyof typeof CLOSED_SIRET_ACTION, number>
  offersCancelled: number
  aborted: string | null
}

const getOrganizationsToCheck = async ({ recheckAfterDays, limit }: { recheckAfterDays: number; limit?: number }, now: Date): Promise<Map<string, Organization[]>> => {
  const recheckBefore = new Date(now.getTime() - recheckAfterDays * 24 * 60 * 60 * 1000)
  const notRecentlyChecked = { $or: [{ lastUpdateFromSource: null }, { lastUpdateFromSource: { $lt: recheckBefore } }] }

  const entreprises = await getDbCollection("entreprises")
    .find(notRecentlyChecked, { projection: { _id: 1, siret: 1, status: 1 } })
    .sort({ lastUpdateFromSource: 1, _id: 1 })
    .toArray()
  const cfas = await getDbCollection("cfas")
    .find(notRecentlyChecked, { projection: { _id: 1, siret: 1 } })
    .sort({ lastUpdateFromSource: 1, _id: 1 })
    .toArray()

  const organizations: Organization[] = [
    ...cfas.map(({ _id, siret }) => ({ type: CLOSED_SIRET_ORGANIZATION_TYPE.CFA, _id, siret })),
    ...entreprises
      .filter(({ status }) => getLastStatusEvent(status)?.status !== EntrepriseStatus.DESACTIVE)
      .map(({ _id, siret }) => ({ type: CLOSED_SIRET_ORGANIZATION_TYPE.ENTREPRISE, _id, siret })),
  ]

  // Un même SIRET peut porter une entreprise et un CFA : un seul appel pour les deux.
  const bySiret = new Map<string, Organization[]>()
  for (const organization of organizations) {
    if (limit !== undefined && !bySiret.has(organization.siret) && bySiret.size >= limit) continue
    bySiret.set(organization.siret, [...(bySiret.get(organization.siret) ?? []), organization])
  }
  return bySiret
}

/** Espace les appels à `requestsPerMinute` et attend la minute suivante quand le quota restant passe sous la réserve. */
const createPacer = ({ requestsPerMinute, rateLimitReserve }: { requestsPerMinute: number; rateLimitReserve: number }) => {
  const intervalMs = Math.ceil(60_000 / requestsPerMinute)
  let nextAt = 0
  return {
    waitTurn: async () => {
      const waitMs = nextAt - Date.now()
      if (waitMs > 0) await sleep(waitMs)
      nextAt = Date.now() + intervalMs
    },
    observe: ({ remaining, resetAt }: IRateLimitState) => {
      if (remaining !== null && remaining <= rateLimitReserve && resetAt) {
        nextAt = Math.max(nextAt, resetAt.getTime() + 1000)
      }
    },
  }
}

const pushAction = async (ctx: ClosureContext, organization: Organization, action: Pick<IClosedSiretActionLog, "action"> & Partial<IClosedSiretActionLog>) => {
  if (ctx.dryRun) return
  await getDbCollection("closed_siret_actions").insertOne({
    _id: new ObjectId(),
    run_id: ctx.runId,
    createdAt: ctx.now,
    siret: ctx.siret,
    date_fermeture: ctx.dateFermeture,
    organization_type: organization.type,
    organization_id: organization._id,
    role_id: null,
    user_id: null,
    cfa_id: null,
    offers_count: null,
    ...action,
  })
}

const deactivateRoles = async (ctx: ClosureContext, organization: Organization, report: IDeactivateClosedSiretReport) => {
  const authorized_type = organization.type === CLOSED_SIRET_ORGANIZATION_TYPE.CFA ? AccessEntityType.CFA : AccessEntityType.ENTREPRISE
  const roles = await getDbCollection("rolemanagements").find({ authorized_type, authorized_id: organization._id.toString() }).toArray()
  for (const role of roles) {
    const lastStatus = getLastStatusEvent(role.status)?.status
    if (!lastStatus || !DEACTIVATABLE_ROLE_STATUSES.includes(lastStatus)) continue
    if (!ctx.dryRun) {
      await modifyPermissionToUser(
        { user_id: role.user_id, authorized_id: role.authorized_id, authorized_type: role.authorized_type },
        { status: AccessStatus.DENIED, reason: CLOSED_SIRET_REASON, validation_type: VALIDATION_UTILISATEUR.AUTO, granted_by: CLOSED_SIRET_JOB_NAME }
      )
    }
    await pushAction(ctx, organization, { action: CLOSED_SIRET_ACTION.ROLE_DESACTIVE, role_id: role._id, user_id: role.user_id })
    report.actions.ROLE_DESACTIVE++
  }
}

const cancelOffers = async (ctx: ClosureContext, organization: Organization, filter: Filter<IJobsPartnersOfferPrivate>, report: IDeactivateClosedSiretReport) => {
  const offersFilter = { ...filter, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, offer_status: { $in: CANCELLABLE_OFFER_STATUSES } }
  const count = ctx.dryRun
    ? await getDbCollection("jobs_partners").countDocuments(offersFilter)
    : (
        await changeJobsPartnersStatus(offersFilter, {
          status: JOB_STATUS_ENGLISH.ANNULEE,
          reason: CLOSED_SIRET_REASON,
          grantedBy: CLOSED_SIRET_JOB_NAME,
          date: ctx.now,
        })
      ).modifiedCount
  if (!count) return
  await pushAction(ctx, organization, { action: CLOSED_SIRET_ACTION.OFFRES_ANNULEES, offers_count: count })
  report.actions.OFFRES_ANNULEES++
  report.offersCancelled += count
}

const closeEntreprise = async (ctx: ClosureContext, organization: Organization, report: IDeactivateClosedSiretReport) => {
  const entreprise = await getDbCollection("entreprises").findOne({ _id: organization._id }, { projection: { status: 1 } })
  if (entreprise && getLastStatusEvent(entreprise.status)?.status !== EntrepriseStatus.DESACTIVE) {
    if (!ctx.dryRun) await deactivateEntreprise(organization._id, CLOSED_SIRET_REASON)
    await pushAction(ctx, organization, { action: CLOSED_SIRET_ACTION.ENTREPRISE_DESACTIVEE })
    report.actions.ENTREPRISE_DESACTIVEE++
  }

  await deactivateRoles(ctx, organization, report)

  const cfaLinks = await getDbCollection("entreprise_managed_by_cfa").find({ entreprise_id: organization._id }).toArray()
  for (const link of cfaLinks) {
    if (!ctx.dryRun) await getDbCollection("entreprise_managed_by_cfa").deleteOne({ _id: link._id })
    await pushAction(ctx, organization, { action: CLOSED_SIRET_ACTION.RETRAIT_DU_CFA, cfa_id: link.cfa_id })
    report.actions.RETRAIT_DU_CFA++
  }

  // Offres du recruteur comme offres déléguées par un CFA : toutes portent le SIRET de l'entreprise.
  await cancelOffers(ctx, organization, { workplace_siret: ctx.siret }, report)
}

const closeCfa = async (ctx: ClosureContext, organization: Organization, report: IDeactivateClosedSiretReport) => {
  await deactivateRoles(ctx, organization, report)
  await cancelOffers(ctx, organization, { cfa_siret: ctx.siret }, report)
}

const formatReport = (report: IDeactivateClosedSiretReport, durationMs: number): string => {
  const unknown = Object.entries(report.unknown)
    .map(([reason, count]) => `${reason} : ${count}`)
    .join(", ")
  return [
    report.dryRun ? "*Dry-run* : aucune écriture en base." : null,
    report.aborted ? `*Arrêt anticipé* : ${report.aborted}. Une relance reprend les SIRET non vérifiés.` : null,
    `SIRET interrogés : ${report.checked} (actifs ${report.active}, fermés ${report.closed}, non concluants ${report.checked - report.active - report.closed}${unknown ? ` : ${unknown}` : ""})`,
    report.processingErrors ? `*SIRET en échec de traitement* : ${report.processingErrors} (cf. Sentry)` : null,
    `Entreprises désactivées : ${report.actions.ENTREPRISE_DESACTIVEE}`,
    `Rôles désactivés : ${report.actions.ROLE_DESACTIVE}`,
    `Entreprises retirées d'un CFA : ${report.actions.RETRAIT_DU_CFA}`,
    `Offres annulées : ${report.offersCancelled}`,
    `Durée : ${Math.round(durationMs / 60_000)} min. Journal : collection closed_siret_actions, run_id ${report.runId}`,
  ]
    .filter(Boolean)
    .join("\n")
}

const applyEtatAdministratif = async (
  {
    siret,
    organizations,
    etat,
    dateFermeture,
    runId,
    dryRun,
  }: { siret: string; organizations: Organization[]; etat: "A" | "F"; dateFermeture: Date | null; runId: ObjectId; dryRun: boolean },
  report: IDeactivateClosedSiretReport
) => {
  const now = new Date()
  if (etat === "A") {
    report.active++
  } else {
    report.closed++
    const ctx: ClosureContext = { runId, now, dryRun, siret, dateFermeture }
    for (const organization of organizations) {
      if (organization.type === CLOSED_SIRET_ORGANIZATION_TYPE.CFA) {
        await closeCfa(ctx, organization, report)
      } else {
        await closeEntreprise(ctx, organization, report)
      }
    }
    if (!dryRun) {
      // La création de compte lit l'état administratif dans ce cache, sans expiration : sans cette mise à jour, le
      // SIRET fermé resterait accepté (cf. getEntrepriseDataFromSiret).
      await getDbCollection("cache_siret").updateOne({ siret, "data.data": { $exists: true } }, { $set: { "data.data.etat_administratif": "F", updatedAt: now } })
    }
  }

  if (!dryRun) {
    const ids = (type: Organization["type"]) => organizations.filter((organization) => organization.type === type).map(({ _id }) => _id)
    await getDbCollection("entreprises").updateMany({ _id: { $in: ids(CLOSED_SIRET_ORGANIZATION_TYPE.ENTREPRISE) } }, { $set: { lastUpdateFromSource: now } })
    await getDbCollection("cfas").updateMany({ _id: { $in: ids(CLOSED_SIRET_ORGANIZATION_TYPE.CFA) } }, { $set: { lastUpdateFromSource: now } })
  }
}

/**
 * Désactive les comptes recruteurs et CFA dont le SIRET est fermé à l'INSEE (#5437). Règles et champs modifiés :
 * docs/desactivation-siret-fermes.md.
 */
export const deactivateClosedSiretAccounts = async (rawOptions: IDeactivateClosedSiretOptions = {}): Promise<IDeactivateClosedSiretReport> => {
  const options = ZDeactivateClosedSiretOptions.parse(rawOptions)
  const startedAt = Date.now()
  const runId = new ObjectId()
  const report: IDeactivateClosedSiretReport = {
    runId: runId.toString(),
    dryRun: options.dryRun,
    checked: 0,
    active: 0,
    closed: 0,
    unknown: {},
    technicalErrors: 0,
    processingErrors: 0,
    actions: { ENTREPRISE_DESACTIVEE: 0, ROLE_DESACTIVE: 0, OFFRES_ANNULEES: 0, RETRAIT_DU_CFA: 0 },
    offersCancelled: 0,
    aborted: null,
  }

  const organizationsBySiret = await getOrganizationsToCheck(options, new Date())
  logger.info({ dryRun: options.dryRun, runId: report.runId }, `${CLOSED_SIRET_JOB_NAME}: ${organizationsBySiret.size} SIRET à vérifier`)

  const pacer = createPacer(options)
  let consecutiveRateLimited = 0
  let consecutiveNoResponse = 0

  for (const [siret, organizations] of organizationsBySiret) {
    let result: IEtatAdministratifResult | null = null
    while (result === null) {
      await pacer.waitTurn()
      const response = await getEtatAdministratifFromGouv(siret)
      pacer.observe(response.rateLimit)
      if (response.result.kind !== "rate_limited") {
        consecutiveRateLimited = 0
        result = response.result
        break
      }
      consecutiveRateLimited++
      if (consecutiveRateLimited >= MAX_CONSECUTIVE_RATE_LIMITED) {
        report.aborted = `${consecutiveRateLimited} réponses 429 consécutives`
        break
      }
      await sleep(response.result.retryAfterMs)
    }
    if (result === null) break
    report.checked++

    if (result.kind === "unknown") {
      report.unknown[result.reason] = (report.unknown[result.reason] ?? 0) + 1
      if (result.technical) report.technicalErrors++
      consecutiveNoResponse = result.reason === NO_RESPONSE_REASON ? consecutiveNoResponse + 1 : 0
      if (consecutiveNoResponse >= MAX_CONSECUTIVE_NO_RESPONSE) {
        report.aborted = `${consecutiveNoResponse} appels consécutifs sans réponse (IP bannie ou API indisponible)`
        break
      }
      continue
    }
    consecutiveNoResponse = 0

    try {
      await applyEtatAdministratif({ siret, organizations, etat: result.etat, dateFermeture: result.dateFermeture, runId, dryRun: options.dryRun }, report)
    } catch (error) {
      report.processingErrors++
      sentryCaptureException(error, { extra: { siret, runId: report.runId } })
    }
  }

  const technicalErrorRatio = report.checked ? report.technicalErrors / report.checked : 0
  const failed = report.aborted !== null || report.processingErrors > 0 || technicalErrorRatio > options.maxTechnicalErrorRatio
  const message = formatReport(report, Date.now() - startedAt)
  logger.info(`${CLOSED_SIRET_JOB_NAME}: ${message}`)
  await notifyToSlack({ subject: "Désactivation des comptes à SIRET fermé", message, error: failed })

  if (report.aborted) {
    throw new Error(`${CLOSED_SIRET_JOB_NAME}: arrêt anticipé, ${report.aborted}`)
  }
  if (failed) {
    throw new Error(
      `${CLOSED_SIRET_JOB_NAME}: ${report.processingErrors} SIRET en échec de traitement, ${report.technicalErrors} erreurs techniques API sur ${report.checked} SIRET (seuil ${options.maxTechnicalErrorRatio})`
    )
  }
  return report
}
