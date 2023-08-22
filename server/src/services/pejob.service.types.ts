// warning: types écrits à partir d'un échantillon de données

type PEContact = {
  nom: string
  courriel: string
  coordonnees1: string
  coordonnees2: string
  coordonnees3: string
}

export type PEJob = {
  id: string
  intitule: string
  description: string
  dateCreation: string
  dateActualisation: string
  lieuTravail: {
    libelle: string
    latitude: number
    longitude: number
    codePostal: string
    commune: string
  }
  romeCode: string
  romeLibelle: string
  appellationlibelle: string
  entreprise: object[]
  typeContrat: string
  typeContratLibelle: string
  natureContrat: string
  experienceExige: string
  experienceLibelle: string
  competences?: [][]
  salaire: object[] | object
  dureeTravailLibelle?: string
  dureeTravailLibelleConverti?: string
  alternance: boolean
  contact?: PEContact
  agence?: object[]
  nombrePostes: number
  accessibleTH: boolean
  deplacementCode?: string
  deplacementLibelle?: string
  qualificationCode?: string
  qualificationLibelle?: string
  codeNAF?: string
  secteurActivite?: string
  secteurActiviteLibelle?: string
  qualitesProfessionnelles?: [][]
  origineOffre: object[]
  offresManqueCandidats?: boolean
  formations?: [][]
  langues?: [][]
  complementExercice?: string
}

export type PEResponse = {
  resultats: PEJob[]
  filtresPossibles: {
    filtre: string
    agregation: [][]
  }[]
}
