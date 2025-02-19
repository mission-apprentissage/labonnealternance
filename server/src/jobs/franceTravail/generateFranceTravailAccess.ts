import { IFranceTravailAccessType, ZFranceTravailAccessType } from "shared/models/franceTravailAccess.model"

import { getFranceTravailTokenFromAPI } from "@/common/apis/franceTravail/franceTravail.client"

export const generateFranceTravailAccess = async () => {
  await Promise.all(Object.values(ZFranceTravailAccessType.Values).map(async (access: IFranceTravailAccessType) => await getFranceTravailTokenFromAPI(access)))
}
