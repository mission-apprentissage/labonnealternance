import { Controller, Get, Path, OperationId, Response, Route, SuccessResponse, Tags, Query } from "tsoa"
import { getCoupleAppellationRomeIntitule, getMetiers, getMetiersPourCfd, getMetiersPourEtablissement, getTousLesMetiers } from "../../../services/metiers.service.js"
import { TResponseError } from "../shared.controllers.types.js"
import { TGetAppellationsRomesResponseSuccess, TGetMetiersEnrichisResponseSuccess, TGetMetiersResponseSuccess } from "./type.js"

@Tags("Metiers")
@Route("/api/v1/metiers")
export class MetiersController extends Controller {
  /**
   * Retourne la liste des métiers associé à une formation identifiée par son CFD dans le chemin de l'appel
   * @returns {Promise<TMetiersResponseSuccess | TResponseError>}
   */
  @Response<"List unavailable">(500)
  @SuccessResponse("200", "List retrieved")
  @Get("/metiersParFormation/{cfd}")
  @OperationId("getMetiersParCfd")
  public async getMetiersParCFD(@Path() cfd: string): Promise<TGetMetiersResponseSuccess | TResponseError> {
    const result = await getMetiersPourCfd({ cfd })

    if (result.error) {
      this.setStatus(500)
    }

    return result
  }

  /**
   * Retourne la liste des métiers associé à un établissment identifié par son siret dans le chemin de l'appel
   * @returns {Promise<TMetiersResponseSuccess | TResponseError>}
   */
  @Response<"List unavailable">(500)
  @SuccessResponse("200", "List retrieved")
  @Get("/metiersParEtablissement/{siret}")
  @OperationId("getMetiersParEtablissement")
  public async getMetiersParEtablissement(@Path() siret: string): Promise<TGetMetiersResponseSuccess | TResponseError> {
    const result = await getMetiersPourEtablissement({ siret })

    if (result.error) {
      this.setStatus(500)
    }

    return result
  }

  /**
   * Retourne la liste de tous les métiers référencés sur LBA
   * @returns {Promise<TMetiersResponseSuccess | TResponseError>}
   */
  @Response<"List unavailable">(500)
  @SuccessResponse("200", "List retrieved")
  @Get("/all")
  @OperationId("getTousLesMetiers")
  public async getTousLesMetiers(): Promise<TGetMetiersResponseSuccess | TResponseError> {
    const result = await getTousLesMetiers()

    if (result.error) {
      this.setStatus(500)
    }

    return result
  }

  /**
   * Retourne une liste de métiers enrichis avec les codes romes associés correspondant aux critères en paramètres
   * @param {string} title le(s) terme(s) de recherche
   * @param {string[]} romes (optionnel) critère de codes romes
   * @param {string[]} rncps (optionnel) critère de codes RNCPs
   * @returns {Promise<TGetMetiersEnrichisResponseSuccess | TResponseError>}
   */
  @Response<"Missing parameters">(400)
  @Response<"List unavailable">(500)
  @SuccessResponse("200", "List retrieved")
  @Get("/")
  @OperationId("getMetiers")
  public async getMetiers(@Query() title: string, @Query() romes?: string, @Query() rncps?: string): Promise<TGetMetiersEnrichisResponseSuccess> {
    const result = await getMetiers({ title, romes, rncps })

    if (result.error) {
      if (result.error === "missing_parameters") {
        this.setStatus(400)
      } else {
        this.setStatus(500)
      }
    }

    return result
  }

  /**
   * Retourne une liste de métiers enrichis avec les codes romes associés correspondant aux critères en paramètres
   * @param {string} label le(s) terme(s) de recherche
   * @param {string[]} romes (optionnel) critère de codes romes
   * @param {string[]} rncps (optionnel) critère de codes RNCPs
   * @returns {Promise<TGetAppellationsRomesResponseSuccess | TResponseError>}
   */
  @Response<"Missing parameters">(400)
  @Response<"List unavailable">(500)
  @SuccessResponse("200", "List retrieved")
  @Get("/intitule")
  @OperationId("getCoupleAppellationRomeIntitule")
  public async getCoupleAppelationRomeIntitule(@Query() label: string): Promise<TGetAppellationsRomesResponseSuccess> {
    const result = await getCoupleAppellationRomeIntitule(label)

    if (result.error) {
      if (result.error === "missing_parameters") {
        this.setStatus(400)
      } else {
        this.setStatus(500)
      }
    }

    return result
  }
}
