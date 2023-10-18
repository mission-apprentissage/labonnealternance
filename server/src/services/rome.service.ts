import { FicheMetierRomeV3 } from "../common/model"

export const getRomeDetailsFromDB = async (romeCode: string) => FicheMetierRomeV3.findOne({ code: romeCode }).select({ fiche_metier: 1 }).lean()
export const getFicheMetierRomeV3FromDB = async ({ query }) => FicheMetierRomeV3.findOne(query).lean()
