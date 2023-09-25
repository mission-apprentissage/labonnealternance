import { FastifyReply } from "fastify"
import { zRoutes } from "shared/index.js"

import { getCoupleAppellationRomeIntitule, getMetiers, getMetiersPourCfd, getMetiersPourEtablissement, getTousLesMetiers } from "../../../services/metiers.service"
import { Server } from "../../server"

const config = {
  rateLimit: {
    max: 20,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  // /**
  //  * Retourne la liste des métiers associé à une formation identifiée par son CFD dans le chemin de l'appel
  //  * @returns {Promise<TMetiersResponseSuccess | TResponseError>}
  //  */
  // @Response<"List unavailable">(500)
  // @OperationId("getMetiersParCfd")
  // @Tags("Metiers")
  server.get(
    "/api/v1/metiers/metiersParFormation/:cfd",
    {
      schema: zRoutes.get["/api/v1/metiers/metiersParFormation/:cfd"],
      config,
    },
    async (req, res) => {
      const { cfd } = req.params
      const result = await getMetiersPourCfd({ cfd })

      if (result.error) {
        res.status(500)
      }

      return res.send(result)
    }
  )

  // /**
  //  * Retourne la liste des métiers associé à un établissment identifié par son siret dans le chemin de l'appel
  //  * @returns {Promise<TMetiersResponseSuccess | TResponseError>}
  //  */
  // @Response<"List unavailable">(500)
  // @OperationId("getMetiersParEtablissement")
  // @Tags("Metiers")
  server.get(
    "/api/v1/metiers/metiersParEtablissement/:siret",
    {
      schema: zRoutes.get["/api/v1/metiers/metiersParEtablissement/:siret"],
      config,
    },
    async (req, res) => {
      const { siret } = req.params
      const result = await getMetiersPourEtablissement({ siret })

      if (result.error) {
        res.status(500)
      }

      return res.send(result)
    }
  )

  // /**
  //  * Retourne la liste de tous les métiers référencés sur LBA
  //  * @returns {Promise<TMetiersResponseSuccess | TResponseError>}
  //  */
  // @Response<"List unavailable">(500)
  // @OperationId("getTousLesMetiers")
  // public async getTousLesMetiers(): Promise<TGetMetiersResponseSuccess | TResponseError> {
  // @Tags("Metiers")
  server.get(
    "/api/v1/metiers/all",
    {
      schema: zRoutes.get["/api/v1/metiers/all"],
      config,
    },
    async (req, res) => {
      const result = await getTousLesMetiers()

      if (result.error) {
        res.status(500)
      }

      return res.send(result)
    }
  )

  // /**
  //  * Retourne une liste de métiers enrichis avec les codes romes associés correspondant aux critères en paramètres
  //  * @param {string} title le(s) terme(s) de recherche
  //  * @param {string[]} romes (optionnel) critère de codes romes
  //  * @param {string[]} rncps (optionnel) critère de codes RNCPs
  //  * @returns {Promise<TGetMetiersEnrichisResponseSuccess | TResponseError>}
  //  */
  // @Response<"Missing parameters">(400)
  // @Response<"List unavailable">(500)
  // @OperationId("getMetiers")
  // public async getMetiers(@Query() title: string, @Query() romes?: string, @Query() rncps?: string): Promise<TGetMetiersEnrichisResponseSuccess> {
  // @Tags("Metiers")
  server.get(
    "/api/v1/metiers",
    {
      schema: zRoutes.get["/api/v1/metiers"],
      config,
    },
    async (req, res) => {
      const { title, romes, rncps } = req.query
      const result = await getMetiers({ title, romes, rncps })

      if (result.error) {
        if (result.error === "missing_parameters") {
          res.status(400)
        } else {
          res.status(500)
        }
      }

      return res.send(result)
    }
  )

  // /**
  //  * Retourne une liste de métiers enrichis avec les codes romes associés correspondant aux critères en paramètres
  //  * @param {string} label le(s) terme(s) de recherche
  //  * @param {string[]} romes (optionnel) critère de codes romes
  //  * @param {string[]} rncps (optionnel) critère de codes RNCPs
  //  * @returns {Promise<TGetAppellationsRomesResponseSuccess | TResponseError>}
  //  */
  // @Response<"Missing parameters">(400)
  // @Response<"List unavailable">(500)
  // @OperationId("getCoupleAppellationRomeIntitule")
  // public async getCoupleAppelationRomeIntitule(@Query() label: string): Promise<TGetAppellationsRomesResponseSuccess> {
  // @Tags("Metiers")
  server.get(
    "/api/v1/metiers/intitule",
    {
      schema: zRoutes.get["/api/v1/metiers/intitule"],
      config,
    },
    async (req, res) => {
      const { label } = req.query
      const result = await getCoupleAppellationRomeIntitule(label)

      if (result.error) {
        if (result.error === "missing_parameters") {
          res.status(400)
        } else {
          res.status(500)
        }
      }

      return res.send(result)
    }
  )
}
