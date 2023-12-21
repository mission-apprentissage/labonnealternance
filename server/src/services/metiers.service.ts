import Boom from "boom"
import * as _ from "lodash-es"
import { matchSorter } from "match-sorter"

import { DiplomesMetiers, DomainesMetiers } from "@/common/model"
import { IDomainesMetiers } from "@/common/model/schema/domainesmetiers/domainesmetiers.types"
import { db } from "@/common/mongodb"

import { search } from "../common/esClient/index"

import { getRomesFromCatalogue } from "./catalogue.service"
import { IAppellationsRomes, IMetierEnrichi, IMetiers, IMetiersEnrichis } from "./metiers.service.types"

/**
 * Retourne un ensemble de métiers et/ou diplômes et leurs codes romes et rncps associés en fonction de terme de recherches
 */
export const getRomesAndLabelsFromTitleQuery = async ({ title, withRomeLabels }: { title: string; withRomeLabels?: boolean }): Promise<IMetiersEnrichis> => {
  // nominal case
  const [romesMetiers, romesDiplomes] = await Promise.all([getLabelsAndRomes(title, withRomeLabels), getLabelsAndRomesForDiplomas(title)])
  return { ...romesMetiers, ...romesDiplomes }
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

const searchableWeightedFields = [
  { field: "sous_domaine_sans_accent", score: 80 },
  { field: "domaine_sans_accent", score: 3 },
  { field: "intitules_romes_sans_accent", score: 7 },
  { field: "intitules_rncps_sans_accent", score: 7 },
  { field: "mots_clefs_sans_accent", score: 3 },
  { field: "mots_clefs_specifiques_sans_accent", score: 40 },
  { field: "appellations_romes_sans_accent", score: 15 },
  { field: "intitules_fap_sans_accent", score: 1 },
  { field: "sous_domaine_onisep_sans_accent", score: 1 },
]

const buildTermFilter = (regexes: any[]): { $or: { $regex: any }[] } => {
  const query: { $or: { $regex: any }[] } = { $or: [] }

  searchableWeightedFields.forEach((f) =>
    regexes.forEach((r) => {
      const fieldSearch: any = {}
      fieldSearch[f.field] = { $regex: r }
      query.$or.push(fieldSearch)
    })
  )

  return query
}

const applyWeightToResults = (results: (IDomainesMetiers & { score?: number })[], regexes: any[]) => {
  results.map((result) =>
    searchableWeightedFields.map(({ field, score }) =>
      regexes.map((regex) => {
        const valueToTest = result[field] instanceof Array ? result[field].join(" ") : result[field]
        if (valueToTest.match(regex)) {
          result.score = score + (result.score ?? 0)
        }
      })
    )
  )
}

/**
 * retourne une liste de métiers avec leurs codes romes et codes RNCPs associés. le retour respecte strictement les critères
 */
export const getMetiers = async ({
  title,
  romes,
  rncps,
}: {
  title: string
  romes?: string
  rncps?: string
}): Promise<{ labelsAndRomes: Omit<IMetierEnrichi, "romeTitles">[]; labelsAndRomesMongo: Omit<IMetierEnrichi, "romeTitles">[] }> => {
  if (!title && !romes && !rncps) {
    throw Boom.badRequest("Parameters must include at least one from 'title', 'romes' and 'rncps'")
  } else {
    try {
      const terms: any[] = []

      const regexes: any[] = []

      if (title) {
        title.split(" ").forEach((term, idx) => {
          if (idx === 0 || term.length > 2) {
            terms.push(getMultiMatchTerm(term))
            regexes.push(new RegExp(`\\b${term}`, "i"))
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

      const response = await search(
        {
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
        },
        DomainesMetiers
      )

      const termFilter = buildTermFilter(regexes)

      //console.log("mongoQuery : ", termFilter)
      let metiers: (IDomainesMetiers & { score?: number })[] = await db
        .collection("domainesmetiers")
        .find(termFilter, { sous_domaine: 1, codes_romes: 1, codes_rncps: 1, _id: 0 })
        .toArray()
      applyWeightToResults(metiers, regexes)
      metiers = metiers.sort((a: IDomainesMetiers & { score?: number }, b: IDomainesMetiers & { score?: number }) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 20)

      // console.log("*********")
      // response.map((labelAndRome) => console.log(labelAndRome._score, labelAndRome._source.sous_domaine))
      // console.log("---------")
      // metiers.map((labelAndRome) => console.log(labelAndRome.score, labelAndRome.sous_domaine))
      // console.log("---------")
      const labelsAndRomes: Omit<IMetierEnrichi, "romeTitles">[] = response.map((labelAndRome) => ({
        label: labelAndRome._source.sous_domaine,
        romes: labelAndRome._source.codes_romes,
        rncps: labelAndRome._source.codes_rncps,
        type: "job",
      }))

      const labelsAndRomesMongo: Omit<IMetierEnrichi, "romeTitles">[] = metiers.map((labelAndRome) => ({
        label: labelAndRome.sous_domaine,
        romes: labelAndRome.codes_romes,
        rncps: labelAndRome.codes_rncps,
        type: "job",
      }))

      return { labelsAndRomes, labelsAndRomesMongo }
    } catch (error) {
      const newError = Boom.internal("getting metiers from title romes and rncps")
      newError.cause = error
      throw newError
    }
  }
}

/**
 * retourne une liste de métiers avec leurs codes romes et codes RNCPs associés. Le retour s'approche au mieux des critères.
 * @param {string} searchTerm : un préfixe, un mot ou un ensemble de préfixes ou mots sur lesquels fonder une recherche de métiers
 * @param {undefined | string} withRomeLabels : indique s'il faut que la fonction retourne également les labels associés aux romes
 */
const getLabelsAndRomes = async (searchTerm: string, withRomeLabels?: boolean): Promise<{ labelsAndRomes: IMetierEnrichi[] }> => {
  try {
    const terms: any[] = []

    searchTerm.split(" ").forEach((term, idx) => {
      if (idx === 0 || term.length > 2) {
        terms.push(getMultiMatchTerm(term))
      }
    })

    const sources = ["sous_domaine", "codes_romes", "codes_rncps"]
    if (withRomeLabels) {
      sources.push("couples_romes_metiers")
    }

    const response = await search(
      {
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
      },
      DomainesMetiers
    )

    const labelsAndRomes: any[] = []

    response.forEach((labelAndRome) => {
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
    const newError = Boom.internal("getting metiers from title")
    newError.cause = error
    throw newError
  }
}

/**
 * Retourne les appellations, intitulés et codes romes correspondant au terme de recherche
 * @param {string} searchTerm un mot ou un préfixe sur lequel doit se baser la recherche
 * @returns {Promise<IAppellationsRomes>}
 */
export const getCoupleAppellationRomeIntitule = async (searchTerm: string): Promise<IAppellationsRomes> => {
  try {
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

    const response = await search({ index: "domainesmetiers", body }, DomainesMetiers)

    const domaineMetiers: IDomainesMetiers[] = response.map(({ _source }) => _source)
    const coupleAppellationRomeMetier = domaineMetiers.map(({ couples_appellations_rome_metier }) => couples_appellations_rome_metier)
    const intitulesAndRomesUnique = _.uniqBy(_.flatten(coupleAppellationRomeMetier), "appellation")
    const sorted = matchSorter(intitulesAndRomesUnique, searchTerm, {
      keys: ["appellation"],
      threshold: matchSorter.rankings.NO_MATCH,
    })
    return { coupleAppellationRomeMetier: sorted }
  } catch (error) {
    const newError = Boom.internal("getting intitule from title")
    newError.cause = error
    throw newError
  }
}

/**
 * retourne une liste de diplômes avec leurs codes romes et codes RNCPs associés. Le retour s'approche au mieux des critères.
 * @param {string} searchTerm : un préfixe, un mot ou un ensemble de préfixes ou mots sur lesquels fonder une recherche de métiers
 */
const getLabelsAndRomesForDiplomas = async (searchTerm: string): Promise<{ labelsAndRomesForDiplomas: IMetierEnrichi[] }> => {
  try {
    const terms: any[] = []

    searchTerm.split(" ").forEach((term, idx) => {
      if (idx === 0 || term.length > 2) {
        terms.push(getMultiMatchTermForDiploma(term))
      }
    })

    const response = await search(
      {
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
      },
      DiplomesMetiers
    )

    let labelsAndRomesForDiplomas: IMetierEnrichi[] = []

    response.forEach((labelAndRomeForDiploma) => {
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
    const newError = Boom.internal("getting diplomes from title")
    newError.cause = error
    throw newError
  }
}

const removeDuplicateDiplomas = (diplomas) => {
  const labelsAndRomesForDiplomas: any[] = []
  const diplomasWithoutLevel: any[] = []

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
  const romeResponse = await getRomesFromCatalogue({ cfd })
  const { romes } = romeResponse
  const metiers = await getMetiersFromRomes(romes)
  return metiers
}

/**
 * Récupère la liste des métiers dans la table domaines / métiers correspondant à un tableau de codes ROME
 * @param {string[]} romes
 * @returns {IMetiers}
 */
const getMetiersFromRomes = async (romes: string[]): Promise<IMetiers> => {
  const response = await search(
    {
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
    },
    DomainesMetiers
  )
  const metiers: string[] = response.map((metier) => {
    return metier._source.sous_domaine
  })
  return { metiers }
}

/**
 * Récupère la liste de tous les métiers dans la table domaines / métiers
 * @returns {IMetiers}
 */
export const getTousLesMetiers = async (): Promise<IMetiers> => {
  try {
    const response = await search(
      {
        index: "domainesmetiers",
        size: 200,
        _source_includes: ["sous_domaine"],
        body: {
          query: {
            match_all: {},
          },
        },
      },
      DomainesMetiers
    )

    const metiers: string[] = []

    response.forEach((metier) => {
      metiers.push(metier._source.sous_domaine)
    })

    metiers.sort()

    return { metiers }
  } catch (error) {
    const newError = Boom.internal("getting all metiers")
    newError.cause = error
    throw newError
  }
}
