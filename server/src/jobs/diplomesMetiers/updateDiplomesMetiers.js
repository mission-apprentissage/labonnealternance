import _ from "lodash-es"
import Sentry from "@sentry/node"
import { logMessage } from "../../common/utils/logMessage.js"
import { DiplomesMetiers } from "../../common/model/index.js"
import { getElasticInstance, getFormationsES } from "../../common/esClient/index.js"

const esClient = getFormationsES()

const motsIgnores = ["a", "au", "aux", "l", "le", "la", "les", "d", "de", "du", "des", "et", "en"]

const emptyMongo = async () => {
  logMessage("info", `Clearing diplomesmetiers db...`)
  await DiplomesMetiers.deleteMany({})
}

const clearIndex = async () => {
  try {
    let client = getElasticInstance()
    logMessage("info", `Removing diplomesmetiers index...`)
    await client.indices.delete({ index: "diplomesmetiers" })
  } catch (err) {
    logMessage("error", `Error emptying es index : ${err.message}`)
  }
}

const createIndex = async () => {
  let requireAsciiFolding = true
  logMessage("info", `Creating diplomesmetiers index...`)
  await DiplomesMetiers.createMapping(requireAsciiFolding)
}

const buildAcronyms = (intitule) => {
  let acronymeLong = ""
  let acronymeCourt = ""

  let intitule_sans_parenthese = intitule

  if (intitule.indexOf(" (") >= 0) {
    intitule_sans_parenthese = intitule.substring(0, intitule.indexOf(" ("))
  }

  const tokens = intitule_sans_parenthese.toLowerCase().split(/[\s-';:,)]+/)
  tokens.map((token) => {
    if (token) {
      acronymeLong += token[0]

      if (motsIgnores.indexOf(token) < 0) {
        acronymeCourt += token[0]
      }
    }
  })

  return acronymeCourt + " " + acronymeLong
}

let diplomesMetiers = []
let rank = 0
let shouldStop = false
const size = 1500
let lastIdToSearchAfter = null

export default async function () {
  let step = 0

  try {
    logMessage("info", " -- Start of DiplomesMetiers initializer -- ")

    await emptyMongo()
    await clearIndex()

    await createIndex()

    let avertissements = []

    logMessage("info", `Début traitement`)

    while (!shouldStop && rank < 30) {
      await getIntitulesFormations({ size })
      rank++
    }

    step = 1

    for (const k in diplomesMetiers) {
      diplomesMetiers[k].acronymes_intitule = buildAcronyms(diplomesMetiers[k].intitule_long)

      if (diplomesMetiers[k]?.codes_romes.length) {
        let diplomesMetier = new DiplomesMetiers(diplomesMetiers[k])
        await diplomesMetier.save()
      }
    }

    logMessage("info", `Fin traitement`)

    return {
      result: "Table diplomesMetiers mise à jour",
      avertissements,
    }
  } catch (err) {
    console.log("error step ", step)
    logMessage("error", err)
    let error_msg = _.get(err, "meta.body") ?? err.message
    return { error: error_msg }
  }
}

const getIntitulesFormations = async ({ size = 0 }) => {
  try {
    const body = {
      query: {
        bool: {
          must: {
            match_all: {},
          },
        },
      },
      sort: [{ _id: "asc" }],
    }

    //console.log("lastId : ", lastIdToSearchAfter);
    if (lastIdToSearchAfter) {
      body.search_after = [lastIdToSearchAfter]
    }

    const responseIntitulesFormations = await esClient.search({
      ...getFormationCodesEsQueryIndexFragment({ size }),
      body,
    })

    let intitules = []
    //console.log(responseIntitulesFormations.data.hits);

    responseIntitulesFormations.body.hits.hits.forEach((formation) => {
      //console.log(formation._source.intitule_long);

      if (!diplomesMetiers[formation._source.intitule_long]) {
        //console.log("inited : ", intitule._source.intitule_long);
        diplomesMetiers[formation._source.intitule_long] = {
          intitule_long: formation._source.intitule_long,
          codes_romes: formation._source.rome_codes,
          codes_rncps: [formation._source.rncp_code],
        }
      } else {
        //console.log("updating : ", intitule._source.intitule_long);
        diplomesMetiers[formation._source.intitule_long] = updateDiplomeMetier({
          initial: diplomesMetiers[formation._source.intitule_long],
          toAdd: formation._source,
        })
      }

      lastIdToSearchAfter = formation._id
    })

    if (responseIntitulesFormations.body.hits.hits.length < size) {
      shouldStop = true
    }

    //console.log("et la l'int : ",intitules);

    return intitules
  } catch (err) {
    Sentry.captureException(err)

    let error_msg = _.get(err, "meta.body") ? err.meta.body : err.message
    console.log("Error getting diplomesMetiers", error_msg)
    console.log(err)
    if (_.get(err, "meta.meta.connection.status") === "dead") {
      console.log("Elastic search is down or unreachable")
    }
    return { error: error_msg }
  }
}

const updateDiplomeMetier = ({ initial, toAdd }) => {
  //console.log("updateDiplomeMetier : ",initial,toAdd);

  if (toAdd.codes_romes) {
    toAdd.codes_romes.forEach((rome_code) => {
      if (initial.codes_romes.indexOf(rome_code) < 0) {
        initial.codes_romes.push(rome_code)
        //console.log("added rome ", rome_code, " to ", initial.intitule_long);
      }
    })
  }

  if (initial.codes_rncps.indexOf(toAdd.rncp_code) < 0) {
    initial.codes_rncps.push(toAdd.rncp_code)
    //console.log("added rncp ", toAdd.rncp_code, " to ", initial.intitule_long);
  }

  return initial
}

const getFormationCodesEsQueryIndexFragment = ({ size = 10000 }) => {
  return {
    //index: "mnaformation",
    index: "convertedformations",
    size,
    _sourceIncludes: ["_id", "intitule_long", "rome_codes", "rncp_code"],
  }
}
