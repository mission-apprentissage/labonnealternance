import { Controller, Get, Hidden, OperationId, Response, Route, SuccessResponse, Tags } from "tsoa"

import { getMetiersDAvenir } from "../../../services/diagoriente.service"
import { TResponseError } from "../shared.types"

import { TGetMetiersDAvenirResponseSuccess } from "./metiersDAvenir.type"

@Tags("MetiersDAvenir")
@Route("/api/metiersdavenir")
@Hidden()
export class MetiersDAvenirController extends Controller {
  /**
   * @description get a list of "métiers d'avenir" from Diagoriente API
   * @returns {Promise<TGetMetiersDAvenirResponseSuccess | TResponseError>}
   */
  @Response<"List unavailable">(500)
  @SuccessResponse("201", "List retrieved")
  @Get("/")
  @OperationId("getMetiersDAvenir")
  public async getMetiersDAvenir(): Promise<TGetMetiersDAvenirResponseSuccess | TResponseError> {
    const result = await getMetiersDAvenir()

    if (result.error) {
      this.setStatus(500)
    }

    return result
  }
}
