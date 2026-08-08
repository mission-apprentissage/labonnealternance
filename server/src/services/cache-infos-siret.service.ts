import { ObjectId } from "mongodb"
import { BusinessErrorCodes } from "shared/constants/error-codes"
import type { IEtablissementGouvData } from "shared/models/cache-infos-siret.model"
import { ZEtablissementGouvData } from "shared/models/cache-infos-siret.model"

import { getEtablissementFromGouvSafe } from "@/common/apis/apiEntreprise/api-entreprise.client"
import { getDbCollection } from "@/common/utils/mongodb-utils"

export const getSiretInfos = async (siret: string | null | undefined): Promise<BusinessErrorCodes.NON_DIFFUSIBLE | null | IEtablissementGouvData> => {
  if (!siret) {
    throw new Error("siret vide")
  }
  const cacheEntry = await getDbCollection("cache_siret").findOne({ siret })
  if (cacheEntry) {
    const { error, data } = cacheEntry
    return error ?? data ?? null
  }
  const response = await getEtablissementFromGouvSafe(siret)
  if (!response) {
    return null
  }
  const now = new Date()
  if (response === BusinessErrorCodes.NON_DIFFUSIBLE) {
    await getDbCollection("cache_siret").updateOne(
      { siret },
      {
        $set: {
          error: response,
          updatedAt: now,
        },
        $setOnInsert: {
          _id: new ObjectId(),
          createdAt: now,
          siret,
        },
      },
      {
        upsert: true,
      }
    )
    return response
  }
  const parsedData = ZEtablissementGouvData.parse(response)
  await getDbCollection("cache_siret").insertOne({
    _id: new ObjectId(),
    siret,
    data: parsedData,
    createdAt: now,
    updatedAt: now,
  })
  return parsedData
}
