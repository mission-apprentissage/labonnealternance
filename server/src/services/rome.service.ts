import { ReferentielRome } from "../common/model"

export const getRomeDetailsFromDB = async (romeCode: string) => ReferentielRome.findOne({ "rome.code_rome": romeCode }).select({ _id: 0 }).lean()
export const getFicheMetierFromDB = async ({ query }) => ReferentielRome.findOne(query).lean()
