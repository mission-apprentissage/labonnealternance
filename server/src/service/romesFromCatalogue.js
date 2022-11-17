import Sentry from "@sentry/node"
import _ from "lodash-es"
import { getFormationsES } from "../common/esClient/index.js"

const esClient = getFormationsES()

const getRomesFromCatalogue = async ({ cfd, siret }) => {
  try {
    let mustTerm = []

    if (cfd) {
      mustTerm.push({
        match: {
          cfd,
        },
      })
    }

    if (siret) {
      mustTerm.push({
        match: {
          etablissement_formateur_siret: siret,
        },
      })
    }

    const esQueryIndexFragment = getFormationEsQueryIndexFragment()

    const responseFormations = await esClient.search({
      ...esQueryIndexFragment,
      body: {
        query: {
          bool: {
            must: mustTerm,
          },
        },
      },
    })

    //throw new Error("BOOM");
    let romes = []

    responseFormations.body.hits.hits.forEach((formation) => {
      romes = romes.concat(formation._source.rome_codes)
    })

    let result = { romes: romes }

    if (!romes.length) {
      result.error = "No training found"
    }

    return result
  } catch (err) {
    let error_msg = _.get(err, "meta.body", err.message)
    console.error("Error getting trainings from romes ", error_msg)
    if (_.get(err, "meta.meta.connection.status") === "dead") {
      console.error("Elastic search is down or unreachable")
    }
    Sentry.captureException(err)

    return { romes: [], error: error_msg, message: error_msg }
  }
}

const getRomesFromCfd = ({ cfd }) => {
  return getRomesFromCatalogue({ cfd })
}

const getRomesFromSiret = ({ siret }) => {
  return getRomesFromCatalogue({ siret })
}

const getFormationEsQueryIndexFragment = () => {
  return {
    index: "convertedformations",
    size: 1000,
    _source_includes: ["rome_codes"],
  }
}

export { getRomesFromCfd, getRomesFromSiret }
