import { ReferentielRome } from "../common/model"

export const getRomeDetailsFromDB = async (romeCode: string) => ReferentielRome.findOne({ rome_code: romeCode }).select({ fiche_metier: 1 }).lean()
export const getFicheMetierFromDB = async ({ query }) => ReferentielRome.findOne(query).lean()
