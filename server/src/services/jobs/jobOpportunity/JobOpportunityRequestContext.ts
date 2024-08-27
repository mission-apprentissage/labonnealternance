import { IRouteSchema } from "shared/routes/common.routes"

// Messages are not constants but the codes are
export const IJobOpportunityWarningMap = {} as const satisfies Record<string, string>

export type IJobOpportunityWarningCode = keyof typeof IJobOpportunityWarningMap

export type IJobOpportunityWarning = {
  code: IJobOpportunityWarningCode
}

export class JobOpportunityRequestContext {
  route: Pick<IRouteSchema, "path">

  caller: string

  #warnings: IJobOpportunityWarningCode[] = []

  constructor(route: Pick<IRouteSchema, "path">, caller: string) {
    this.route = route
    this.caller = caller
  }

  addWarning(code: IJobOpportunityWarningCode) {
    this.#warnings.push(code)
  }

  getWarnings(): Array<{ code: string; message: string }> {
    return this.#warnings.map((code) => ({ code, message: IJobOpportunityWarningMap[code] }))
  }
}
