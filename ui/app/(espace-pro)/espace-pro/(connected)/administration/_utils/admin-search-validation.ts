import type { ILbaCompanySearchField } from "shared/routes/update-lba-company.routes"
import { validateSIRET } from "shared/validators/siret-validator"

import { lookLikeObjectId } from "@/utils/api"

export const MIN_SEARCH_LENGTH = 2

export const OFFER_ID_EXAMPLE = "65314e465afcffb8f31b1853"

export const validateMinLength = (search: string) => (search.length < MIN_SEARCH_LENGTH ? `Saisissez au moins ${MIN_SEARCH_LENGTH} caractères` : null)

export const validateOfferId = (search: string) =>
  lookLikeObjectId(search) ? null : `Saisissez un identifiant de 24 caractères hexadécimaux (chiffres 0 à 9, lettres a à f), par exemple ${OFFER_ID_EXAMPLE}`

export const validateLbaCompanySearch = (search: string, field: ILbaCompanySearchField) => {
  const minLengthError = validateMinLength(search)
  if (minLengthError) return minLengthError
  if (field === "workplace_siret" && !validateSIRET(search)) return "Saisissez un SIRET valide de 14 chiffres, sans espace, par exemple 12345678901234"
  return null
}
