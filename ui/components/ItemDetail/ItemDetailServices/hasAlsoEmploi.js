import { isNonEmptyString } from "../../../utils/strutils"

export default function hasAlsoEmploi({ isCfa = false, company = {}, searchedMatchaJobs = [] }) {
  let hasEtablissementFormateurSiret = false
  let hasEtablissementGestionnaireSiret = false
  let matchaSirets = searchedMatchaJobs ? searchedMatchaJobs.map((matcha) => matcha?.company?.siret) : []
  let nonEmptyMatchaSirets = matchaSirets.filter(isNonEmptyString)

  if (nonEmptyMatchaSirets.length > 0 && isNonEmptyString(company?.siret)) {
    hasEtablissementFormateurSiret = nonEmptyMatchaSirets.includes(company?.siret)
  }
  if (nonEmptyMatchaSirets.length > 0 && isNonEmptyString(company?.headquarter?.siret)) {
    hasEtablissementGestionnaireSiret = nonEmptyMatchaSirets.includes(company?.headquarter?.siret)
  }

  return isCfa || hasEtablissementFormateurSiret || hasEtablissementGestionnaireSiret
}
