import querystring from "querystring"

import axios from "axios"
import { zRoutes } from "shared/index"

import config from "../../../config"
import dayjs from "../../../services/dayjs.service"
import { getRomesAndLabelsFromTitleQuery } from "../../../services/metiers.service"
import { Server } from "../../server"

const rateLimiterConfig = {
  rateLimit: {
    max: 10,
    timeWindow: "1s",
  },
}

const isTokenValid = (token) => token.expire?.isAfter(dayjs())

const getToken = async (token = {}) => {
  const isValid = isTokenValid(token)

  if (isValid) {
    return token
  }

  try {
    const response = await axios.post(
      "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=partenaire",
      querystring.stringify({
        grant_type: "client_credentials",
        client_id: config.poleEmploi.clientId,
        client_secret: config.poleEmploi.clientSecret,
        scope: `api_romev1 application_${config.poleEmploi.clientId} nomenclatureRome`,
      }),
      {
        headers: {
          Authorization: `Bearer ${config.poleEmploi.clientSecret}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )

    return {
      ...response.data,
      expire: dayjs().add(response.data.expires_in - 10, "s"),
    }
  } catch (error) {
    console.error(error)
    return error.response.data
  }
}

// TODO: Remove duplicated routes
/**
 * API romes
 */
export default function (server: Server) {
  let token = {}

  server.get(
    "/api/romelabels",
    {
      schema: zRoutes.get["/api/romelabels"],
      config: rateLimiterConfig,
    },
    async (req, res) => {
      const result = await getRomesAndLabelsFromTitleQuery(req.query)
      return res.status(200).send(result)
    }
  )

  server.get(
    "/api/rome",
    {
      schema: zRoutes.get["/api/rome"],
      config: rateLimiterConfig,
    },
    async (req, res) => {
      const result = await getRomesAndLabelsFromTitleQuery(req.query)
      return res.status(200).send(result)
    }
  )

  server.get("/api/romelabels/detail/:rome", async (req, res) => {
    token = await getToken(token)

    const response = await axios.get(`https://api.pole-emploi.io/partenaire/rome/v1/metier/${req.params.rome}`, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    })

    return res.status(200).send(response.data)
  })

  server.get("/api/rome/detail/:rome", async (req, res) => {
    token = await getToken(token)

    const response = await axios.get(`https://api.pole-emploi.io/partenaire/rome/v1/metier/${req.params.rome}`, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    })

    return res.status(200).send(response.data)
  })
}
