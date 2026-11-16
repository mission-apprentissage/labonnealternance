import type { ObjectId } from "mongodb"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import type { IDetectionMetrics } from "shared/models/detection-alerts.model"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import { z } from "zod"

import { isFreeEmailProviderDomain } from "@/common/utils/mail-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import type { IDetectionFinding, IDetectionRule } from "@/jobs/detection/detection-rule"
import { API_KEY_CREATION_REASON } from "@/services/auto-validation-reasons"
import { getRolesWindowFilter } from "./auto-validation-rate-alert"

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

// Le texte d'un webhook Slack est coupé vers 4 000 caractères : la liste complète reste dans les métriques de l'alerte.
const LISTED_ACCOUNTS = 30
const LINKED_ACCOUNTS = 10

export type IDomainKind = "webmail" | "entreprise"

/** Créations sur un domaine : un compte est un utilisateur dont un rôle entreprise ou CFA a été créé sur la période. */
export type IDomainCreations = {
  domain: string
  accountIds: ObjectId[]
  baselineAccounts: number
  entrepriseRoles: number
  cfaRoles: number
  grantedRoles: number
  awaitingRoles: number
  deniedRoles: number
  autoValidatedRoles: number
  firstCreatedAt: Date | null
  lastCreatedAt: Date | null
}

export type ICreationTotals = { windowAccounts: number; baselineAccounts: number }

const thresholdsSchema = z.strictObject({
  windowHours: z.number().int().positive().default(72).describe("Fenêtre glissante des créations de comptes"),
  baselineDays: z.number().int().positive().default(28).describe("Référence : jours précédant la fenêtre"),
  companyMinAccounts: z.number().int().positive().default(10).describe("Comptes créés sur la fenêtre, domaine d'entreprise"),
  companySpikeRatio: z.number().gte(1).default(3).describe("Multiple du volume attendu du domaine, domaine d'entreprise"),
  webmailMinAccounts: z.number().int().positive().default(10).describe("Comptes créés sur la fenêtre, webmail grand public ou jetable"),
  webmailSpikeRatio: z.number().gte(1).default(3).describe("Multiple du volume attendu du domaine, webmail grand public ou jetable"),
})

export type IDomainSpikeThresholds = z.output<typeof thresholdsSchema>

export const domainKind = (domain: string): IDomainKind => (isFreeEmailProviderDomain(domain) ? "webmail" : "entreprise")

/**
 * Volume attendu du domaine sur la fenêtre : sa part des comptes de la référence, appliquée au total de la fenêtre.
 * Une hausse générale, comme à la rentrée, relève d'autant le volume attendu de chaque domaine.
 */
export const expectedAccounts = (domainBaselineAccounts: number, { windowAccounts, baselineAccounts }: ICreationTotals) =>
  baselineAccounts ? (domainBaselineAccounts * windowAccounts) / baselineAccounts : 0

/** Un domaine sans historique n'a que le seuil absolu à franchir ; un domaine habituel doit aussi s'écarter de son volume. */
export const evaluateDomainSpike = (
  creations: Pick<IDomainCreations, "domain" | "accountIds" | "baselineAccounts">,
  totals: ICreationTotals,
  thresholds: IDomainSpikeThresholds
) => {
  const kind = domainKind(creations.domain)
  const [minAccounts, spikeRatio] =
    kind === "webmail" ? [thresholds.webmailMinAccounts, thresholds.webmailSpikeRatio] : [thresholds.companyMinAccounts, thresholds.companySpikeRatio]
  const accounts = creations.accountIds.length
  const expected = expectedAccounts(creations.baselineAccounts, totals)
  // Tolérance de virgule flottante, cf. isBelow (auto-validation-rate-alert).
  return { kind, accounts, expected, alert: accounts >= minAccounts && accounts >= spikeRatio * expected - 1e-9 }
}

const countInWindow = (condition: unknown) => ({ $sum: { $cond: [{ $and: ["$in_window", condition] }, 1, 0] } })

// Statut courant : le dernier événement par date, cf. getLastStatusEvent.
const currentStatus = { $getField: { field: "status", input: { $last: { $sortArray: { input: "$status", sortBy: { date: 1 } } } } } }

// Même lecture que classifyRole : la première validation automatique, hors création par clé API, qui ne vérifie rien.
const autoValidated = {
  $let: {
    vars: {
      grant: {
        $first: {
          $filter: {
            input: "$status",
            cond: { $and: [{ $eq: ["$$this.status", AccessStatus.GRANTED] }, { $eq: ["$$this.validation_type", VALIDATION_UTILISATEUR.AUTO] }] },
          },
        },
      },
    },
    in: { $and: [{ $ne: [{ $type: "$$grant" }, "missing"] }, { $ne: ["$$grant.reason", API_KEY_CREATION_REASON] }] },
  },
}

/**
 * Comptes recruteur créés par domaine sur [baselineStart, end[, ceux de la fenêtre [windowStart, end[ à part. Le domaine
 * est extrait dans la base : aucune adresse n'en sort. Un seul document : les domaines de la fenêtre et les totaux.
 */
export const creationsByDomainPipeline = (baselineStart: Date, windowStart: Date, end: Date) => [
  { $match: getRolesWindowFilter(baselineStart, end) },
  {
    $project: {
      _id: 0,
      user_id: 1,
      authorized_type: 1,
      createdAt: 1,
      in_window: { $gte: ["$createdAt", windowStart] },
      last_status: currentStatus,
      auto_validated: autoValidated,
    },
  },
  {
    $lookup: {
      from: "userswithaccounts",
      localField: "user_id",
      foreignField: "_id",
      pipeline: [{ $project: { _id: 0, domain: { $toLower: { $arrayElemAt: [{ $split: ["$email", "@"] }, -1] } } } }],
      as: "user",
    },
  },
  { $set: { domain: { $first: "$user.domain" } } },
  { $match: { domain: { $type: "string", $ne: "" } } },
  {
    $group: {
      _id: "$domain",
      window_users: { $addToSet: { $cond: ["$in_window", "$user_id", "$$REMOVE"] } },
      baseline_users: { $addToSet: { $cond: ["$in_window", "$$REMOVE", "$user_id"] } },
      entreprise_roles: countInWindow({ $eq: ["$authorized_type", AccessEntityType.ENTREPRISE] }),
      cfa_roles: countInWindow({ $eq: ["$authorized_type", AccessEntityType.CFA] }),
      granted_roles: countInWindow({ $eq: ["$last_status", AccessStatus.GRANTED] }),
      awaiting_roles: countInWindow({ $eq: ["$last_status", AccessStatus.AWAITING_VALIDATION] }),
      denied_roles: countInWindow({ $eq: ["$last_status", AccessStatus.DENIED] }),
      auto_validated_roles: countInWindow("$auto_validated"),
      first_created_at: { $min: { $cond: ["$in_window", "$createdAt", "$$REMOVE"] } },
      last_created_at: { $max: { $cond: ["$in_window", "$createdAt", "$$REMOVE"] } },
    },
  },
  { $set: { window_accounts: { $size: "$window_users" }, baseline_accounts: { $size: "$baseline_users" } } },
  {
    $facet: {
      domains: [{ $match: { window_accounts: { $gt: 0 } } }, { $project: { baseline_users: 0 } }],
      totals: [{ $group: { _id: null, window_accounts: { $sum: "$window_accounts" }, baseline_accounts: { $sum: "$baseline_accounts" } } }],
    },
  },
]

type IPipelineDomain = {
  _id: string
  window_users: ObjectId[]
  baseline_accounts: number
  entreprise_roles: number
  cfa_roles: number
  granted_roles: number
  awaiting_roles: number
  denied_roles: number
  auto_validated_roles: number
  first_created_at: Date | null
  last_created_at: Date | null
}

type IPipelineResult = { domains: IPipelineDomain[]; totals: Array<{ window_accounts: number; baseline_accounts: number }> }

export const getCreationWindows = (now: Date, { windowHours, baselineDays }: Pick<IDomainSpikeThresholds, "windowHours" | "baselineDays">) => {
  const windowStart = new Date(now.getTime() - windowHours * HOUR_MS)
  return { windowStart, baselineStart: new Date(windowStart.getTime() - baselineDays * DAY_MS) }
}

export const loadCreationsByDomain = async (now: Date, thresholds: Pick<IDomainSpikeThresholds, "windowHours" | "baselineDays">) => {
  const { windowStart, baselineStart } = getCreationWindows(now, thresholds)
  const [result] = await getDbCollection("rolemanagements")
    .aggregate<IPipelineResult>(creationsByDomainPipeline(baselineStart, windowStart, now))
    .toArray()
  const [totals] = result?.totals ?? []
  const domains: IDomainCreations[] = (result?.domains ?? []).map((domain) => ({
    domain: domain._id,
    // Ordre de création des utilisateurs : l'ObjectId commence par sa date.
    accountIds: domain.window_users.sort((a, b) => a.toHexString().localeCompare(b.toHexString())),
    baselineAccounts: domain.baseline_accounts,
    entrepriseRoles: domain.entreprise_roles,
    cfaRoles: domain.cfa_roles,
    grantedRoles: domain.granted_roles,
    awaitingRoles: domain.awaiting_roles,
    deniedRoles: domain.denied_roles,
    autoValidatedRoles: domain.auto_validated_roles,
    firstCreatedAt: domain.first_created_at,
    lastCreatedAt: domain.last_created_at,
  }))
  return { windowStart, domains, totals: { windowAccounts: totals?.window_accounts ?? 0, baselineAccounts: totals?.baseline_accounts ?? 0 } }
}

const KIND_LABELS: Record<IDomainKind, string> = { webmail: "webmail grand public ou jetable", entreprise: "domaine d'entreprise" }

const formatParisDate = (date: Date | null) => (date ? date.toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" }) : "n/a")

const accountUrl = (id: ObjectId) => `${config.publicUrl}/espace-pro/administration/users/${id.toHexString()}`

const formatAccountList = (ids: ObjectId[]) => {
  const listed = ids.slice(0, LISTED_ACCOUNTS).map((id) => id.toHexString())
  return ids.length > LISTED_ACCOUNTS ? `${listed.join(", ")} et ${ids.length - LISTED_ACCOUNTS} autres` : listed.join(", ")
}

// Le domaine, des comptes et des identifiants techniques : jamais d'adresse (cf. assertNoEmailInFinding).
export const buildDomainFinding = (
  creations: IDomainCreations,
  { kind, accounts, expected }: ReturnType<typeof evaluateDomainSpike>,
  thresholds: IDomainSpikeThresholds
): IDetectionFinding => {
  const roundedExpected = Math.round(expected * 10) / 10
  const metrics: IDetectionMetrics = {
    domaine: creations.domain,
    type_domaine: kind,
    comptes: accounts,
    comptes_attendus: roundedExpected,
    comptes_reference: creations.baselineAccounts,
    roles_entreprise: creations.entrepriseRoles,
    roles_cfa: creations.cfaRoles,
    roles_acces_accorde: creations.grantedRoles,
    roles_en_attente: creations.awaitingRoles,
    roles_refuses: creations.deniedRoles,
    roles_valides_auto: creations.autoValidatedRoles,
    premiere_creation: creations.firstCreatedAt?.toISOString() ?? null,
    derniere_creation: creations.lastCreatedAt?.toISOString() ?? null,
    comptes_ids: creations.accountIds.map((id) => id.toHexString()).join(","),
  }
  const summary = [
    `${accounts} comptes recruteur créés en ${thresholds.windowHours} h sur le domaine ${creations.domain} (${KIND_LABELS[kind]}), pour ${roundedExpected.toLocaleString("fr-FR")} attendus d'après les ${thresholds.baselineDays} jours précédents. Premier le ${formatParisDate(creations.firstCreatedAt)}, dernier le ${formatParisDate(creations.lastCreatedAt)}.`,
    `Rôles créés : ${creations.entrepriseRoles} entreprise, ${creations.cfaRoles} CFA, dont ${creations.autoValidatedRoles} validés automatiquement ; aujourd'hui ${creations.grantedRoles} accès accordés, ${creations.awaitingRoles} en attente, ${creations.deniedRoles} refusés.`,
    `Comptes : ${formatAccountList(creations.accountIds)}`,
  ].join("\n")
  return {
    key: creations.domain,
    metrics,
    summary,
    links: creations.accountIds.slice(0, LINKED_ACCOUNTS).map((id) => ({ label: `compte ${id.toHexString()}`, url: accountUrl(id) })),
  }
}

const maxAccounts = (evaluations: ReturnType<typeof evaluateDomainSpike>[], kind: IDomainKind) =>
  Math.max(0, ...evaluations.filter((evaluation) => evaluation.kind === kind).map(({ accounts }) => accounts))

/**
 * Pic de créations de comptes recruteur sur un même domaine email : l'usurpation de juin 2026 tenait en 25 comptes en
 * 3 jours (#5422) sur un webmail grand public (#5425). Les webmails ont leurs propres seuils ; un webmail à fort volume
 * ne se distingue que par un écart à son volume habituel.
 */
export const accountCreationDomainSpikeRule: IDetectionRule<IDomainSpikeThresholds> = {
  id: "creations_comptes_domaine",
  title: "Pic de créations de comptes sur un domaine email",
  severity: "haute",
  periodicity: { everyMinutes: 60 },
  enabledByDefault: true,
  thresholds: thresholdsSchema,
  confirmations: 1,
  reminderEveryHours: 24,
  evaluate: async ({ now, thresholds }) => {
    const { windowStart, domains, totals } = await loadCreationsByDomain(now, thresholds)
    const evaluations = domains.map((creations) => ({ creations, evaluation: evaluateDomainSpike(creations, totals, thresholds) }))
    const findings = evaluations.filter(({ evaluation }) => evaluation.alert).map(({ creations, evaluation }) => buildDomainFinding(creations, evaluation, thresholds))
    const all = evaluations.map(({ evaluation }) => evaluation)
    return {
      findings,
      observations: {
        fenetre_debut: windowStart.toISOString(),
        comptes_fenetre: totals.windowAccounts,
        comptes_reference: totals.baselineAccounts,
        domaines_fenetre: domains.length,
        domaines_en_alerte: findings.length,
        max_comptes_domaine_entreprise: maxAccounts(all, "entreprise"),
        max_comptes_domaine_webmail: maxAccounts(all, "webmail"),
      },
    }
  },
}
