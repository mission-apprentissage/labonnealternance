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
export const ENTREPRISE_DELEGATION = "ENTREPRISE_DELEGATION"
export enum ETAT_UTILISATEUR {
  VALIDE = "VALIDÉ",
  DESACTIVE = "DESACTIVÉ",
  ATTENTE = "EN ATTENTE DE VALIDATION",
  ERROR = "ERROR",
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

export const NIVEAUX_POUR_LBA = {
  "3 (CAP...)": "Cap, autres formations niveau (Infrabac)",
  "4 (BAC...)": "BP, Bac, autres formations niveau (Bac)",
  "5 (BTS, DEUST...)": "BTS, DEUST, autres formations niveau (Bac+2)",
  "6 (Licence, BUT...)": "Licence, autres formations niveau (Bac+3)",
  "7 (Master, titre ingénieur...)": "Master, titre ingénieur, autres formations niveau (Bac+5)",
}

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

export const UNSUBSCRIBE_EMAIL_ERRORS = {
  NON_RECONNU: "NON_RECONNU",
  ETABLISSEMENTS_MULTIPLES: "ETABLISSEMENTS_MULTIPLES",
}

export const TRAINING_CONTRACT_TYPE = {
  APPRENTISSAGE: "Apprentissage",
  PROFESSIONNALISATION: "Professionnalisation",
} as const

export const TRAINING_RYTHM = {
  INDIFFERENT: "Indifférent",
  "2J3J": "2 jours / 3 jours",
  "1S1S": "1 semaine / 1 semaine",
  "2S3S": "2 semaines / 3 semaines",
  "6S6S": "6 semaines / 6 semaines",
  NONRENSEIGNE: "Non renseigné",
}

export const ROLES = {
  candidat: "candidat",
  cfa: "cfa",
  administrator: "administrator",
}
