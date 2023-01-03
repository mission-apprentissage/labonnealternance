import Sentry from "@sentry/node"
import _ from "lodash-es"
import { getElasticInstance } from "../common/esClient/index.js"

const esClient = getElasticInstance()

const getDiplomasForJobs = async (romes /*, rncps*/) => {
  try {
    const esQueryIndexFragment = getFormationEsQueryIndexFragment()

    const responseDiplomas = await esClient.search({
      ...esQueryIndexFragment,
      body: {
        query: {
          match: {
            rome_codes: romes,
          },
          /*
        //replace match rome_code with the line below to list all available diplomas 
        match_all: {},*/
          /*
        FIXME: lors de l'activation du cloisonnement RNCP
        bool: {
          must: [{ match: { rome_codes: romes } }, { match: { rncp_code: rncps } }],
        },*/
        },
        aggs: {
          niveaux: {
            terms: {
              field: "niveau.keyword",
              size: 10,
            },
          },
        },
        size: 0,
      },
    })

    let diplomas = []

    responseDiplomas.body.aggregations.niveaux.buckets.forEach((diploma) => {
      diplomas.push(diploma.key)
    })

    return diplomas
  } catch (err) {
    Sentry.captureException(err)

    let error_msg = _.get(err, "meta.body") ? err.meta.body : err.message
    console.log("Error getting jobDiplomas from romes and rncps", error_msg)
    if (_.get(err, "meta.meta.connection.status") === "dead") {
      console.log("Elastic search is down or unreachable")
    }
    return { error: error_msg }
  }
}

const getDiplomasForJobsQuery = async (query) => {
  //console.log("query : ", query);

  if (!query.romes) {
    return "romes_missing"
  } else if (!query.rncps) {
    return "rncps_missing"
  } else {
    try {
      const diplomas = await getDiplomasForJobs(query.romes, query.rncps)
      return diplomas
    } catch (err) {
      console.log("Error ", err.message)
      return { error: "internal_error" }
    }
  }
}

const getFormationEsQueryIndexFragment = () => {
  return {
    index: "formationcatalogues",
    size: 1000,
  }
}

export { getDiplomasForJobsQuery, getDiplomasForJobs }
