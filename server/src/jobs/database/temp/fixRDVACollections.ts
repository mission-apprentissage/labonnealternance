import dayjs from "shared/helpers/dayjs"

import { EmailBlacklist, Etablissement } from "../../../common/model"

// SIRET number that does not comply with LUHN algorythm in etablissements collection
const SIRET_TO_REMOVE_FROM_ETABLISSEMENT = [
  "13002799900132",
  "99999999999920",
  "78144401300000",
  "33778063900000",
  "78151651300000",
  "19331424200000",
  "19330028200000",
  "19470020900017",
  "52407208900175",
]

const DATE = dayjs().toDate()

const removeObsoleteEtablissement = async () => await Etablissement.deleteMany({ formateur_siret: { $in: SIRET_TO_REMOVE_FROM_ETABLISSEMENT } })
const addMissingDateFieldToEmailBlacklist = async () => await EmailBlacklist.updateMany({ created_at: { $exists: false } }, { $set: { created_at: DATE } })

export const fixRDVACollections = async () => {
  await removeObsoleteEtablissement()
  await addMissingDateFieldToEmailBlacklist()
}
