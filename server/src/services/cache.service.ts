import { IRomeoApiResponse } from "shared/models/cacheRomeo.model"

import { getDbCollection } from "../common/utils/mongodbUtils"

export const updateRomeoCache = async (payload: IRomeoApiResponse) => await getDbCollection("cache_romeo").insertMany(payload)
export const getRomeoFromCache = async (intitule: string) =>
  await getDbCollection("cache_romeo")
    .find({ $text: { $search: intitule } })
    .toArray()
