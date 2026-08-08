import { listeCfaEntreprise } from "../constants/liste-cfa-entreprise.js"

export const isCfaEntreprise = (siret: string | undefined | null, siretGestionnaire?: string | undefined | null) => {
  return (siret ? listeCfaEntreprise.indexOf(siret) >= 0 : false) || (siretGestionnaire ? listeCfaEntreprise.indexOf(siretGestionnaire) >= 0 : false)
}
