import * as express from "express"
import { Controller, Get, Header, Hidden, OperationId, Query, Request, Response, Route, SuccessResponse, Tags } from "tsoa"
import { getFormationsQuery } from "../../../services/formation.service.js"
import { trackApiCall } from "../../../common/utils/sendTrackingEvent.js"
import { jobsEtFormationsQueryValidator } from "../../../services/queryValidator.service.js"
import { getJobsFromApi } from "../../../services/jobOpportunity.service.js"

@Tags("JobsEtFormations")
@Route("/api/v1/jobsEtFormations")
export class JobsEtFormationsController extends Controller {
  /**
   * Get job opportunities and formations matching the query parameters
   * @param {string} romes optional: some rome codes separated by commas (either 'romes' or 'rncp' must be present)
   * @param {string} rncp optional: a rncp code (either 'romes' or 'rncp' must be present)
   * @param {string} referer the referer provided in the HTTP query headers
   * @param {string} caller the consumer id.
   * @param {string} latitude optional: search center latitude. Without latitude, the search will target whole France
   * @param {string} longitude optional: search center longitude. Without longitude, the search will target whole France
   * @param {number} radius optional: the search radius
   * @param {string} insee optional: search center insee code
   * @param {string} sources optional: comma separated list of job opportunities sources and trainings (possible values : "formations", "lba", "matcha", "offres")
   * @param {string} diploma optional: targeted diploma
   * @param {string} opco optional: filter opportunities on opco name
   * @param {string} opcoUrl optional: filter opportunities on opco url
   * @param {string[]} options optional: options
   * @param {string} useMock optional: wether to return mocked values or not
   * @returns {Promise<IApiError | { results: ILbaItem[] }>} response
   */
  @Response<"Wrong parameters">(400)
  @Response<"Internal error">(500)
  @SuccessResponse("200", "Get formations success")
  @Get("/")
  @OperationId("getJobsEtFormations")
  public async getJobsEtFormations(
    @Request() request: express.Request,
    @Query() romes?: string,
    @Query() rncp?: string,
    @Header() @Hidden() referer?: string,
    @Query() caller?: string,
    @Query() latitude?: string,
    @Query() longitude?: string,
    @Query() radius?: string,
    @Query() insee?: string,
    @Query() sources?: string,
    @Query() diploma?: string,
    @Query() opco?: string,
    @Query() opcoUrl?: string,
    @Query() @Hidden() options?: string,
    @Query() @Hidden() useMock?: string
  ) {
    const parameterControl = await jobsEtFormationsQueryValidator({
      romes,
      rncp,
      referer,
      caller,
      latitude,
      longitude,
      radius,
      insee,
      sources,
      diploma,
      opco,
      opcoUrl,
      useMock,
    })

    if ("error" in parameterControl) {
      if (parameterControl.error === "wrong_parameters") {
        this.setStatus(400)
      } else {
        this.setStatus(500)
      }

      return parameterControl
    }

    const itemSources = !sources ? ["formations", "lba", "matcha", "offres"] : sources.split(",")

    const [formations, jobs] = await Promise.all([
      itemSources.indexOf("formations") >= 0
        ? getFormationsQuery({
            romes: parameterControl.romes,
            longitude,
            latitude,
            radius: radius,
            diploma: diploma,
            caller: caller,
            options: options,
            referer,
            useMock: useMock,
            api: "jobEtFormationV1",
          })
        : null,
      itemSources.indexOf("lba") >= 0 || itemSources.indexOf("lbb") >= 0 || itemSources.indexOf("offres") >= 0 || itemSources.indexOf("matcha") >= 0
        ? getJobsFromApi({ romes: parameterControl.romes, referer, caller, latitude, longitude, radius, insee, sources, diploma, opco, opcoUrl, useMock, api: "jobEtFormationV1" })
        : null,
    ])

    if (caller) {
      let job_count = 0
      if ("lbaCompanies" in jobs && "results" in jobs.lbaCompanies) {
        job_count += jobs.lbaCompanies.results.length
      }

      if ("peJobs" in jobs && "results" in jobs.peJobs) {
        job_count += jobs.peJobs.results.length
      }

      if ("matchas" in jobs && "results" in jobs.matchas) {
        job_count += jobs.matchas.results.length
      }

      const training_count = "results" in formations ? formations.results.length : 0

      trackApiCall({
        caller,
        api_path: "jobEtFormationV1",
        training_count,
        job_count,
        result_count: job_count + training_count,
        response: "OK",
      })
    }

    return { formations, jobs }
  }
}
