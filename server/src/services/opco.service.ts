import memoize from "memoizee"
import { ObjectId } from "mongodb"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import type { IOpco } from "shared/models/opco.model"
import { parseEnum } from "shared/utils/index"

import { getDbCollection } from "@/common/utils/mongodbUtils"

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

const getOpcosBySirenFromDB = async (sirens: string[]): Promise<{ opco: OPCOS_LABEL; idcc: number | null; siren: string }[]> => {
  const results = await getDbCollection("opcos")
    .find({ siren: { $in: sirens } })
    .toArray()
  return results.flatMap(({ opco, idcc, siren }) => {
    const parsedOpco = parseEnum(OPCOS_LABEL, opco)
    if (!parsedOpco) {
      return []
    }
    return [{ siren, opco: parsedOpco, idcc: idcc ?? null }]
  })
}

export const getOpcosBySiretFromDB = async (sirets: string[]): Promise<{ opco: OPCOS_LABEL; idcc: number | null; siret: string }[]> => {
  if (!sirets.length) {
    return []
  }
  const sirens = [...new Set<string>(sirets.map((siret) => siret.substring(0, 9)))]
  const results = await getOpcosBySirenFromDB(sirens)
  return sirets.flatMap((siret) => {
    const siren = siret.substring(0, 9)
    const sirenResult = results.find((result) => result.siren === siren)
    if (!sirenResult) {
      return []
    }
    const { opco, idcc } = sirenResult
    return [{ siret, opco, idcc }]
  })
}

/**
 * @description ajoute un opco en base s'il n'existe pas déjà sinon le mets à jour
 * @param {IOpco} opcoData
 * @returns {Promise<IOpco>}
 */
export const saveOpco = async (opcoData: Omit<IOpco, "_id">) => getDbCollection("opcos").findOneAndUpdate({ siren: opcoData.siren }, { $set: opcoData }, { upsert: true })

export const insertOpcos = async (opcoDatas: Omit<IOpco, "_id">[]) => {
  if (!opcoDatas.length) {
    return
  }
  await getDbCollection("opcos").bulkWrite(
    opcoDatas.map((data) => ({
      updateOne: {
        filter: { siren: data.siren },
        update: { $set: { ...data }, $setOnInsert: { _id: new ObjectId() } },
        upsert: true,
      },
    })),
    {
      ordered: false,
    }
  )
}

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
  const sirensToFind: any[] = []

  jobs.forEach((job) => {
    if (job?.company?.siret) {
      sirensToFind.push(job.company.siret.substring(0, 9))
    }
  })

  // les sociétés sans siren ne sont pas retournées
  if (sirensToFind.length === 0) {
    return []
  }

  // identifier les sociétés présentent dans notre base
  const searchForOpcoParams: any = { siren: { $in: sirensToFind } }

  if (opcoUrl) {
    searchForOpcoParams.url = opcoUrl.toLowerCase()
  }

  if (opco) {
    searchForOpcoParams.opco = OPCOS_LABEL[opco.toUpperCase()]
  }

  const foundInMongoOpcos = await getDbCollection("opcos").find(searchForOpcoParams).toArray()

  const opcoFilteredSirens: any[] = foundInMongoOpcos.map((opco) => opco.siren)

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
