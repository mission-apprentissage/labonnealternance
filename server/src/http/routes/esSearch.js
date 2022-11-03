import Boom from "boom";
import express from "express";
import { isEmpty } from "lodash-es";

import { getElasticInstance } from "../../common/esClient/index.js";
import { logger } from "../../common/logger.js";
import { getNestedQueryFilter } from "../../common/utils/esUtils.js";
import { tryCatch } from "../middlewares/tryCatchMiddleware.js";

const esClient = getElasticInstance();

export default () => {
  const router = express.Router();

  router.post(
    "/:index/_search",
    tryCatch(async (req, res) => {
      const { index } = req.params;
      logger.info(`Es search ${index}`);

      const result = await esClient.search({ index, ...req.query, body: req.body });

      const filters = getNestedQueryFilter(req.body);

      /**
       * Offres array facet filters need to be re-applied to correctly filter the results returned
       * this provide a exact export of data
       *
       * current facet filter :
       * "offres.statut.keyword": ["Annulée"],
       * "offres.libelle.keyword": ["Mécanique, maintenance industrielle"],
       * "offres.niveau.keyword": ["DEUG, BTS, DUT, DEUST"]
       */

      if (filters.length === 0 || isEmpty(filters)) {
        return res.json(result.body);
      } else {
        result.body.hits.hits.forEach((x) => {
          let offres = [];

          if (x._source.offres.length === 0) {
            return;
          }

          x._source.mailing = undefined;
          x._source.events = undefined;

          let filterKeys = Object.keys(filters).map((x) => x.split(".")[1]);

          let copy = x._source.offres;

          if (filterKeys.includes("statut")) {
            copy = copy.filter(({ statut }) => filters["offres.statut.keyword"].some((f) => statut === f));
          }

          if (filterKeys.includes("libelle")) {
            copy = copy.filter(({ libelle }) => filters["offres.libelle.keyword"].some((f) => libelle === f));
          }

          if (filterKeys.includes("niveau")) {
            copy = copy.filter(({ niveau }) => filters["offres.niveau.keyword"].some((f) => niveau === f));
          }

          offres.push(...copy);
          x._source.offres = offres;
        });

        return res.json(result.body);
      }
    })
  );

  router.post(
    "/:index/_count",
    tryCatch(async (req, res) => {
      const { index } = req.params;

      const result = await esClient.count({
        index,
        ...req.query,
        body: req.body,
      });

      return res.json(result.body);
    })
  );

  router.post(
    "/:index/_msearch",
    tryCatch(async (req, res) => {
      const { index } = req.params;
      logger.info(`Es Multi search ${index}`);
      const result = await esClient.msearch({ index, ...req.query, body: req.body, rest_total_hits_as_int: true });

      return res.json(result.body);
    })
  );

  router.post(
    "/:index/scroll",
    tryCatch(async (req, res) => {
      const { index } = req.params;
      logger.info(`Es scrool search ${index}`);

      let qs = req.query;

      let scrollId = null;
      if (qs && qs.scroll_id) {
        scrollId = qs.scroll_id;
      }

      if (scrollId) {
        const response = await esClient.scroll({
          scrollId,
          scroll: "1m",
        });
        return res.json(response.body);
      }

      if (!req.body || req.body === "") {
        throw Boom.badImplementation("something went wrong");
      }

      const result = await esClient.search({
        index,
        scroll: "1m",
        size: 100,
        body: req.body,
      });

      return res.json(result.body);
    })
  );

  return router;
};
