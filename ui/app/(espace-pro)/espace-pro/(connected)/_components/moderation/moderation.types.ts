import type { IResponse, IRoutes } from "shared"
import { JOB_STATUS } from "shared"
import type { IJobsPartnersModerationFinding } from "shared/models/jobs-partners-moderation.model"
import { MODERATION_PENDING_VERDICTS } from "shared/models/jobs-partners-moderation.model"

export type IModerationJobDetailJson = IResponse<IRoutes["get"]["/moderation/jobs/:id"]>
export type IModerationQueueItemJson = IResponse<IRoutes["get"]["/moderation/jobs"]>["jobs"][number]
export type IModerationSummaryJson = IResponse<IRoutes["get"]["/moderation/jobs/summary"]>["jobs"][number]
export type IModerationFindingJson = NonNullable<IModerationJobDetailJson["moderation"]>["findings"][number]
export type IModerationUserType = "ADMIN" | "OPCO"

// Sans strictNullChecks (ui/tsconfig.json), Jsonify rend chaque champ optionnel : le schéma de réponse les garantit.
export const toFindings = (findings: IModerationFindingJson[]) => findings as IJobsPartnersModerationFinding[]

/** Offre en ligne qui attend une décision de modération (cf. PENDING_MODERATION_DECISION_FILTER côté serveur). */
export const awaitsModerationDecision = (jobStatus: JOB_STATUS, summary: Pick<IModerationSummaryJson, "offer_moderation_verdict" | "offer_moderation_review"> | undefined) =>
  jobStatus === JOB_STATUS.ACTIVE && MODERATION_PENDING_VERDICTS.some((verdict) => verdict === summary?.offer_moderation_verdict) && !summary?.offer_moderation_review
