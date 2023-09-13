//@ts-nocheck
import * as express from "express"

import { Body, Controller, Get, Header, Hidden, OperationId, Patch, Path, Post, Query, Request, Response, Route, Security, SuccessResponse, Tags } from "tsoa"

import { Recruiter } from "../../../common/model/index"
import { ICredential } from "../../../common/model/schema/credentials/credential.types"
import { IJobs } from "../../../common/model/schema/jobs/jobs.types"
import { IUserRecruteur } from "../../../common/model/schema/userRecruteur/userRecruteur.types"
import { delay } from "../../../common/utils/asyncUtils"
import { IApiError } from "../../../common/utils/errorManager"
import { getCompanyFromSiret } from "../../../service/poleEmploi/bonnesBoites"
import { getJobsQuery } from "../../../service/poleEmploi/jobsAndCompanies"
import { getPeJobFromId } from "../../../service/poleEmploi/offresPoleEmploi"
import { getNearEtablissementsFromRomes } from "../../../services/catalogue.service"
import { ACTIVE, ANNULEE, JOB_STATUS, POURVUE } from "../../../services/constant.service"
import dayjs from "../../../services/dayjs.service"
import { entrepriseOnboardingWorkflow } from "../../../services/etablissement.service"
import {
  cancelOffre,
  createJobDelegations,
  createOffre,
  extendOffre,
  getFormulaire,
  getFormulaires,
  getJob,
  getOffre,
  patchOffre,
  provideOffre,
} from "../../../services/formulaire.service"
import type { ILbaItem } from "../../../services/lbaitem.shared.service.types"
import { addOffreDetailView, addOffreSearchView, getLbaJobById } from "../../../services/lbajob.service"
import { getAppellationDetailsFromAPI, getRomeDetailsFromAPI } from "../../../services/rome.service"

import type { ICreateDelegation, ICreateJobBody, IGetDelegation, TCreateEstablishmentBody, TEstablishmentResponseSuccess, TJob, TResponseError } from "./jobs.types"
import { createDelegationSchema, createEstablishmentSchema, createJobSchema, getEstablishmentEntitySchema, updateJobSchema } from "./jobs.validators"

@Tags("Jobs")
@Route("/api/v1/jobs")
export class JobsController extends Controller {
  /**
   * Get existing establishment id from siret & email
   * @param {string} siret Establishment siret
   * @param {string} email Establishment email
   * @returns {Promise<TEstablishmentResponseSuccess["establishment_id"]>} response
   */
  @Response<"Establishment not found">(400)
  @SuccessResponse("200", "Establishment found")
  @Get("/establishment")
  @Security("api_key")
  public async getEstablishment(@Query() establishment_siret: string, @Query() email: string): Promise<TEstablishmentResponseSuccess["establishment_id"] | TResponseError> {
    await getEstablishmentEntitySchema.validateAsync({ establishment_siret, email }, { abortEarly: false })

    const establishment = await Recruiter.findOne({ establishment_siret, email })

    if (!establishment) {
      this.setStatus(400)
      return { error: true, message: "Establishment not found" }
    }

    this.setStatus(200)
    return establishment.establishment_id
  }

  /**
   * Get all jobs related to my organization
   * @param {Filter<IRecruiter>} query mongodb query allowing specific filtering, JSON stringified.
   * @param {Object} select fields to return, ex {_id: 1, first_name:1, last_name:0}
   * @param {Number} page the current page.
   * @param {Number} limit the limit of results per page
   * @returns {Promise<TEstablishmentResponseSuccess>} response
   */
  @Response<"Get all jobs failed">(400)
  @SuccessResponse("200", "Get all jobs success")
  @Get("/bulk")
  @OperationId("getJobs")
  @Security("api_key")
  public async getJobs(
    @Request() request: express.Request | any,
    @Query() query = "{}",
    @Query() select = "{}",
    @Query() page = 1,
    @Query() limit = 10
  ): Promise<TEstablishmentResponseSuccess | any> {
    const user: ICredential = request.user

    const qs = JSON.parse(query)
    const slt = JSON.parse(select)

    const jobs = getFormulaires({ ...qs, opco: user.organisation }, slt, { page, limit })

    this.setStatus(200)
    return jobs
  }

  /**
   * Create an establishment entity.
   * origin parameter is always prefixed with you identification name declared at the API user creation.
   * it is a string in tiny case of your organism name. example: BETA GOUV with an origin set to "campaign2023" will be betagouv-campaign2023.
   * @param {string} establishment_siret
   * @param {string} first_name
   * @param {string} last_name
   * @param {string} phone
   * @param {string} email
   * @param {string} idcc
   * @param {string} origin Origine composé de :
   * @returns {Promise<TEstablishmentResponseSuccess | TResponseError>}
   */
  @Response<"Establishment creation failed">(400)
  @SuccessResponse("201", "Establishment created")
  @Post("/establishment")
  @OperationId("createEstablishment")
  @Security("api_key")
  public async createEstablishment(@Request() request: express.Request | any, @Body() body: TCreateEstablishmentBody): Promise<TEstablishmentResponseSuccess | TResponseError> {
    // Validate establishment parameters
    await createEstablishmentSchema.validateAsync(body, { abortEarly: false })

    const { first_name, last_name, phone, email, origin, idcc, establishment_siret } = body
    const user: ICredential = request.user

    const result = await entrepriseOnboardingWorkflow.create(
      {
        email,
        first_name,
        last_name,
        phone,
        origin: `${user.scope}${origin ? `-${origin}` : ""}`,
        idcc,
        siret: establishment_siret,
        opco: user.organisation,
      },
      {
        isUserValidated: true,
      }
    )
    if ("error" in result) {
      const { message } = result
      this.setStatus(400)
      return { error: true, message }
    }

    this.setStatus(201)
    return result.formulaire
  }

  /**
   * Create a job offer inside an establishment entity.
   * An establishment ID entity is required.
   * @param {string} job_level_label
   * @param {string} job_start_date
   * @param {string[]} job_type
   * @param {boolean} is_disabled_elligible
   * @param {number} job_count
   * @param {string} job_rythm
   * @param {number} job_duration
   * @param {string} job_description
   * @returns {Promise<TEstablishmentResponseSuccess | TResponseError>}
   */
  @Response<"Job creation failed">(400)
  @SuccessResponse("201", "Job created")
  @Post("/{establishmentId}")
  @OperationId("createJob")
  @Security("api_key")
  public async createJob(@Body() body: ICreateJobBody, @Path() establishmentId: IUserRecruteur["establishment_id"]): Promise<TEstablishmentResponseSuccess | TResponseError> {
    // Check if entity exists
    const establishmentExists = await getFormulaire({ establishment_id: establishmentId })

    if (!establishmentExists) {
      return { error: true, message: "Establishment does not exist" }
    }

    // Validate job parameters
    await createJobSchema.validateAsync(body, { abortEarly: false })

    // Get Appellation detail from Pole Emploi API
    const appelationDetails = await getAppellationDetailsFromAPI(body.appellation_code)

    if (!appelationDetails) {
      return { error: true, message: "ROME Appelation details could not be retrieved" }
    }

    await delay(1000)

    // Get Rome details from Pole Emploi API
    const romeDetails = await getRomeDetailsFromAPI(appelationDetails.metier.code)

    if (!romeDetails) {
      return { error: true, message: "ROME Code details could not be retrieved" }
    }
    // Initialize job object with collected data
    const DATE_FORMAT = "YYYY-MM-DD"

    const job: Partial<IJobs> = {
      rome_label: romeDetails.libelle,
      rome_appellation_label: appelationDetails.libelle,
      rome_code: [appelationDetails.metier.code],
      job_level_label: body.job_level_label,
      job_start_date: body.job_start_date,
      job_description: body.job_description,
      job_creation_date: dayjs().format(DATE_FORMAT),
      job_expiration_date: dayjs().add(1, "month").format(DATE_FORMAT),
      job_status: JOB_STATUS.ACTIVE,
      job_type: body.job_type,
      rome_detail: romeDetails,
      is_disabled_elligible: body.is_disabled_elligible,
      job_count: body.job_count,
      job_duration: body.job_duration,
      job_rythm: body.job_rythm,
      custom_address: body.custom_address,
      custom_geo_coordinates: body.custom_geo_coordinates,
    }

    const updatedRecruiter = await createOffre(establishmentId, job)

    this.setStatus(201)
    return updatedRecruiter
  }

  /**
   * Update a job offer specific fields inside an establishment entity.
   * A job ID is required.
   * @param {string} job_level_label
   * @param {string} job_start_date
   * @param {string[]} job_type
   * @param {boolean} is_disabled_elligible
   * @param {number} job_count
   * @param {string} job_rythm
   * @param {number} job_duration
   * @param {string} job_description
   * @returns {Promise<TEstablishmentResponseSuccess | TResponseError>}
   */
  @Response<"Job update failed">(400)
  @SuccessResponse("200", "Job updated")
  @Patch("/{jobId}")
  @OperationId("updateJob")
  @Security("api_key")
  public async updateJob(@Body() body: Partial<TJob>, @Path() jobId: IJobs["_id"]): Promise<TEstablishmentResponseSuccess | TResponseError> {
    const jobExists = await getOffre(jobId)

    if (!jobExists) {
      return { error: true, message: "Job does not exists" }
    }

    await updateJobSchema.validateAsync(body, { abortEarly: false })

    const updatedRecruiter = await patchOffre(jobId, body)

    this.setStatus(200)
    return updatedRecruiter
  }

  /**
   * Get related training organization related to a job offer.
   * A job ID is required
   *
   * @param {string} jobId
   */
  @Response<"Get delegations failed">(400)
  @SuccessResponse("200", "Get Delegations success")
  @Get("/delegations/{jobId}")
  @OperationId("getDelegation")
  @Security("api_key")
  public async getDelegation(@Path() jobId: IJobs["_id"]): Promise<IGetDelegation | TResponseError> {
    const jobExists = await getOffre(jobId)

    if (!jobExists) {
      this.setStatus(400)
      return { error: true, message: "Job does not exists" }
    }

    const [latitude, longitude] = jobExists.geo_coordinates.split(",")
    const { rome_code } = jobExists.jobs.filter(({ _id }) => _id == jobId)[0]

    // Get related establishment from a job offer
    const etablissements = await getNearEtablissementsFromRomes({ rome: rome_code[0], origin: { latitude, longitude } })

    const top10 = etablissements.slice(0, 10)

    this.setStatus(200)
    return top10
  }

  /**
   * Create delegation related to a job offer.
   * A job ID and a list of establishment IDs are required
   * @param {string[]} establishmentIds
   */
  @Response<"Create delegations failed">(400)
  @SuccessResponse("200", "Delegation created")
  @Post("/delegations/{jobId}")
  @OperationId("createDelegation")
  @Security("api_key")
  public async createDelegation(@Body() body: ICreateDelegation, @Path() jobId: IJobs["_id"]): Promise<TEstablishmentResponseSuccess | TResponseError> {
    const jobExists = await getOffre(jobId)

    if (!jobExists) {
      this.setStatus(400)
      return { error: true, message: "Job does not exists" }
    }

    await createDelegationSchema.validateAsync(body)

    const updatedRecruiter = await createJobDelegations({ jobId, etablissementCatalogueIds: body.establishmentIds })

    this.setStatus(200)
    return updatedRecruiter
  }

  /**
   * Update a job offer status to "Provided".
   * A job ID is required
   *
   * @param {string} jobId
   */
  @Response<"Job update failed">(400)
  @SuccessResponse("204", "Job updated")
  @Post("/provided/{jobId}")
  @OperationId("setJobAsProvided")
  @Security("api_key")
  public async setJobAsProvided(@Path() jobId: IJobs["_id"]): Promise<any | TResponseError> {
    const job = await getJob(jobId)

    if (!job) {
      this.setStatus(400)
      return { error: true, message: "Job does not exists" }
    }

    if (job.job_status === POURVUE) {
      this.setStatus(400)
      return { error: true, message: "Job is already provided" }
    }

    await provideOffre(jobId)

    this.setStatus(200)
    return
  }

  /**
   * Update a job offer status to "Canceled".
   * A job ID is required
   *
   * @param {string} jobId
   */
  @Response<"Job update failed">(400)
  @SuccessResponse("204", "Job updated")
  @Post("/canceled/{jobId}")
  @OperationId("setJobAsCanceled")
  @Security("api_key")
  public async setJobAsCanceled(@Path() jobId: IJobs["_id"]): Promise<any | TResponseError> {
    const job = await getJob(jobId)

    if (!job) {
      this.setStatus(400)
      return { error: true, message: "Job does not exists" }
    }

    if (job.job_status === ANNULEE) {
      this.setStatus(400)
      return { error: true, message: "Job is already canceled" }
    }

    await cancelOffre(jobId)

    this.setStatus(200)
    return
  }

  /**
   * Update a job expiration date by 30 days.
   * A job ID is required
   *
   * @param {string} jobId
   */
  @Response<"Job update failed">(400)
  @SuccessResponse("204", "Job updated")
  @Post("/extend/{jobId}")
  @OperationId("extendJobExpiration")
  @Security("api_key")
  public async extendJobExpiration(@Path() jobId: IJobs["_id"]): Promise<any | TResponseError> {
    const job = await getJob(jobId)

    if (!job) {
      this.setStatus(400)
      return { error: true, message: "Job does not exists" }
    }

    if (dayjs().add(1, "month").isSame(dayjs(job.job_expiration_date), "day")) {
      this.setStatus(400)
      return { error: true, message: "Job is already extended up to a month" }
    }

    if (job.job_status !== ACTIVE) {
      this.setStatus(400)
      return { error: true, message: "Job cannot be extended as it is not enabled" }
    }

    await extendOffre(jobId)

    this.setStatus(200)
    return
  }

  /**
   * Get job opportunities matching the query parameters
   * @param {string} referer the referer provided in the HTTP query headers
   * @param {string} caller the consumer id.
   * @param {string} romes some rome codes separated by commas
   * @param {string} rncp a rncp code
   * @param {string} latitude search center latitude
   * @param {string} longitude search center longitude
   * @param {number} radius the search radius
   * @param {string} insee search center insee code
   * @param {string} sources optional: comma separated list of job opportunities sources
   * @param {string} diploma optional: targeted diploma
   * @param {string} opco optional: filter opportunities on opco name
   * @param {string} opcoUrl optional: filter opportunities on opco url
   * @param {string} useMock optional: wether to return mocked values or not
   * @returns {Promise<IApiError | { lbbCompanies: ILbaItem[] } | { lbaCompanies: ILbaItem[] }>} response
   */
  @Response<"Wrong parameters">(400)
  @Response<"Internal error">(500)
  @SuccessResponse("200", "Get job opportunities success")
  @Get("/")
  @OperationId("getJobOpportunities")
  public async getJobOpportunities(
    @Request() request: express.Request,
    @Query() romes?: string[],
    @Query() rncp?: string,
    @Header() @Hidden() referer?: string,
    @Query() caller?: string,
    @Query() latitude?: string,
    @Query() longitude?: string,
    @Query() radius?: number,
    @Query() insee?: string,
    @Query() sources?: string,
    @Query() diploma?: string,
    @Query() opco?: string,
    @Query() opcoUrl?: string,
    @Query() @Hidden() useMock?: string
  ): Promise<IApiError | { lbbCompanies: ILbaItem[] } | { lbaCompanies: ILbaItem[] }> {
    const result = await getJobsQuery({ romes: romes?.join(",") || null, rncp, caller, referer, latitude, longitude, radius, insee, sources, diploma, opco, opcoUrl, useMock })

    if ("error" in result) {
      this.setStatus(500)
      return result
    }
    const { matchas } = result
    if (matchas && "results" in matchas) {
      matchas.results.map((matchaOffre) => addOffreSearchView(matchaOffre.job.id))
    }
    return result
  }

  /**
   * Get one company identified by it's siret
   * @param {string} siret the siret number of the company looked for.
   * @param {string} caller the consumer id.
   * @param {string} type the type of the company
   * @param {string} referer the referer provided in the HTTP query headers
   * @returns {Promise<IApiError | { lbbCompanies: ILbaItem[] } | { lbaCompanies: ILbaItem[] }>} response
   */
  @Response<"Wrong parameters">(400)
  @Response<"Company not found">(404)
  @Response<"Internal error">(500)
  @SuccessResponse("200", "Get company success")
  @Get("/company/{siret}")
  @OperationId("getCompany")
  public async getCompany(
    @Path() siret: string,
    @Header() @Hidden() referer?: string,
    @Query() caller?: string,
    @Query() type?: string
  ): Promise<IApiError | { lbbCompanies: ILbaItem[] } | { lbaCompanies: ILbaItem[] }> {
    const result = await getCompanyFromSiret({
      siret,
      type,
      referer,
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
    }

    return result
  }

  /**
   * Get one lba job identified by it's id
   * @param {string} id the id the lba job looked for.
   * @param {string} caller the consumer id.
   * @returns {Promise<IApiError | { matchas: ILbaItem[] }>} response
   */
  @Response<"Wrong parameters">(400)
  @Response<"Job not found">(404)
  @Response<"Internal error">(500)
  @SuccessResponse("200", "Get job success")
  @Get("/matcha/{id}")
  @OperationId("getLbaJob")
  public async getLbaJob(@Path() id: string, @Query() caller?: string): Promise<IApiError | { matchas: ILbaItem[] }> {
    const result = await getLbaJobById({
      id,
      caller,
    })

    if ("error" in result) {
      switch (result.error) {
        case "wrong_parameters": {
          this.setStatus(400)
          break
        }
        case "not_found": {
          this.setStatus(404)
          break
        }
        case "expired_job": {
          this.setStatus(419)
          break
        }
        default: {
          this.setStatus(result.status || 500)
          break
        }
      }
    }

    return result
  }

  /**
   * Notifies that the detail of a matcha job has been viewed
   * @param {string} id the id the lba job looked for.
   * @returns {Promise<IApiError | void>} response
   */
  @Response<"Wrong parameters">(400)
  @Response<"Job not found">(404)
  @Response<"Internal error">(500)
  @SuccessResponse("200", "success")
  @Post("/matcha/{id}/stats/view-details")
  @OperationId("statsViewLbaJob")
  public async statsViewLbaJob(@Path() id: string): Promise<IApiError | undefined> {
    await addOffreDetailView(id)
    return
  }

  /**
   * Get one pe job identified by it's id
   * @param {string} id the id the pe job looked for.
   * @param {string} caller the consumer id.
   * @returns {Promise<IApiError | { matchas: ILbaItem[] }>} response
   */
  @Response<"Wrong parameters">(400)
  @Response<"Job not found">(404)
  @Response<"Internal error">(500)
  @SuccessResponse("200", "Get job success")
  @Get("/job/{id}")
  @OperationId("getPeJob")
  public async getPeJob(@Path() id: string, @Query() caller?: string): Promise<IApiError | { peJobs: ILbaItem[] }> {
    const result = await getPeJobFromId({
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
    }

    return result
  }
}
