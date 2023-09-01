/* eslint-disable no-use-before-define */
import * as _ from "lodash-es"
import { matchSorter } from "match-sorter"
import { getElasticInstance } from "../common/esClient/index.js"
import { logger } from "../common/logger.js"
import { sentryCaptureException } from "../common/utils/sentryUtils.js"
import { mockedLabelsAndRomes } from "../mocks/labelsAndRomes-mock.js"
import { getRomesFromCfd, getRomesFromSiret } from "../services/catalogue.service.js"
import { IAppellationsRomes, IMetierEnrichi, IMetiers, IMetiersEnrichis } from "./metiers.service.types.js"

/**
 * Retourne un ensemble de métiers et/ou diplômes et leurs codes romes et rncps associés en fonction de terme de recherches
 * @param {string} title : le terme de recherche (préfixe | mot entier | plusieurs mots ou préfixes)
 * @param {string} withRomeLabels : (optionel) flag indiquant qu'il faut également retourner les libellé associés aux codes romes
 * @param {string} useMock : (optionel) flag indiquant qu'il faut retourner des données mockées
 * @returns {Promise<IMetiersEnrichis>}
 */
export const getRomesAndLabelsFromTitleQuery = async ({
  title,
  useMock,
  withRomeLabels,
}: {
  title: string
  useMock: string
  withRomeLabels: string
}): Promise<IMetiersEnrichis> => {
  if (!title) {
    // error case
    return { error: "title_missing" }
  } else if (useMock) {
    // mock case
    return mockedLabelsAndRomes
  } else {
    // nominal case
    const [romesMetiers, romesDiplomes] = await Promise.all([getLabelsAndRomes(title, withRomeLabels), getLabelsAndRomesForDiplomas(title)])
    return { ...romesMetiers, ...romesDiplomes }
  }
}

const manageError = ({ error, msgToLog }) => {
  sentryCaptureException(error)
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

/**
 * retourne une liste de métiers avec leurs codes romes et codes RNCPs associés. le retour respecte strictement les critères
 * @param {string} title : un préfixe, un mot ou un ensemble de préfixes ou mots sur lesquels fonder une recherche de métiers
 * @param {undefined | string[]} romes : un tableau optionnel de codes ROME pour lesquels limiter la recherche
 * @param {undefined | string[]} rncps: un tableau optionnel de codes RNCP pour lesquels limiter la recherche
 * @returns {Promise<IMetiersEnrichis>}
 */
export const getMetiers = async ({ title = null, romes = null, rncps = null }: { title: string; romes?: string; rncps?: string }): Promise<IMetiersEnrichis> => {
  if (!title && !romes && !rncps) {
    return {
      error: "missing_parameters",
      error_messages: ["Parameters must include at least one from 'title', 'romes' and 'rncps'"],
    }
  } else {
    try {
      const terms = []

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

      const labelsAndRomes = []

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

/**
 * retourne une liste de métiers avec leurs codes romes et codes RNCPs associés. Le retour s'approche au mieux des critères.
 * @param {string} searchTerm : un préfixe, un mot ou un ensemble de préfixes ou mots sur lesquels fonder une recherche de métiers
 * @param {undefined | string} withRomeLabels : indique s'il faut que la fonction retourne également les labels associés aux romes
 * @returns {Promise<IMetiersEnrichis>}
 */
const getLabelsAndRomes = async (searchTerm: string, withRomeLabels?: string): Promise<IMetiersEnrichis> => {
  try {
    const terms = []

    searchTerm.split(" ").forEach((term, idx) => {
      if (idx === 0 || term.length > 2) {
        terms.push(getMultiMatchTerm(term))
      }
    })

    const esClient = getElasticInstance()

    const sources = ["sous_domaine", "codes_romes", "codes_rncps"]
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

    const labelsAndRomes = []

    response.body.hits.hits.forEach((labelAndRome) => {
      const metier: IMetierEnrichi = {
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

/**
 * Retourne les appellations, initués et codes romes correspondant au terme de recherche
 * @param {string} searchTerm un mot ou un préfixe sur lequel doit se baser la recherche
 * @returns {Promise<IAppellationsRomes>}
 */
export const getCoupleAppellationRomeIntitule = async (searchTerm: string): Promise<IAppellationsRomes> => {
  if (!searchTerm) {
    return {
      error: "missing_parameters",
      error_messages: ["Parameters must include a label to search for."],
    }
  }

  try {
    const esClient = getElasticInstance()

    const body = {
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
                            query: searchTerm,
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

    const intitulesAndRomesUnique = _.uniqBy(_.flatten(coupleAppellationRomeMetier), "appellation")

    coupleAppellationRomeMetier = matchSorter(intitulesAndRomesUnique, searchTerm, {
      keys: ["appellation"],
      threshold: matchSorter.rankings.NO_MATCH,
    })

    return { coupleAppellationRomeMetier }
  } catch (error) {
    return manageError({ error, msgToLog: "getting intitule from title" })
  }
}

/**
 * retourne une liste de diplômes avec leurs codes romes et codes RNCPs associés. Le retour s'approche au mieux des critères.
 * @param {string} searchTerm : un préfixe, un mot ou un ensemble de préfixes ou mots sur lesquels fonder une recherche de métiers
 * @returns {Promise<IMetiersEnrichis>}
 */
const getLabelsAndRomesForDiplomas = async (searchTerm: string): Promise<IMetiersEnrichis> => {
  try {
    const terms = []

    searchTerm.split(" ").forEach((term, idx) => {
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

    let labelsAndRomesForDiplomas: IMetierEnrichi[] = []

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
  const labelsAndRomesForDiplomas = []
  const diplomasWithoutLevel = []

  diplomas.forEach((diploma) => {
    const diplomaWithoutLevel = diploma.label.indexOf("(") > 0 ? diploma.label.substring(0, diploma.label.indexOf("(")).trim() : diploma.label

    if (diplomasWithoutLevel.indexOf(diplomaWithoutLevel) < 0) {
      labelsAndRomesForDiplomas.push({ ...diploma, label: diplomaWithoutLevel })
      diplomasWithoutLevel.push(diplomaWithoutLevel)
    }
  })

  return labelsAndRomesForDiplomas
}

/**
 * Récupère la liste des métiers associés à une formation en paramètre identifiée par son CFD
 * @param {string} cfd
 * @returns {Promise<IMetiers>}
 */
export const getMetiersPourCfd = async ({ cfd }: { cfd: string }): Promise<IMetiers> => {
  const romeResponse = await getRomesFromCfd({ cfd })

  if (romeResponse.error) {
    return {
      ...romeResponse,
      metiers: [],
    }
  }

  const romes = [...new Set(romeResponse.romes)]

  const metiers = await getMetiersFromRomes(romes)

  return metiers
}

/**
 * Récupère la liste des métiers associés à un établissement en paramètre identifié par son SIRET
 * @param {string} siret
 * @returns {Promise<IMetiers>}
 */
export const getMetiersPourEtablissement = async ({ siret }: { siret: string }): Promise<IMetiers> => {
  const romeResponse = await getRomesFromSiret({ siret })

  if (romeResponse.error) {
    return {
      ...romeResponse,
      metiers: [],
    }
  }

  const romes = [...new Set(romeResponse.romes)]

  const metiers = await getMetiersFromRomes(romes)

  return metiers
}

/**
 * Récupère la liste des métiers dans la table domaines / métiers correspondant à un tableau de codes ROME
 * @param {string[]} romes
 * @returns {IMetiers}
 */
const getMetiersFromRomes = async (romes: string[]): Promise<IMetiers> => {
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

    const metiers = []

    response.body.hits.hits.forEach((metier) => {
      metiers.push(metier._source.sous_domaine)
    })

    return { metiers }
  } catch (error) {
    return manageError({ error, msgToLog: "getting metiers from romes" })
  }
}

/**
 * Récupère la liste de tous les métiers dans la table domaines / métiers
 * @returns {IMetiers}
 */
export const getTousLesMetiers = async (): Promise<IMetiers> => {
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

    const metiers: string[] = []

    response.body.hits.hits.forEach((metier) => {
      metiers.push(metier._source.sous_domaine)
    })

    metiers.sort()

    return { metiers }
  } catch (error) {
    return manageError({ error, msgToLog: "getting all metiers" })
  }
}
