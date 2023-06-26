import * as express from "express"
import { Body, Controller, Get, Header, Hidden, OperationId, Patch, Path, Post, Query, Request, Response, Route, Security, SuccessResponse, Tags } from "tsoa"
import { ICreateDelegation, ICreateJobBody, IGetDelegation, TCreateEstablishmentBody, TEstablishmentResponseSuccess, TJob, TResponseError } from "./jobs.types.js"
import { createDelegationSchema, createJobEntitySchema, createJobSchema, updateJobSchema } from "./jobs.validators.js"
import { formatEntrepriseData, getEtablissement, getEtablissementFromGouv, getGeoCoordinates } from "../../../services/etablissement.service.js"
import { Recruiter } from "../../../common/model/index.js"
import { createUser, updateUserValidationHistory } from "../../../services/userRecruteur.service.js"
import { IUserRecruteur } from "../../../common/model/schema/userRecruteur/userRecruteur.types.js"
import { cancelOffre, createJobDelegations, createOffre, extendOffre, getFormulaire, getFormulaires, patchOffre, provideOffre } from "../../../services/formulaire.service.js"
import { IJobs } from "../../../common/model/schema/jobs/jobs.types.js"
import dayjs from "../../../common/dayjs.js"
import { getAppellationDetailsFromAPI, getRomeDetailsFromAPI } from "../../../services/rome.service.js"
import { getOffre } from "../../../services/formulaire.service.js"
import { getNearEtablissementsFromRomes } from "../../../services/catalogue.service.js"
import { ENTREPRISE, etat_utilisateur, validation_utilisateur } from "../../../common/constants.js"
import { delay } from "../../../common/utils/asyncUtils.js"
import { ICredential } from "../../../common/model/schema/credentials/credential.types.js"
import { IApiError } from "../../../common/utils/errorManager.js"
import { ILbaItem } from "../../../services/lbaitem.shared.service.types.js"
import { getCompanyFromSiret } from "../../../service/poleEmploi/bonnesBoites.js"
import { getMatchaJobById } from "../../../service/matcha.js"

@Tags("Jobs")
@Route("/api/v1/jobs")
export class JobsController extends Controller {
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
  ): Promise<TEstablishmentResponseSuccess | {}> {
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
    const { first_name, last_name, phone, email, origin, establishment_siret } = body
    const user: ICredential = request.user

    const establishmentExists = await getEtablissement({ email })

    if (establishmentExists) {
      this.setStatus(400)
      return { error: true, message: "Email is already linked with an establishment" }
    }
    // Validate establishment parameters
    await createJobEntitySchema.validateAsync(body, { abortEarly: false })

    // Get siret information from API
    const establishmentInformations = await getEtablissementFromGouv(establishment_siret)

    // If establishment is closed, throw error
    if (establishmentInformations.etablissement.etat_administratif.value === "F") {
      return { error: true, message: "Establishment is closed" }
    }

    // Format establishment data returned by API
    // Initialize establishment object
    const establishment = {
      origin: `${user.scope}-${origin}`,
      first_name,
      last_name,
      phone,
      email,
      type: ENTREPRISE,
      is_email_checked: true,
      is_qualiopi: false,
      ...formatEntrepriseData(establishmentInformations.etablissement),
    }

    // Get geocoordinates
    establishment.geo_coordinates = await getGeoCoordinates(`${establishment.address_detail.l4}, ${establishment.address_detail.l6}`)

    /**
     *  KBA 25052023 : Bellow logic will be update with the global refactoring of the service logic
     */
    // Create entry in Recruiter collection
    const newEstablishment = await Recruiter.create(establishment)
    // Create entry in UserRecruter collection
    const newUser = await createUser({ ...establishment, establishment_id: newEstablishment.establishment_id })
    // Update user status to valid
    await updateUserValidationHistory(newUser._id, {
      validation_type: validation_utilisateur.AUTO,
      user: "SERVEUR",
      status: etat_utilisateur.VALIDE,
    })

    this.setStatus(201)
    return newEstablishment
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
      job_status: "Active",
      job_type: body.job_type,
      rome_detail: romeDetails,
      is_disabled_elligible: body.is_disabled_elligible,
      job_count: body.job_count,
      job_duration: body.job_duration,
      job_rythm: body.job_rythm,
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
  public async updateJob(@Body() body: TJob, @Path() jobId: IJobs["_id"]): Promise<TEstablishmentResponseSuccess | TResponseError> {
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
   * @param {String} jobId
   */
  @Response<"Get delegations failed">(400)
  @SuccessResponse("200", "Get Delegations success")
  @Get("/delegations/{jobId}")
  @OperationId("getDelegation")
  @Security("api_key")
  public async getDelegation(@Path() jobId: IJobs["_id"]): Promise<IGetDelegation | TResponseError> {
    const jobExists = await getOffre(jobId)

    if (!jobExists) {
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
   * @param {String} jobId
   */
  @Response<"Job update failed">(400)
  @SuccessResponse("204", "Job updated")
  @Post("/provided")
  @OperationId("setJobAsProvided")
  @Security("api_key")
  public async setJobAsProvided(@Body() body: { jobId: IJobs["_id"] }): Promise<{} | TResponseError> {
    const jobExists = await getOffre(body.jobId)

    if (!jobExists) {
      return { error: true, message: "Job does not exists" }
    }

    await provideOffre(body.jobId)

    this.setStatus(204)
    return
  }

  /**
   * Update a job offer status to "Canceled".
   * A job ID is required
   *
   * @param {String} jobId
   */
  @Response<"Job update failed">(400)
  @SuccessResponse("204", "Job updated")
  @Post("/canceled")
  @OperationId("setJobAsCanceled")
  @Security("api_key")
  public async setJobAsCanceled(@Body() body: { jobId: IJobs["_id"] }): Promise<{} | TResponseError> {
    const jobExists = await getOffre(body.jobId)

    if (!jobExists) {
      return { error: true, message: "Job does not exists" }
    }

    await cancelOffre(body.jobId)

    this.setStatus(204)
    return
  }

  /**
   * Update a job expiration date by 30 days.
   * A job ID is required
   *
   * @param {String} jobId
   */
  @Response<"Job update failed">(400)
  @SuccessResponse("204", "Job updated")
  @Post("/extend")
  @OperationId("extendJobExpiration")
  @Security("api_key")
  public async extendJobExpiration(@Body() body: { jobId: IJobs["_id"] }): Promise<{} | TResponseError> {
    const jobExists = await getOffre(body.jobId)

    if (!jobExists) {
      return { error: true, message: "Job does not exists" }
    }

    await extendOffre(body.jobId)

    this.setStatus(204)
    return
  }

  /**
   * Get one company identified by it's siret
   * @param {string} siret the siret number of the company looked for.
   * @param {string} caller the consumer id.
   * @param {string} type the type of the company
   * @param {string} referer the referer provided in the HTTP query headers
   * @returns {Promise<IApiError | { lbbCompanies: ILbaItem[] } | { lbaCompanies: ILbaItem[] }>} response
   */
  @Response<"Company not found">(404)
  @Response<"Internal error">(500)
  @SuccessResponse("200", "Get company success")
  @Get("/company/{siret}")
  @OperationId("getCompany")
  public async getCompany(
    @Path() siret: string,
    @Header() @Hidden() referer: string,
    @Query() caller?: string,
    @Query() type?: string
  ): Promise<IApiError | { lbbCompanies: ILbaItem[] } | { lbaCompanies: ILbaItem[] }> {
    console.log(referer, caller, type, siret)
    const result = await getCompanyFromSiret({
      siret,
      type,
      referer,
      caller,
    })

    if (result.error) {
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
  @Response<"Company not found">(404)
  @Response<"Internal error">(500)
  @SuccessResponse("200", "Get company success")
  @Get("/matcha/{id}")
  @OperationId("getLbaJob")
  public async getLbaJob(@Path() id: string, @Query() caller?: string): Promise<IApiError | { matchas: ILbaItem[] }> {
    console.log(caller, id)
    const result = await getMatchaJobById({
      id,
      caller,
    })

    if (result.error) {
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
