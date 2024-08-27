import { ACCESS_PARAMS, IAccessParams, getFranceTravailTokenFromAPI } from "../../common/apis/FranceTravail"

export const generateFranceTravailAccess = async () => {
  await Promise.all(Object.keys(ACCESS_PARAMS).map(async (access) => await getFranceTravailTokenFromAPI(access as IAccessParams)))
}
