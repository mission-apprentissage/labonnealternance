import type { IResponse, IRoutes } from "shared"
import type { IJobsPartnersModerationFinding } from "shared/models/jobs-partners-moderation.model"

export type IModerationJobDetailJson = IResponse<IRoutes["get"]["/moderation/jobs/:id"]>
export type IModerationQueueItemJson = IResponse<IRoutes["get"]["/moderation/jobs"]>["jobs"][number]
export type IModerationFindingJson = NonNullable<IModerationJobDetailJson["moderation"]>["findings"][number]
export type IModerationUserType = "ADMIN" | "OPCO"

// Sans strictNullChecks (ui/tsconfig.json), Jsonify rend chaque champ optionnel : le schéma de réponse les garantit.
export const toFindings = (findings: IModerationFindingJson[]) => findings as IJobsPartnersModerationFinding[]
