import { ObjectId } from "mongodb"
import { IPointFeature } from "shared/models/index"

import { getDbCollection } from "../common/utils/mongodbUtils"

export const getGeolocationFromCache = async (address: string) => {
  return await getDbCollection("cache_geolocation").findOne({ address })
}

export const saveGeolocationInCache = async (address: string, features: IPointFeature[]) =>
  getDbCollection("cache_geolocation").updateOne(
    { address },
    {
      $set: {
        features,
        address,
      },
      $setOnInsert: {
        _id: new ObjectId(),
      },
    },
    { upsert: true }
  )
