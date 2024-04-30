import { ReferentielRome } from "../common/model"

export const getRomeDetailsFromDB = async (romeCode: string) => ReferentielRome.findOne({ "rome.code_rome": romeCode }).lean()
export const getFicheMetierFromDB = async ({ query }) => ReferentielRome.findOne(query).lean()
