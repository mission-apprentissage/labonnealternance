import { getMetiersDAvenir } from "../../../services/diagoriente.service.js"
import { Controller, Get, Hidden, OperationId, Response, Route, SuccessResponse, Tags } from "tsoa"
import { TResponseError } from "../shared.controllers.types.js"
import { TGetMetiersDAvenirResponseSuccess } from "./metiersDAvenir.type.js"

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
