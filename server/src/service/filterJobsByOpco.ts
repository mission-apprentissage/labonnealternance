// @ts-nocheck
import { OPCOS } from "../common/constants.js"
import { Opco } from "../common/model/index.js"
import { getMemoizedOpcoShortName } from "../jobs/lbb/bonnesBoitesUtils.js"
import { CFADOCK_FILTER_LIMIT, fetchOpcosFromCFADock } from "./cfaDock/fetchOpcosFromCFADock.js"
import { saveOpco } from "./opco.js"

/**
 * Filtre une liste de jobs pour ne laisser que ceux qui ont la valeur opcoUrl ou opco
 */
export default async function ({ jobs, opco, opcoUrl }) {
  let sirensToFind = []

  jobs.forEach((job) => {
    if (job?.company?.siret) {
      sirensToFind.push(job.company.siret.substring(0, 9))
    }
  })

  // les sociétés sans siren ne sont pas retournées
  if (sirensToFind.length === 0) {
    return []
  }

  // STEP 1 identifier les sociétés présentent dans notre base
  const searchForOpcoParams = { siren: { $in: sirensToFind } }
  if (opcoUrl) {
    searchForOpcoParams.url = opcoUrl.toLowerCase()
  } else {
    searchForOpcoParams.opco = OPCOS[opco.toUpperCase()]
  }

  const foundInMongoOpcos = await Opco.find(searchForOpcoParams)

  let opcoFilteredSirens = []

  const foundInMongoOpcoSirens = foundInMongoOpcos.map((opco) => opco.siren)

  opcoFilteredSirens = opcoFilteredSirens.concat(foundInMongoOpcoSirens)

  // STEP 2 identifier des sociétés provenant de CFA DOCK
  if (sirensToFind.length !== foundInMongoOpcoSirens.length) {
    const toRemove = new Set(foundInMongoOpcoSirens)
    sirensToFind = sirensToFind.filter((x) => !toRemove.has(x))

    for (let i = 0; i < sirensToFind.length; i += CFADOCK_FILTER_LIMIT) {
      const sirenChunk = sirensToFind.slice(i, i + CFADOCK_FILTER_LIMIT)
      try {
        const sirenOpcos = (await fetchOpcosFromCFADock(new Set(sirenChunk))).data.found

        sirenOpcos.forEach(async (sirenOpco) => {
          if (opcoUrl && sirenOpco.url === opcoUrl) {
            opcoFilteredSirens.push(sirenOpco.filters.siret)
          } else if (opco && opco.toUpperCase() === getMemoizedOpcoShortName(sirenOpco.opcoName)) {
            opcoFilteredSirens.push(sirenOpco.filters.siret)
          }

          // enregistrement des retours opcos dans notre base pour réduire les recours à CFADOCK
          await saveOpco({
            siren: sirenOpco.filters.siret,
            opco: sirenOpco.opcoName,
            url: sirenOpco.url,
            idcc: sirenOpco.idcc,
          })
        })
      } catch (err) {
        // ne rien faire. 429 probable de l'api CFADOCK dont le rate limiter est trop limitant
        // les éventuelles sociétés qui auraient pu matcher sont ignorées
      }
    }
  }

  // les sociétés n'appartenant pas à l'opco en paramètres ne sont pas retournées
  if (opcoFilteredSirens.length === 0) {
    return []
  }

  const results = jobs.filter((job) => {
    if (job?.company?.siret && opcoFilteredSirens.indexOf(job.company.siret.substring(0, 9)) >= 0) {
      return true
    } else {
      return false
    }
  })

  return results
}
