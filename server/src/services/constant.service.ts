export const POURVUE = "Pourvue"
export const ANNULEE = "Annulée"
export const ACTIVE = "Active"

export enum RECRUITER_STATUS {
  ACTIF = "Actif",
  ARCHIVE = "Archivé",
  EN_ATTENTE_VALIDATION = "En attente de validation",
}

export const ADMIN = "ADMIN"
export const ENTREPRISE = "ENTREPRISE"
export const CFA = "CFA"

export const NIVEAUX_POUR_LBA = {
  INDIFFERENT: "Indifférent",
  "3 (CAP...)": "Cap, autres formations niveau (Infrabac)",
  "4 (BAC...)": "BP, Bac, autres formations niveau (Bac)",
  "5 (BTS, DEUST...)": "BTS, DEUST, autres formations niveau (Bac+2)",
  "6 (Licence, BUT...)": "Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)",
  "7 (Master, titre ingénieur...)": "Master, titre ingénieur, autres formations niveau (Bac+5)",
}

// Note: notre moteur de recherche demande le niveau visé ce qui matche avec les offres lba.
// en revanche pour l'api offres de France Travail le filtre sur le niveau est le niveau
// requis en entrée.
export const NIVEAUX_POUR_OFFRES_PE = {
  "4 (BAC...)": "NV5",
  "5 (BTS, DEUST...)": "NV4",
  "6 (Licence, BUT...)": "NV3",
  "7 (Master, titre ingénieur...)": "NV2",
}

export enum UNSUBSCRIBE_EMAIL_ERRORS {
  NON_RECONNU = "NON_RECONNU",
  ETABLISSEMENTS_MULTIPLES = "ETABLISSEMENTS_MULTIPLES",
  WRONG_PARAMETERS = "WRONG_PARAMETERS",
}
