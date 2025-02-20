import { ACCESS_PARAMS, IAccessParams, getFranceTravailTokenFromAPI } from "@/common/apis/franceTravail/franceTravail.client"

export const generateFranceTravailAccess = async () => {
  await Promise.allSettled(Object.keys(ACCESS_PARAMS).map(async (access) => await getFranceTravailTokenFromAPI(access as IAccessParams)))
}
