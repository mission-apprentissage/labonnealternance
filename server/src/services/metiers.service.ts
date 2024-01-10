import Boom from "boom"
import * as _ from "lodash-es"
import { matchSorter } from "match-sorter"
import { removeAccents } from "shared/utils"

import { DomainesMetiers } from "@/common/model"
import { IDiplomesMetiers } from "@/common/model/schema/diplomesmetiers/diplomesmetiers.types"
import { IDomainesMetiers } from "@/common/model/schema/domainesmetiers/domainesmetiers.types"
import { db } from "@/common/mongodb"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"

import { getRomesFromCatalogue } from "./catalogue.service"
import { IAppellationsRomes, IMetierEnrichi, IMetiers, IMetiersEnrichis } from "./metiers.service.types"

let cacheMetiers: IDomainesMetiers[] = []
let cacheDiplomas: IDiplomesMetiers[] = []

const initializeCacheMetiers = async () => {
  console.log("initializeCacheMetiers on first use")
  cacheMetiers = await db.collection("domainesmetiers").find({}).toArray()
  const roughObjSize = JSON.stringify(cacheMetiers).length
  if (config.env === "production") {
    notifyToSlack({
      subject: `Cache domaines metiers chargé`,
      message: `Cache domaines metiers chargé. Taille estimée ${roughObjSize} octets`,
      error: false,
    })
  }
  console.log("cacheMetiers : ", roughObjSize)
}

const initializeCacheDiplomas = async () => {
  console.log("initializeCacheDiplomas on first use")
  cacheDiplomas = await db.collection("diplomesmetiers").find({}).toArray()
  const roughObjSize = JSON.stringify(cacheDiplomas).length
  if (config.env === "production") {
    notifyToSlack({
      subject: `Cache diplômes metiers chargé`,
      message: `Cache diplômes metiers chargé. Taille estimée ${roughObjSize} octets`,
      error: false,
    })
  }
  console.log("cacheDiplomas : ", roughObjSize)
}

/**
 * Retourne un ensemble de métiers et/ou diplômes et leurs codes romes et rncps associés en fonction de terme de recherches
 */
export const getRomesAndLabelsFromTitleQuery = async ({ title, withRomeLabels }: { title: string; withRomeLabels?: boolean }): Promise<IMetiersEnrichis> => {
  // nominal case
  const [romesMetiers, romesDiplomes] = await Promise.all([getMetiers({ title, withRomeLabels }), getLabelsAndRomesForDiplomas(title)])
  return { ...romesMetiers, ...romesDiplomes }
}

const computeScore = (document, searchableFields, regexes) => {
  searchableFields.map(({ field, score }) =>
    regexes.map((regex) => {
      const valueToTest = document[field] instanceof Array ? document[field].join(" ") : document[field]
      if (valueToTest.match(regex)) {
        document.score = score + (document.score ?? 0)
      }
    })
  )
}

const searchableWeightedFields = [
  { field: "sous_domaine_sans_accent_computed", score: 80 },
  { field: "domaine_sans_accent_computed", score: 3 },
  { field: "intitules_romes_sans_accent_computed", score: 7 },
  { field: "intitules_rncps_sans_accent_computed", score: 7 },
  { field: "mots_clefs_sans_accent_computed", score: 3 },
  { field: "mots_clefs_specifiques_sans_accent_computed", score: 40 },
  { field: "appellations_romes_sans_accent_computed", score: 15 },
  { field: "intitules_fap_sans_accent_computed", score: 1 },
  { field: "sous_domaine_onisep_sans_accent_computed", score: 1 },
]

const filterMetiers = async (regexes: RegExp[], romes?: string, rncps?: string): Promise<(IDomainesMetiers & { score?: number })[]> => {
  if (cacheMetiers.length === 0) {
    await initializeCacheMetiers()
  }

  const results: (IDomainesMetiers & { score?: number })[] = []

  cacheMetiers.forEach((metier) => {
    if (romes) {
      const romeList: string[] = romes.split(", ")
      if (!romeList.some((rome) => metier.codes_romes.includes(rome))) {
        return
      }
    }

    if (rncps) {
      const rncpList: string[] = rncps.split(", ")
      if (!rncpList.some((rncp) => metier.codes_rncps.includes(rncp))) {
        return
      }
    }

    if (!regexes.length && (romes || rncps)) {
      results.push(metier)
      return
    }

    const matchingMetier: IDomainesMetiers & { score?: number } = { ...metier }

    computeScore(matchingMetier, searchableWeightedFields, regexes)

    if (matchingMetier.score) {
      results.push(matchingMetier)
    }
  })

  return results
}

const searchableWeightedDiplomaFields = [
  { field: "intitule_long", score: 1 },
  { field: "acronymes_intitule", score: 2 },
]

const filterDiplomas = async (regexes: RegExp[]): Promise<(IDiplomesMetiers & { score?: number })[]> => {
  if (cacheDiplomas.length === 0) {
    await initializeCacheDiplomas()
  }

  const results: (IDiplomesMetiers & { score?: number })[] = []

  cacheDiplomas.forEach((diploma) => {
    const matchingDiploma: IDiplomesMetiers & { score?: number } = { ...diploma }

    computeScore(matchingDiploma, searchableWeightedDiplomaFields, regexes)

    if (matchingDiploma.score) {
      results.push(matchingDiploma)
    }
  })

  return results
}

/**
 * construit les regex à partir du terme de recherche
 */
const buildRegexes = (searchTerm: string) => {
  const regexes: RegExp[] = []
  searchTerm.split(" ").forEach((term, idx) => {
    if (idx === 0 || term.length > 2) {
      regexes.push(new RegExp(`\\b${removeAccents(term)}`, "i"))
    }
  })

  return regexes
}

/**
 * retourne une liste de métiers avec leurs codes romes et codes RNCPs associés. le retour respecte strictement les critères
 */
export const getMetiers = async ({
  title,
  romes,
  rncps,
  withRomeLabels,
}: {
  title: string
  romes?: string
  rncps?: string
  withRomeLabels?: boolean
}): Promise<{ labelsAndRomes: Omit<IMetierEnrichi, "romeTitles">[] }> => {
  if (!title && !romes && !rncps) {
    throw Boom.badRequest("Parameters must include at least one from 'title', 'romes' and 'rncps'")
  } else {
    let regexes: RegExp[] = []

    if (title) {
      regexes = buildRegexes(title)
    }

    let metiers: (IDomainesMetiers & { score?: number })[] = await filterMetiers(regexes, romes, rncps)
    metiers = metiers.sort((a: IDomainesMetiers & { score?: number }, b: IDomainesMetiers & { score?: number }) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 20)

    const labelsAndRomes: IMetierEnrichi[] = []

    metiers.forEach((metier) => {
      const labelAndRome: IMetierEnrichi = {
        label: metier.sous_domaine,
        romes: metier.codes_romes,
        rncps: metier.codes_rncps,
        type: "job",
      }

      if (withRomeLabels) {
        labelAndRome.romeTitles = metier.couples_romes_metiers
      }

      labelsAndRomes.push(labelAndRome)
    })

    return { labelsAndRomes }
  }
}

/**
 * retourne une liste de diplômes avec leurs codes romes et codes RNCPs associés. Le retour s'approche au mieux des critères.
 * @param {string} searchTerm : un préfixe, un mot ou un ensemble de préfixes ou mots sur lesquels fonder une recherche de métiers
 */
const getLabelsAndRomesForDiplomas = async (searchTerm: string): Promise<{ labelsAndRomesForDiplomas: IMetierEnrichi[] }> => {
  const regexes: RegExp[] = buildRegexes(searchTerm)

  let diplomas: (IDiplomesMetiers & { score?: number })[] = await filterDiplomas(regexes)
  diplomas = diplomas.sort((a: IDiplomesMetiers & { score?: number }, b: IDiplomesMetiers & { score?: number }) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 20)

  let labelsAndRomesForDiplomas: IMetierEnrichi[] = []

  diplomas.forEach((labelAndRomeForDiploma) => {
    labelsAndRomesForDiplomas.push({
      label: labelAndRomeForDiploma.intitule_long,
      romes: labelAndRomeForDiploma.codes_romes,
      rncps: labelAndRomeForDiploma.codes_rncps,
      type: "diploma",
    })
  })

  labelsAndRomesForDiplomas = removeDuplicateDiplomas(labelsAndRomesForDiplomas)

  return { labelsAndRomesForDiplomas }
}

/**
 * Retourne les appellations, intitulés et codes romes correspondant au terme de recherche
 * @param {string} searchTerm un mot ou un préfixe sur lequel doit se baser la recherche
 * @returns {Promise<IAppellationsRomes>}
 */
export const getCoupleAppellationRomeIntitule = async (searchTerm: string): Promise<IAppellationsRomes> => {
  const regexes: RegExp[] = buildRegexes(searchTerm)

  const metiers: (IDomainesMetiers & { score?: number })[] = await filterMetiers(regexes)

  const coupleAppellationRomeMetier = metiers.map(({ couples_appellations_rome_metier }) => couples_appellations_rome_metier)
  const intitulesAndRomesUnique = _.uniqBy(_.flatten(coupleAppellationRomeMetier), "appellation")
  const sorted = matchSorter(intitulesAndRomesUnique, searchTerm, {
    keys: ["appellation"],
    threshold: matchSorter.rankings.NO_MATCH,
  })
  return { coupleAppellationRomeMetier: sorted }
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
  const { romes } = await getRomesFromCatalogue({ cfd })
  const metiers = await getMetiersFromRomes(romes)
  return metiers
}

/**
 * Récupère la liste des métiers dans la table domaines / métiers correspondant à un tableau de codes ROME
 * @param {string[]} romes
 * @returns {IMetiers}
 */
const getMetiersFromRomes = async (romes: string[]): Promise<IMetiers> => {
  const metiersFromDb = await DomainesMetiers.find({ codes_romes: { $in: romes } })

  const metiers: string[] = metiersFromDb.map((metier) => {
    return metier.sous_domaine
  })
  return { metiers }
}

/**
 * Récupère la liste de tous les métiers dans la table domaines / métiers
 * @returns {IMetiers}
 */
export const getTousLesMetiers = async (): Promise<IMetiers> => {
  const metiers: string[] = (await DomainesMetiers.find({}, { sous_domaine: 1, _id: 0 }).lean()).map((metier: { sous_domaine: string }) => metier.sous_domaine).sort()
  return { metiers }
}
