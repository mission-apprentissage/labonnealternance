import * as express from "express"
import { Controller, Get, Header, Hidden, OperationId, Path, Query, Request, Response, Route, SuccessResponse, Tags } from "tsoa"
import { IApiError } from "../../../common/utils/errorManager.js"
import { ILbaItem } from "../../../services/lbaitem.shared.service.types.js"
import { getFormationDescriptionQuery, getFormationQuery, getFormationsQuery } from "../../../services/formation.service.js"
import { trackApiCall } from "../../../common/utils/sendTrackingEvent.js"

@Tags("Formations")
@Route("/api/v1/formations")
export class FormationsController extends Controller {
  /**
   * Get formations matching the query parameters
   * @param {string} referer the referer provided in the HTTP query headers
   * @param {string} caller the consumer id.
   * @param {string} romes optional: some rome codes separated by commas (either romes or romeDomain must be present)
   * @param {string} romeDomain optional: a rome domain (either romes or romeDomain must be present)
   * @param {string} latitude search center latitude
   * @param {string} longitude search center longitude
   * @param {number} radius the search radius
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
    @Query() latitude?: string,
    @Query() longitude?: string,
    @Query() radius?: string,
    @Query() diploma?: string,
    @Query() @Hidden() options?: string,
    @Query() @Hidden() useMock?: string
  ): Promise<IApiError | { results: ILbaItem[] }> {
    const result = await getFormationsQuery({ romes, longitude, latitude, radius, diploma, romeDomain, caller, options, referer, useMock })

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
        api_path: "formationV1",
        training_count: result.results?.length,
        result_count: result.results?.length,
        response: "OK",
      })
    }

    return result
  }

  /**
   * Get one formation identified by it's clé ministère éducatif
   * @param {string} id the clé ministère éducatif of the formation looked for.
   * @param {string} caller the consumer id.
   * @returns {Promise<IApiError | { lbbCompanies: ILbaItem[] } | { lbaCompanies: ILbaItem[] }>} response
   */
  @Response<"Wrong parameters">(400)
  @Response<"Formation not found">(404)
  @Response<"Internal error">(500)
  @SuccessResponse("200", "Get formation success")
  @Get("/formation/{id}")
  @OperationId("getFormation")
  public async getFormation(@Path() id: string, @Query() caller?: string): Promise<IApiError | { results: ILbaItem[] }> {
    const result = await getFormationQuery({
      id,
      caller,
    })

    if ("error" in result) {
      if (result.error === "wrong_parameters") {
        this.setStatus(400)
      } else if (result.error === "not_found") {
        this.setStatus(404)
      } else {
        this.setStatus(result.status || 500)
      }
    } else {
      if (caller) {
        trackApiCall({
          caller,
          api_path: "formationV1/formation",
          training_count: 1,
          result_count: 1,
          response: "OK",
        })
      }
    }

    return result
  }

  /**
   * Get details for one formation identified by it's clé ministère éducatif
   * @param {string} id the clé ministère éducatif of the formation looked for.
   * @returns {Promise<IApiError | any>} response
   */
  @Response<"Wrong parameters">(400)
  @Response<"Formation not found">(404)
  @Response<"Internal error">(500)
  @SuccessResponse("200", "Get formation description success")
  @Get("/formationDescription/{id}")
  @OperationId("getFormationDescription")
  public async getFormationDescription(@Path() id: string): Promise<IApiError | any> {
    const result = await getFormationDescriptionQuery({
      id,
    })

    if ("error" in result) {
      if (result.error === "wrong_parameters") {
        this.setStatus(400)
      } else if (result.error === "not_found") {
        this.setStatus(404)
      } else {
        this.setStatus(result.status || 500)
      }
    }

    return result
  }
}
