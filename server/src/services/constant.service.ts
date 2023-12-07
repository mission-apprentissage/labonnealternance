export const POURVUE = "Pourvue"
export const ANNULEE = "Annulée"
export const ACTIVE = "Active"

export enum RECRUITER_STATUS {
  ACTIF = "Actif",
  ARCHIVE = "Archivé",
  EN_ATTENTE_VALIDATION = "En attente de validation",
}

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
export const ENTREPRISE_DELEGATION = "ENTREPRISE_DELEGATION"

export const ADMIN = "ADMIN"
export const ENTREPRISE = "ENTREPRISE"
export const CFA = "CFA"
export const OPCO = "OPCO"
export const REGEX = {
  SIRET: /^([0-9]{9}|[0-9]{14})$/,
  GEO: /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/,
  TELEPHONE: /^[0-9]{10}$/,
}

export const NIVEAUX_POUR_LBA = {
  INDIFFERENT: "Indifférent",
  "3 (CAP...)": "Cap, autres formations niveau (Infrabac)",
  "4 (BAC...)": "BP, Bac, autres formations niveau (Bac)",
  "5 (BTS, DEUST...)": "BTS, DEUST, autres formations niveau (Bac+2)",
  "6 (Licence, BUT...)": "Licence, autres formations niveau (Bac+3)",
  "7 (Master, titre ingénieur...)": "Master, titre ingénieur, autres formations niveau (Bac+5)",
}

// Note: notre moteur de recherche demande le niveau visé ce qui matche avec les offres lba.
// en revanche pour l'api offres de Pôle emploi le filtre sur le niveau est le niveau
// requis en entrée.
export const NIVEAUX_POUR_OFFRES_PE = {
  "4 (BAC...)": "NV5",
  "5 (BTS, DEUST...)": "NV4",
  "6 (Licence, BUT...)": "NV3",
  "7 (Master, titre ingénieur...)": "NV2",
}

export const UNSUBSCRIBE_REASON = {
  RECRUTEMENT_CLOS: "Nous avons déjà trouvé nos alternants pour l’année en cours",
  CANDIDATURES_INAPPROPRIEES: "Les candidatures ne correspondent pas aux activités de mon entreprise",
  AUTRES_CANAUX: "J'utilise d'autres canaux pour mes recrutements d'alternants",
  PAS_BUDGET: "Mon entreprise n’a pas la capacité financière pour recruter un alternant",
  PAS_ALTERNANT: "Mon entreprise ne recrute pas en alternance",
  ENTREPRISE_FERMEE: "L’entreprise est fermée",
  AUTRE: "Autre",
}

export enum UNSUBSCRIBE_EMAIL_ERRORS {
  NON_RECONNU = "NON_RECONNU",
  ETABLISSEMENTS_MULTIPLES = "ETABLISSEMENTS_MULTIPLES",
}

export const ROLES = {
  candidat: "candidat",
  cfa: "cfa",
  administrator: "administrator",
}

export type IRoles = typeof ROLES

export type IRole = IRoles[keyof IRoles]
