import { ACCESS_PARAMS, IAccessParams } from "@/common/apis/franceTravail/franceTravail"

import { getFranceTravailTokenFromAPI } from "../../common/apis/franceTravail/franceTravail.client"

export const generateFranceTravailAccess = async () => {
  await Promise.all(Object.keys(ACCESS_PARAMS).map(async (access) => await getFranceTravailTokenFromAPI(access as IAccessParams)))
}
