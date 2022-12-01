import Sentry from "@sentry/node"
import _ from "lodash-es"
import { matchSorter } from "match-sorter"
import { getElasticInstance } from "../common/esClient/index.js"
import { logger } from "../common/logger.js"
import config from "../config.js"
import getMissingRNCPsFromDomainesMetiers from "../jobs/domainesMetiers/getMissingRNCPsFromDomainesMetiers.js"
import { getRomesFromCfd, getRomesFromSiret } from "./romesFromCatalogue.js"

export const getRomesAndLabelsFromTitleQuery = async (query) => {
  if (!query.title) return { error: "title_missing" }
  else {
    let [romesMetiers, romesDiplomes] = await Promise.all([getLabelsAndRomes(query.title, query.withRomeLabels), getLabelsAndRomesForDiplomas(query.title)])
    return { ...romesMetiers, ...romesDiplomes }
  }
}

const manageError = ({ error, msgToLog }) => {
  Sentry.captureException(error)
  let error_msg = _.get(error, "meta.body") ?? error.message

  if (typeof error_msg === "object") {
    error_msg = JSON.stringify(error_msg, null, 2)
  }

  if (error?.meta?.meta?.connection?.status === "dead") {
    logger.error(`Elastic search is down or unreachable. error_message=${error_msg}`)
  } else {
    logger.error(`Error getting ${msgToLog}. error_message=${error_msg}`)
  }

  return { error: error_msg }
}

const getMultiMatchTerm = (term) => {
  return {
    bool: {
      must: {
        multi_match: {
          query: term,
          fields: [
            "sous_domaine^80",
            "appellations_romes^15",
            "intitules_romes^7",
            "intitules_rncps^7",
            "mots_clefs_specifiques^40",
            "domaine^3",
            "mots_clefs^3",
            "sous_domaine_onisep^1",
            "intitules_fap^1",
          ],
          type: "phrase_prefix",
          operator: "or",
        },
      },
    },
  }
}

const getMultiMatchTermForDiploma = (term) => {
  return {
    bool: {
      must: {
        multi_match: {
          query: term,
          fields: ["intitule_long^1", "acronymes_intitule^2"],
          type: "phrase_prefix",
          operator: "or",
        },
      },
    },
  }
}

export const getMetiers = async ({ title = null, romes = null, rncps = null }) => {
  if (!title && !romes && !rncps) {
    return {
      error: "missing_parameters",
      error_messages: ["Parameters must include at least one from 'title', 'romes' and 'rncps'"],
    }
  } else {
    try {
      let terms = []

      if (title) {
        title.split(" ").forEach((term, idx) => {
          if (idx === 0 || term.length > 2) {
            terms.push(getMultiMatchTerm(term))
          }
        })
      }

      if (romes) {
        terms.push({
          bool: {
            must: {
              match: {
                codes_romes: romes,
              },
            },
          },
        })
      }

      if (rncps) {
        terms.push({
          bool: {
            must: {
              match: {
                codes_rncps: rncps,
              },
            },
          },
        })
      }

      const esClient = getElasticInstance()

      const response = await esClient.search({
        index: "domainesmetiers",
        size: 20,
        _source_includes: ["sous_domaine", "codes_romes", "codes_rncps"],
        body: {
          query: {
            bool: {
              must: terms,
            },
          },
        },
      })

      let labelsAndRomes = []

      response.body.hits.hits.forEach((labelAndRome) => {
        labelsAndRomes.push({
          label: labelAndRome._source.sous_domaine,
          romes: labelAndRome._source.codes_romes,
          rncps: labelAndRome._source.codes_rncps,
          type: "job",
        })
      })

      return { labelsAndRomes }
    } catch (error) {
      return manageError({ error, msgToLog: "getting metiers from title romes and rncps" })
    }
  }
}

const getLabelsAndRomes = async (searchKeyword, withRomeLabels) => {
  try {
    let terms = []

    searchKeyword.split(" ").forEach((term, idx) => {
      if (idx === 0 || term.length > 2) {
        terms.push(getMultiMatchTerm(term))
      }
    })

    const esClient = getElasticInstance()

    let sources = ["sous_domaine", "codes_romes", "codes_rncps"]
    if (withRomeLabels) {
      sources.push("couples_romes_metiers")
    }

    const response = await esClient.search({
      index: "domainesmetiers",
      size: 20,
      _source_includes: sources,
      body: {
        query: {
          bool: {
            should: terms,
          },
        },
      },
    })

    let labelsAndRomes = []

    response.body.hits.hits.forEach((labelAndRome) => {
      let metier = {
        label: labelAndRome._source.sous_domaine,
        romes: labelAndRome._source.codes_romes,
        rncps: labelAndRome._source.codes_rncps,
        type: "job",
      }

      if (withRomeLabels) {
        metier.romeTitles = labelAndRome._source.couples_romes_metiers
      }

      labelsAndRomes.push(metier)
    })

    return { labelsAndRomes }
  } catch (error) {
    return manageError({ error, msgToLog: "getting metiers from title" })
  }
}

export const getCoupleAppellationRomeIntitule = async (searchKeyword) => {
  if (!searchKeyword) {
    return {
      error: "missing_parameters",
      error_messages: ["Parameters must include a label to search for."],
    }
  }

  try {
    const esClient = getElasticInstance()

    let body = {
      query: {
        bool: {
          must: [
            {
              nested: {
                path: "couples_appellations_rome_metier",
                query: {
                  bool: {
                    should: [
                      {
                        match: {
                          "couples_appellations_rome_metier.appellation": {
                            query: searchKeyword,
                            fuzziness: 4,
                            operator: "and",
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    }

    const response = await esClient.search({ index: "domainesmetiers", body })

    let coupleAppellationRomeMetier = []

    response.body.hits.hits.map((item) => {
      coupleAppellationRomeMetier.push([...item._source.couples_appellations_rome_metier])
    })

    let intitulesAndRomesUnique = _.uniqBy(_.flatten(coupleAppellationRomeMetier), "appellation")

    coupleAppellationRomeMetier = matchSorter(intitulesAndRomesUnique, searchKeyword, {
      keys: ["appellation"],
      threshold: matchSorter.rankings.NO_MATCH,
    })

    return { coupleAppellationRomeMetier }
  } catch (error) {
    return manageError({ error, msgToLog: "getting intitule from title" })
  }
}

const getLabelsAndRomesForDiplomas = async (searchKeyword) => {
  try {
    let terms = []

    searchKeyword.split(" ").forEach((term, idx) => {
      if (idx === 0 || term.length > 2) {
        terms.push(getMultiMatchTermForDiploma(term))
      }
    })

    const esClient = getElasticInstance()

    const response = await esClient.search({
      index: "diplomesmetiers",
      size: 20,
      _source_includes: ["intitule_long", "codes_romes", "codes_rncps"],
      body: {
        query: {
          bool: {
            should: terms,
          },
        },
      },
    })

    let labelsAndRomesForDiplomas = []

    response.body.hits.hits.forEach((labelAndRomeForDiploma) => {
      labelsAndRomesForDiplomas.push({
        label: labelAndRomeForDiploma._source.intitule_long,
        romes: labelAndRomeForDiploma._source.codes_romes,
        rncps: labelAndRomeForDiploma._source.codes_rncps,
        type: "diploma",
      })
    })

    labelsAndRomesForDiplomas = removeDuplicateDiplomas(labelsAndRomesForDiplomas)

    return { labelsAndRomesForDiplomas }
  } catch (error) {
    return manageError({ error, msgToLog: "getting diplomes from title" })
  }
}

const removeDuplicateDiplomas = (diplomas) => {
  let labelsAndRomesForDiplomas = []
  let diplomasWithoutLevel = []

  diplomas.forEach((diploma) => {
    let diplomaWithoutLevel = diploma.label.indexOf("(") > 0 ? diploma.label.substring(0, diploma.label.indexOf("(")).trim() : diploma.label

    if (diplomasWithoutLevel.indexOf(diplomaWithoutLevel) < 0) {
      labelsAndRomesForDiplomas.push({ ...diploma, label: diplomaWithoutLevel })
      diplomasWithoutLevel.push(diplomaWithoutLevel)
    }
  })

  return labelsAndRomesForDiplomas
}

export const getMissingRNCPs = async (query) => {
  if (!query.secret) {
    return { error: "secret_missing" }
  } else if (query.secret !== config.secretUpdateRomesMetiers) {
    return { error: "wrong_secret" }
  } else {
    try {
      let result = await getMissingRNCPsFromDomainesMetiers(query.fileName)
      return result
    } catch (err) {
      Sentry.captureException(err)

      let error_msg = _.get(err, "meta.body") ?? err.message

      return { error: error_msg }
    }
  }
}

export const getMetiersPourCfd = async ({ cfd }) => {
  let romeResponse = await getRomesFromCfd({ cfd })

  if (romeResponse.error) {
    romeResponse.metiers = []
    return romeResponse
  }

  const romes = [...new Set(romeResponse.romes)]

  let metiers = await getMetiersFromRomes(romes)

  return metiers
}

export const getMetiersPourEtablissement = async ({ siret }) => {
  let romeResponse = await getRomesFromSiret({ siret })

  if (romeResponse.error) {
    romeResponse.metiers = []
    return romeResponse
  }

  const romes = [...new Set(romeResponse.romes)]

  let metiers = await getMetiersFromRomes(romes)

  return metiers
}

const getMetiersFromRomes = async (romes) => {
  /**
   * récupère dans la table custo tous les métiers qui correspondent au tableau de romes en paramètres
   */
  try {
    const esClient = getElasticInstance()

    const response = await esClient.search({
      index: "domainesmetiers",
      size: 20,
      _source_includes: ["sous_domaine"],
      body: {
        query: {
          match: {
            codes_romes: romes.join(","),
          },
        },
      },
    })

    let metiers = []

    response.body.hits.hits.forEach((metier) => {
      metiers.push(metier._source.sous_domaine)
    })

    return { metiers }
  } catch (error) {
    return manageError({ error, msgToLog: "getting metiers from romes" })
  }
}

export const getTousLesMetiers = async () => {
  /**
   * récupère dans la table custo tous les métiers
   */
  try {
    const esClient = getElasticInstance()

    const response = await esClient.search({
      index: "domainesmetiers",
      size: 200,
      _source_includes: ["sous_domaine"],
      body: {
        query: {
          match_all: {},
        },
      },
    })

    let metiers = []

    response.body.hits.hits.forEach((metier) => {
      metiers.push(metier._source.sous_domaine)
    })

    metiers.sort()

    return { metiers }
  } catch (error) {
    return manageError({ error, msgToLog: "getting all metiers" })
  }
}
