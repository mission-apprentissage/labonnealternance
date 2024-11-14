import { IRouteSchema } from "shared/routes/common.routes"

// Messages are not constants but the codes are
export const IJobOpportunityWarningMap = {
  FRANCE_TRAVAIL_API_ERROR: "Unable to retrieve job offers from France Travail API",
  JOB_OFFER_FORMATING_ERROR: "Some jobs offers are invalid. Unexpected error on some job, they are excluded from the result",
  RECRUITERS_FORMATING_ERROR: "Some recruiters are invalid. Unexpected error on some recruiters, they are excluded from the result",
} as const satisfies Record<string, string>

export type IJobOpportunityWarningCode = keyof typeof IJobOpportunityWarningMap

export type IJobOpportunityWarning = {
  code: IJobOpportunityWarningCode
}

export class JobOpportunityRequestContext {
  route: Pick<IRouteSchema, "path">

  caller: string

  #warnings: Set<IJobOpportunityWarningCode> = new Set()

  constructor(route: Pick<IRouteSchema, "path">, caller: string) {
    this.route = route
    this.caller = caller
  }

  addWarning(code: IJobOpportunityWarningCode) {
    this.#warnings.add(code)
  }

  getWarnings(): Array<{ code: string; message: string }> {
    return Array.from(this.#warnings).map((code) => ({ code, message: IJobOpportunityWarningMap[code] }))
  }
}
