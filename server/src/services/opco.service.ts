import memoize from "memoizee"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { IReferentielOpco, ZReferentielOpcoInsert } from "shared/models"
import { IOpco } from "shared/models/opco.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { CFADOCK_FILTER_LIMIT, ICfaDockOpcoItem, fetchOpcosFromCFADock } from "./cfadock.service"

/**
 * @description get opco from database collection OPCOS
 */
export const getOpcoBySirenFromDB = async (siren: string) => {
  const opcoFromDB = await getDbCollection("opcos").findOne({ siren })
  if (opcoFromDB) {
    const { opco, idcc } = opcoFromDB
    return { opco, idcc }
  }
}

/**
 * @description ajoute un opco en base s'il n'existe pas déjà sinon le mets à jour
 * @param {IOpco} opcoData
 * @returns {Promise<IOpco>}
 */
export const saveOpco = async (opcoData: Omit<IOpco, "_id">) => getDbCollection("opcos").findOneAndUpdate({ siren: opcoData.siren }, { $set: opcoData }, { upsert: true })

/**
 * @description retourne le nom court d'un opco en paramètre
 * @param {string} shortName
 * @returns {string}
 */
export const getOpcoLongName = memoize((shortName: string) => Object.values(OPCOS_LABEL).find((k) => OPCOS_LABEL[k] === shortName.toUpperCase()))

/**
 * @description retourne le nom court d'un opco en paramètre
 * @param {string} longName
 * @returns {string}
 */
const getOpcoShortName = (longName: string) => Object.keys(OPCOS_LABEL).find((k) => OPCOS_LABEL[k] === longName)

export const getMemoizedOpcoShortName = memoize(getOpcoShortName)

/**
 * @description Filtre une liste de jobs pour ne laisser que ceux qui ont la valeur opcoUrl ou opco
 * @param {any[]} jobs
 * @param {string} opco
 * @param {string} opcoUrl
 * @returns {Promise<any[]>}
 */
export const filterJobsByOpco = async ({ jobs, opco, opcoUrl }: { jobs: any[]; opco?: string; opcoUrl?: string }): Promise<any[]> => {
  let sirensToFind: any[] = []

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
  const searchForOpcoParams: any = { siren: { $in: sirensToFind } }

  if (opcoUrl) {
    searchForOpcoParams.url = opcoUrl.toLowerCase()
  }

  if (opco) {
    searchForOpcoParams.opco = OPCOS_LABEL[opco.toUpperCase()]
  }

  const foundInMongoOpcos = await getDbCollection("opcos").find(searchForOpcoParams).toArray()

  let opcoFilteredSirens: any[] = []

  const foundInMongoOpcoSirens = foundInMongoOpcos.map((opco) => opco.siren)

  opcoFilteredSirens = opcoFilteredSirens.concat(foundInMongoOpcoSirens)

  // STEP 2 identifier des sociétés provenant de CFA DOCK
  if (sirensToFind.length !== foundInMongoOpcoSirens.length) {
    const toRemove = new Set(foundInMongoOpcoSirens)
    sirensToFind = sirensToFind.filter((x) => !toRemove.has(x))

    for (let i = 0; i < sirensToFind.length; i += CFADOCK_FILTER_LIMIT) {
      const sirenChunk = sirensToFind.slice(i, i + CFADOCK_FILTER_LIMIT)
      try {
        const sirenOpcos = await fetchOpcosFromCFADock(new Set(sirenChunk))

        sirenOpcos.forEach(async (sirenOpco) => {
          if (opcoUrl && sirenOpco.url === opcoUrl) {
            opcoFilteredSirens.push(sirenOpco.filters.siret)
          } else if (opco && opco.toUpperCase() === getMemoizedOpcoShortName(sirenOpco.opcoName ?? "")) {
            opcoFilteredSirens.push(sirenOpco.filters.siret)
          }

          // enregistrement des retours opcos dans notre base pour réduire les recours à CFADOCK
          await saveOpco(cfaDockOpcoItemToIOpco(sirenOpco))
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

export const prepareReferentielOpcoForInsert = (referentiel: Omit<IReferentielOpco, "_id">) => {
  if (ZReferentielOpcoInsert.safeParse(referentiel).success && referentiel.emails.length) {
    const deduplicatedEmails = [...new Set(referentiel.emails)]
    referentiel.emails = deduplicatedEmails
    return referentiel
  } else {
    return false
  }
}

export const cfaDockOpcoItemToIOpco = (opcoItem: ICfaDockOpcoItem) => {
  const result: Omit<IOpco, "_id"> = {
    siren: opcoItem.filters.siret,
    opco: opcoItem.opcoName,
    opco_short_name: getMemoizedOpcoShortName(opcoItem.opcoName ?? ""),
    url: opcoItem.url,
    idcc: opcoItem.idcc,
  }
  return result
}
