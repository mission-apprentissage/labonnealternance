import { ObjectId } from "mongodb"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import type { IOpco } from "shared/models/opco.model"
import { parseEnum } from "shared/utils/index"

import { getDbCollection } from "@/common/utils/mongodb-utils"

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
