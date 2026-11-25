import { badRequest, notFound } from "@hapi/boom"
import { ObjectId } from "mongodb"
import type { IRgpdErasureFailure, IRgpdErasureMode, IRgpdErasureStatus, IRgpdErasureStep, IRgpdUserType } from "shared/models/rgpd-erasure.model"
import { RGPD_ERASURE_IN_PROGRESS, RGPD_ERASURE_STATUS, RGPD_USER_TYPE } from "shared/models/rgpd-erasure.model"
import { AccessEntityType } from "shared/models/role-management.model"
import type { IRgpdErasurePreview, IRgpdErasureReport } from "shared/routes/rgpd-erasure.routes"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"

import { buildRgpdAccountSteps, isLastActiveAdmin, resolveRgpdAccountContext } from "./rgpd-erasure-account"
import { buildRgpdCandidatSteps, buildRgpdRdvaSteps, resolveRgpdCandidatContext, resolveRgpdRdvaContext } from "./rgpd-erasure-candidat"
import type { IRgpdStep } from "./rgpd-erasure-steps"
import { getRgpdEmailVariants, hashRgpdEmail } from "./rgpd-erasure-steps"

/** Par e-mail depuis le back-office, par identifiant depuis la CLI (anonymize-individual). */
export type IRgpdTargetQuery = { email: string } | { id: ObjectId }

type IRgpdTarget =
  | { found: false }
  | {
      found: true
      email: string
      buildSteps: (mode: IRgpdErasureMode) => IRgpdStep[]
      warnings: string[]
      /** Refus qui ne dépendent que de la cible : levés à l'aperçu comme à l'exécution. */
      assertErasable?: (requestedBy: ObjectId | null) => Promise<void>
    }

const ACCOUNT_ROLE_TYPES: Partial<Record<IRgpdUserType, AccessEntityType[]>> = {
  [RGPD_USER_TYPE.ENTREPRISE]: [AccessEntityType.ENTREPRISE],
  [RGPD_USER_TYPE.CFA]: [AccessEntityType.CFA],
  [RGPD_USER_TYPE.OPCO_ADMIN]: [AccessEntityType.OPCO, AccessEntityType.ADMIN],
}

const toRgpdUserType = (roleType: AccessEntityType): IRgpdUserType | null =>
  (Object.entries(ACCOUNT_ROLE_TYPES).find(([, roleTypes]) => roleTypes.includes(roleType))?.[0] as IRgpdUserType | undefined) ?? null

/** Type RGPD d'un compte selon ses rôles, pour la CLI qui ne le reçoit pas. Un compte sans rôle est traité comme un recruteur. */
export const getAccountRgpdUserType = async (userId: ObjectId): Promise<IRgpdUserType> => {
  const roles = await getDbCollection("rolemanagements").find({ user_id: userId }).toArray()
  for (const type of [RGPD_USER_TYPE.OPCO_ADMIN, RGPD_USER_TYPE.CFA, RGPD_USER_TYPE.ENTREPRISE]) {
    if (roles.some((role) => toRgpdUserType(role.authorized_type) === type)) return type
  }
  return RGPD_USER_TYPE.ENTREPRISE
}

const queryEmails = (query: IRgpdTargetQuery) => ("email" in query ? getRgpdEmailVariants(query.email) : [])

const resolveAccountTarget = async (userType: IRgpdUserType, query: IRgpdTargetQuery): Promise<IRgpdTarget> => {
  const user = await getDbCollection("userswithaccounts").findOne("id" in query ? { _id: query.id } : { email: { $in: queryEmails(query) } })
  if (!user) return { found: false }

  const context = await resolveRgpdAccountContext(user)
  const expectedRoleTypes = ACCOUNT_ROLE_TYPES[userType] ?? []
  // Un compte sans rôle (inscription abandonnée) reste effaçable quel que soit le type choisi.
  if (context.roles.length && !context.roles.some((role) => expectedRoleTypes.includes(role.authorized_type))) return { found: false }

  const otherRoleTypes = [...new Set(context.roles.map((role) => role.authorized_type).filter((type) => !expectedRoleTypes.includes(type)))]
  const warnings = [
    ...otherRoleTypes.map((type) => `Ce compte porte aussi un rôle ${type} : il disparaît avec le compte.`),
    ...(context.jobIds.length ? ["Les offres déjà transmises à France Travail (export quotidien) ne peuvent pas être rappelées."] : []),
  ]
  const emails = getRgpdEmailVariants(user.email)

  return {
    found: true,
    email: user.email,
    buildSteps: (mode) => buildRgpdAccountSteps(context, mode, emails),
    warnings,
    assertErasable: async (requestedBy) => {
      if (requestedBy?.equals(user._id)) throw badRequest("Un administrateur ne peut pas effacer son propre compte")
      if (await isLastActiveAdmin(context)) throw badRequest("Impossible d'effacer le dernier administrateur actif")
    },
  }
}

const resolveCandidatTarget = async (query: IRgpdTargetQuery): Promise<IRgpdTarget> => {
  const context = await resolveRgpdCandidatContext(queryEmails(query), "id" in query ? query.id : undefined)
  if (!context) return { found: false }
  const emails = getRgpdEmailVariants(context.applicant.email)
  return { found: true, email: context.applicant.email, buildSteps: (mode) => buildRgpdCandidatSteps(context, mode, emails), warnings: [] }
}

const resolveRdvaTarget = async (query: IRgpdTargetQuery): Promise<IRgpdTarget> => {
  const context = await resolveRgpdRdvaContext(queryEmails(query), "id" in query ? query.id : undefined)
  const email = "email" in query ? query.email : context.users[0]?.email
  if (!context.users.length || !email) return { found: false }
  const emails = getRgpdEmailVariants(email)
  return { found: true, email, buildSteps: (mode) => buildRgpdRdvaSteps(context, mode, emails), warnings: [] }
}

const resolveTarget = (userType: IRgpdUserType, query: IRgpdTargetQuery): Promise<IRgpdTarget> => {
  switch (userType) {
    case RGPD_USER_TYPE.CANDIDAT:
      return resolveCandidatTarget(query)
    case RGPD_USER_TYPE.CANDIDAT_RDVA:
      return resolveRdvaTarget(query)
    default:
      return resolveAccountTarget(userType, query)
  }
}

/** Autres types sous lesquels l'e-mail existe : une même personne peut être recruteur et candidate. */
const findOtherUserTypes = async (email: string, exclude: IRgpdUserType): Promise<IRgpdUserType[]> => {
  const emails = getRgpdEmailVariants(email)
  const types = new Set<IRgpdUserType>()

  const user = await getDbCollection("userswithaccounts").findOne({ email: { $in: emails } }, { projection: { _id: 1 } })
  if (user) {
    const roles = await getDbCollection("rolemanagements")
      .find({ user_id: user._id }, { projection: { authorized_type: 1 } })
      .toArray()
    for (const role of roles) {
      const type = toRgpdUserType(role.authorized_type)
      if (type) types.add(type)
    }
  }
  if (await getDbCollection("applicants").countDocuments({ email: { $in: emails } })) {
    types.add(RGPD_USER_TYPE.CANDIDAT)
  }
  if (await getDbCollection("users").countDocuments({ email: { $in: emails } })) {
    types.add(RGPD_USER_TYPE.CANDIDAT_RDVA)
  }

  types.delete(exclude)
  return [...types]
}

export const previewRgpdErasure = async ({
  userType,
  email,
  mode,
  requestedBy,
}: {
  userType: IRgpdUserType
  email: string
  mode: IRgpdErasureMode
  requestedBy: ObjectId
}): Promise<IRgpdErasurePreview> => {
  const target = await resolveTarget(userType, { email })
  const other_user_types = await findOtherUserTypes(email, userType)
  if (!target.found) return { found: false, other_user_types, steps: [], warnings: [] }

  await target.assertErasable?.(requestedBy)
  const steps: IRgpdErasureStep[] = []
  for (const step of target.buildSteps(mode)) {
    steps.push({ collection: step.collection, action: step.action, count: await step.count() })
  }
  return { found: true, other_user_types, steps, warnings: target.warnings }
}

/**
 * Exécute les étapes dans l'ordre. Un échec interrompt l'effacement (statut `failed`) avant la suppression
 * de la fiche, qu'une relance retrouve donc ; seul l'échec d'un service externe le laisse continuer (`partial`).
 * La trace est posée avant la première étape : un effacement qui s'arrête sans rendre compte reste `in_progress`.
 */
export const eraseRgpdUser = async ({
  userType,
  query,
  mode,
  requestRef,
  requestedBy,
}: {
  userType: IRgpdUserType
  query: IRgpdTargetQuery
  mode: IRgpdErasureMode
  requestRef: string | null
  requestedBy: ObjectId | null
}): Promise<IRgpdErasureReport> => {
  const target = await resolveTarget(userType, query)
  if (!target.found) throw notFound("Aucun utilisateur de ce type ne correspond")
  await target.assertErasable?.(requestedBy)

  const audit_id = new ObjectId()
  await getDbCollection("rgpd_erasures").insertOne({
    _id: audit_id,
    email_hash: hashRgpdEmail(target.email),
    user_type: userType,
    mode,
    request_ref: requestRef || null,
    requested_by: requestedBy,
    requested_at: new Date(),
    status: RGPD_ERASURE_IN_PROGRESS,
    steps: [],
    failures: [],
  })

  const steps: IRgpdErasureStep[] = []
  const failures: IRgpdErasureFailure[] = []
  let status: IRgpdErasureStatus = RGPD_ERASURE_STATUS.DONE

  for (const step of target.buildSteps(mode)) {
    try {
      steps.push({ collection: step.collection, action: step.action, count: await step.run() })
    } catch (error) {
      failures.push({ collection: step.collection, message: error instanceof Error ? error.message : "erreur inconnue" })
      sentryCaptureException(error, { extra: { context: "rgpd-erasure", collection: step.collection } })
      if (!step.optional) {
        status = RGPD_ERASURE_STATUS.FAILED
        break
      }
      status = RGPD_ERASURE_STATUS.PARTIAL
    }
  }

  await getDbCollection("rgpd_erasures").updateOne({ _id: audit_id }, { $set: { status, steps, failures } })
  logger.info({ audit_id: audit_id.toString(), user_type: userType, mode, status, failures: failures.length }, "effacement RGPD")

  return { audit_id, status, steps, failures, warnings: target.warnings }
}
