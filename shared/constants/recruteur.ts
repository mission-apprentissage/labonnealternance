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

export enum OPCOS_LABEL {
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
  UNKNOWN_OPCO = "inconnu",
  MULTIPLE_OPCO = "OPCO multiple",
}

export const NIVEAUX_POUR_LBA = {
  INDIFFERENT: "Indifférent",
  "3 (CAP...)": "Cap, autres formations niveau (Infrabac)",
  "4 (BAC...)": "BP, Bac, autres formations niveau (Bac)",
  "5 (BTS, DEUST...)": "BTS, DEUST, autres formations niveau (Bac+2)",
  "6 (Licence, BUT...)": "Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)",
  "7 (Master, titre ingénieur...)": "Master, titre ingénieur, autres formations niveau (Bac+5)",
} as const

export type INiveauPourLbaKey = keyof typeof NIVEAUX_POUR_LBA

export type INiveauPourLbaLabel = (typeof NIVEAUX_POUR_LBA)[INiveauPourLbaKey]

export const NIVEAU_DIPLOME_LABEL = {
  "3": "Cap, autres formations niveau (Infrabac)",
  "4": "BP, Bac, autres formations niveau (Bac)",
  "5": "BTS, DEUST, autres formations niveau (Bac+2)",
  "6": "Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)",
  "7": "Master, titre ingénieur, autres formations niveau (Bac+5)",
} as const

// Note: notre moteur de recherche demande le niveau visé ce qui matche avec les offres lba.
// en revanche pour l'api offres de France Travail le filtre sur le niveau est le niveau
// requis en entrée.
export const NIVEAUX_POUR_OFFRES_PE = {
  "3 (CAP...)": "NV5",
  "4 (BAC...)": "NV4",
  "5 (BTS, DEUST...)": "NV3",
  "6 (Licence, BUT...)": "NV2",
  "7 (Master, titre ingénieur...)": "NV1",
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

export const RECRUITER_USER_ORIGIN = {
  sante: "Opco Santé",
  atlas: "Opco Atlas",
  opco2i: "Opco 2i",
  constructys: "Opco Constructys",
  "opcoep-CRM": "Opco EP",
  akto: "Opco Akto",
  "lesentreprises-sengagent": "Les entreprises s'engagent",
  "opcoep-HUBE": "Opco EP",
  portailalternance: "Portail de l'alternance",
  "1J1S": "1 jeune 1 solution",
}
