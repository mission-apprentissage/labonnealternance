import * as express from "express"
import { Controller, Get, Header, Hidden, OperationId, Query, Request, Response, Route, SuccessResponse, Tags } from "tsoa"

import { IApiError } from "../../../common/utils/errorManager.js"
import { trackApiCall } from "../../../common/utils/sendTrackingEvent.js"
import { getFormationsParRegionQuery } from "../../../services/formation.service.js"
import { ILbaItem } from "../../../services/lbaitem.shared.service.types.js"

@Tags("Formations par région")
@Route("/api/v1/formationsParRegion")
export class FormationsParRegionController extends Controller {
  /**
   * Get formations matching the query parameters
   * @param {string} romes optional: some rome codes separated by commas (either romes or romeDomain must be present)
   * @param {string} romeDomain optional: a rome domain (either romes or romeDomain must be present)
   * @param {string} referer the referer provided in the HTTP query headers
   * @param {string} caller the consumer id.
   * @param {string} departement optional: french "departement" code (either 'departement' or 'region' must be present)
   * @param {string} region optional: french "region" code (either 'departement' or 'region' must be present)
   * @param {string} diploma optional: targeted diploma
   * @param {string[]} options optional: options
   * @param {string} useMock optional: wether to return mocked values or not
   * @returns {Promise<IApiError | { results: ILbaItem[] }>} response
   */
  @Response<"Wrong parameters">(400)
  @Response<"Internal error">(500)
  @SuccessResponse("200", "Get formations success")
  @Get("/")
  @OperationId("getFormations")
  public async getFormations(
    @Request() request: express.Request,
    @Query() romes?: string,
    @Query() romeDomain?: string,
    @Header() @Hidden() referer?: string,
    @Query() caller?: string,
    @Query() departement?: string,
    @Query() region?: string,
    @Query() diploma?: string,
    @Query() @Hidden() options?: string,
    @Query() @Hidden() useMock?: string
  ): Promise<IApiError | { results: ILbaItem[] }> {
    const result = await getFormationsParRegionQuery({ romes, departement, region, diploma, romeDomain, caller, options, referer, useMock })

    if ("error" in result) {
      if (result.error === "wrong_parameters") {
        this.setStatus(400)
      } else {
        this.setStatus(500)
      }

      return result
    }

    if (caller && "results" in result) {
      trackApiCall({
        caller: caller,
        api_path: "formationRegionV1",
        training_count: result.results?.length,
        result_count: result.results?.length,
        response: "OK",
      })
    }

    return result
  }
}
