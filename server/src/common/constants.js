export const POURVUE = "Pourvue"
export const ANNULEE = "Annulée"
export const KEY_GENERATOR_PARAMS = ({ length, symbols, numbers }) => {
  return {
    length: length ?? 50,
    strict: true,
    numbers: numbers ?? true,
    symbols: symbols ?? true,
    lowercase: true,
    uppercase: false,
    excludeSimilarCharacters: true,
    exclude: '!"_%£$€*¨^=+~ß(){}[]§;,./:`@#&|<>?"',
  }
}
export const validation_utilisateur = {
  AUTO: "AUTOMATIQUE",
  MANUAL: "MANUELLE",
}
export const ENTREPRISE_DELEGATION = "ENTREPRISE_DELEGATION"
export const etat_utilisateur = {
  VALIDE: "VALIDÉ",
  DESACTIVE: "DESACTIVÉ",
  ATTENTE: "EN ATTENTE DE VALIDATION",
}
export const etat_etablissements = {
  ACTIF: "actif",
  FERME: "fermé",
}
export const ENTREPRISE = "ENTREPRISE"
export const CFA = "CFA"
export const REGEX = {
  SIRET: /^([0-9]{9}|[0-9]{14})$/,
  GEO: /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/,
  TELEPHONE: /^[0-9]{10}$/,
}
export const OPCOS = {
  AFDAS: "AFDAS",
  AKTO: "AKTO / Opco entreprises et salariés des services à forte intensité de main d'oeuvre",
  ATLAS: "ATLAS",
  CONSTRUCTYS: "Constructys",
  OPCOMMERCE: "L'Opcommerce",
  OCAPIAT: "OCAPIAT",
  OPCO2I: "OPCO 2i",
  EP: "Opco entreprises de proximité",
  MOBILITE: "Opco Mobilités",
  SANTE: "Opco Santé",
  UNIFORMATION: "Uniformation, l'Opco de la Cohésion sociale",
}
