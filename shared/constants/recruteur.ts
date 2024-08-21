export enum RECRUITER_STATUS {
  ACTIF = "Actif",
  ARCHIVE = "Archivé",
  EN_ATTENTE_VALIDATION = "En attente de validation",
}

export const KEY_GENERATOR_PARAMS = ({ length, symbols, numbers }: { length: number; symbols: boolean; numbers: boolean }) => {
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
export enum VALIDATION_UTILISATEUR {
  AUTO = "AUTOMATIQUE",
  MANUAL = "MANUELLE",
}
export const ENTREPRISE_DELEGATION = "ENTREPRISE_DELEGATION" as const
export enum ETAT_UTILISATEUR {
  VALIDE = "VALIDÉ",
  DESACTIVE = "DESACTIVÉ",
  ATTENTE = "EN ATTENTE DE VALIDATION",
  ERROR = "ERROR",
}
export const ENTREPRISE = "ENTREPRISE" as const
export const CFA = "CFA" as const
export const ADMIN = "ADMIN" as const
export const OPCO = "OPCO" as const

export const AUTHTYPE = {
  OPCO: "OPCO",
  CFA,
  ENTREPRISE,
  ADMIN,
} as const

export const REGEX = {
  SIRET: /^([0-9]{9}|[0-9]{14})$/,
  GEO: /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/,
  TELEPHONE: /^[0-9]{10}$/,
} as const
export enum OPCOS {
  AFDAS = "AFDAS",
  AKTO = "AKTO / Opco entreprises et salariés des services à forte intensité de main d'oeuvre",
  ATLAS = "ATLAS",
  CONSTRUCTYS = "Constructys",
  OPCOMMERCE = "L'Opcommerce",
  OCAPIAT = "OCAPIAT",
  OPCO2I = "OPCO 2i",
  EP = "Opco entreprises de proximité",
  MOBILITE = "Opco Mobilités",
  SANTE = "Opco Santé",
  UNIFORMATION = "Uniformation, l'Opco de la Cohésion sociale",
  PASS = "pass",
  MULTIPLE = "Opco multiple",
}

export const NIVEAUX_POUR_LBA = {
  INDIFFERENT: "Indifférent",
  "3 (CAP...)": "Cap, autres formations niveau (Infrabac)",
  "4 (BAC...)": "BP, Bac, autres formations niveau (Bac)",
  "5 (BTS, DEUST...)": "BTS, DEUST, autres formations niveau (Bac+2)",
  "6 (Licence, BUT...)": "Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)",
  "7 (Master, titre ingénieur...)": "Master, titre ingénieur, autres formations niveau (Bac+5)",
} as const

export const NIVEAU_DIPLOME_LABEL = {
  "3": NIVEAUX_POUR_LBA["3 (CAP...)"],
  "4": NIVEAUX_POUR_LBA["4 (BAC...)"],
  "5": NIVEAUX_POUR_LBA["5 (BTS, DEUST...)"],
  "6": NIVEAUX_POUR_LBA["6 (Licence, BUT...)"],
  "7": NIVEAUX_POUR_LBA["7 (Master, titre ingénieur...)"],
} as const

export type INiveauDiplomeEuropeen = keyof typeof NIVEAU_DIPLOME_LABEL

// Note: notre moteur de recherche demande le niveau visé ce qui matche avec les offres lba.
// en revanche pour l'api offres de France Travail le filtre sur le niveau est le niveau
// requis en entrée.
export const NIVEAUX_POUR_OFFRES_PE = {
  "4 (BAC...)": "NV5",
  "5 (BTS, DEUST...)": "NV4",
  "6 (Licence, BUT...)": "NV3",
  "7 (Master, titre ingénieur...)": "NV2",
} as const

export const UNSUBSCRIBE_EMAIL_ERRORS = {
  NON_RECONNU: "NON_RECONNU",
  ETABLISSEMENTS_MULTIPLES: "ETABLISSEMENTS_MULTIPLES",
  WRONG_PARAMETERS: "WRONG_PARAMETERS",
} as const

export const TRAINING_CONTRACT_TYPE = {
  APPRENTISSAGE: "Apprentissage",
  PROFESSIONNALISATION: "Professionnalisation",
} as const

export const TRAINING_RYTHM = {
  INDIFFERENT: "Indifférent",
  "1J4J": "1 jour / 4 jours",
  "2J3J": "2 jours / 3 jours",
  "1S1S": "1 semaine / 1 semaine",
  "2S3S": "2 semaines / 3 semaines",
  "6S6S": "6 semaines / 6 semaines",
} as const

export enum TRAINING_REMOTE_TYPE {
  onsite = "onsite",
  remote = "remote",
  hybrid = "hybrid",
}
