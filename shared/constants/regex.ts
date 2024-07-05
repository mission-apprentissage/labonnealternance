export const REPETITION_VOIE_MAPPING = {
  Bis: "B",
  Ter: "T",
  Quater: "Q",
  ["Quinquiès"]: "C",
}

export const CFD_REGEX_PATTERN = "^[A-Z0-9]{8}$"
export const CODE_INSEE_PATTERN = "^[0-9]{1}[0-9A-Z]{1}[0-9]{3}$"
export const CODE_POSTAL_PATTERN = "^[0-9]{5}$"
export const RNCP_REGEX_PATTERN = "^(RNCP)?[0-9]{2,5}$"
export const SIRET_REGEX_PATTERN = "^[0-9]{14}$"
export const CODE_NAF_REGEX_PATTERN = "^[0-9]{4}[A-Z]$"
export const UAI_REGEX_PATTERN = "^[0-9]{7}[a-zA-Z]$"
export const CODE_ROME_PATTERN = "^[A-Z]d{4}$"
export const LATITUDE_PATTERN = "^[-+]?([1-8]?d(.d+)?|90(.0+)?)$"
export const LONGITUDE_PATTERN = "^[-+]?((1[0-7]d(.d+)?|180(.0+)?|d{1,2}(.d+)?))$"

// Numero INE (Identifiant National Elève)
// Le numero INE composé de 11 caractères,
// soit 10 chiffres et 1 lettre soit 9 chiffres et 2 lettres (depuis la rentrée 2018).
// INE BEA (Base élèves académique) 123456789FF
const INE_RNIE_REGEX_PATTERN = "^[0-9]{9}[a-zA-Z]{2}$"
// INE BEA (Base élèves académique) ex: 1234567890F
const INE_BEA_REGEX_PATTERN = "^[0-9_]{10}[a-zA-Z]{1}$"
// INE APPRENTISSAGE 1234A12345F
const INE_APPRENTISSAGE_REGEX_PATTERN = "^[0-9]{4}A[0-9]{5}[a-zA-Z]{1}$"
export const INE_REGEX_PATTERN = `^(${INE_RNIE_REGEX_PATTERN}|${INE_BEA_REGEX_PATTERN}|${INE_APPRENTISSAGE_REGEX_PATTERN})$`

export const CFD_REGEX = new RegExp(CFD_REGEX_PATTERN)
export const CODE_POSTAL_REGEX = new RegExp(CODE_POSTAL_PATTERN)
export const INE_REGEX = new RegExp(INE_REGEX_PATTERN)
export const RNCP_REGEX = new RegExp(RNCP_REGEX_PATTERN)
export const SIRET_REGEX = new RegExp(SIRET_REGEX_PATTERN)
export const CODE_NAF_REGEX = new RegExp(CODE_NAF_REGEX_PATTERN)
export const UAI_REGEX = new RegExp(UAI_REGEX_PATTERN)
export const CODE_ROME_REGEX = new RegExp(CODE_ROME_PATTERN)
export const LATITUDE_REGEX = new RegExp(LATITUDE_PATTERN)
export const LONGITUDE_REGEX = new RegExp(LONGITUDE_PATTERN)
export const CODE_INSEE_REGEX = new RegExp(CODE_INSEE_PATTERN)

export const isValidCFD = (cfd: string) => typeof cfd === "string" && CFD_REGEX.test(cfd)
export const isValidINE = (ine: string) => typeof ine === "string" && INE_REGEX.test(ine)
