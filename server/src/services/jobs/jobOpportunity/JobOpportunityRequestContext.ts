import { IRouteSchema } from "shared/routes/common.routes"

// Messages are not constants but the codes are
export const IJobOpportunityWarningMap = {
  FRANCE_TRAVAIL_API_ERROR: "Unable to retrieve job offers from France Travail API",
  JOB_OFFER_FORMATING_ERROR: "Some job offers are invalid and have been excluded due to unexpected errors.",
  JOB_NOT_FOUND: "The job offer has not been found.",
  RECRUITERS_FORMATING_ERROR: "Some recruiters are invalid and have been excluded due to unexpected errors.",
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
