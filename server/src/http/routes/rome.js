import axios from "axios";
import express from "express";
import querystring from "querystring";
import dayjs from "../../common/dayjs.js";
import config from "../../config.js";
import { getRomesAndLabelsFromTitleQuery } from "../../service/domainesMetiers.js";
import { tryCatch } from "../middlewares/tryCatchMiddleware.js";

/**
 * API romes
 */

const isTokenValid = (token) => token.expire?.isAfter(dayjs());

const getToken = async (token = {}) => {
  let isValid = isTokenValid(token);

  if (isValid) {
    return token;
  }

  try {
    const response = await axios.post(
      "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=partenaire",
      querystring.stringify({
        grant_type: "client_credentials",
        client_id: config.poleEmploi.client_id,
        client_secret: config.poleEmploi.client_secret,
        scope: `api_romev1 application_${config.poleEmploi.client_id} nomenclatureRome`,
      }),
      {
        headers: {
          Authorization: `Bearer ${config.poleEmploi.client_secret}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return {
      ...response.data,
      expire: dayjs().add(response.data.expires_in - 10, "s"),
    };
  } catch (error) {
    console.log(error);
    return error.response.data;
  }
};

export default function () {
  const router = express.Router();
  let token = {};

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await getRomesAndLabelsFromTitleQuery(req.query);
      return res.json(result);
    })
  );

  router.get(
    "/detail/:rome",
    tryCatch(async (req, res) => {
      token = await getToken(token);

      let response = await axios.get(`https://api.emploi-store.fr/partenaire/rome/v1/metier/${req.params.rome}`, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });

      return res.json(response.data);
    })
  );

  return router;
}
