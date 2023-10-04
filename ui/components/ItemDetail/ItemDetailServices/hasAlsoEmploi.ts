import { isNonEmptyString } from "../../../utils/strutils"

export default function hasAlsoEmploi({ isCfa = false, company = {}, searchedMatchaJobs = [] }) {
  let hasEtablissementFormateurSiret = false
  let hasEtablissementGestionnaireSiret = false
  const matchaSirets = searchedMatchaJobs ? searchedMatchaJobs.map((matcha) => matcha?.company?.siret) : []
  const nonEmptyMatchaSirets = matchaSirets.filter(isNonEmptyString)
  // @ts-expect-error: TODO
  if (nonEmptyMatchaSirets.length > 0 && isNonEmptyString(company?.siret)) {
    // @ts-expect-error: TODO
    hasEtablissementFormateurSiret = nonEmptyMatchaSirets.includes(company?.siret)
  }
  // @ts-expect-error: TODO
  if (nonEmptyMatchaSirets.length > 0 && isNonEmptyString(company?.headquarter?.siret)) {
    // @ts-expect-error: TODO
    hasEtablissementGestionnaireSiret = nonEmptyMatchaSirets.includes(company?.headquarter?.siret)
  }

  return isCfa || hasEtablissementFormateurSiret || hasEtablissementGestionnaireSiret
}
