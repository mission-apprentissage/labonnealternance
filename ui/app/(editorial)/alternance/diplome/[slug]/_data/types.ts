export type IDiplomeKpis = {
  duration: string
  entreprise: string
  salaire: string
  insertion: string
}

export type IDiplomeProgrammeSections = {
  enseignements_generaux: string[]
  enseignements_professionnels: string[]
  competences_developpees: string[]
}

export type IDiplomeEntreprise = {
  name: string
  postes: number
}

export type IDiplomeFormation = {
  title: string
  formations: number
  duree: string
  niveau: string
  specialisation: string
  competences: string
}

export type IDiplomeVille = {
  name: string
  offres: number
  href: string
}

export type IDiplomePerspectiveKpi = {
  icon: string
  value: string
  label: string
}

export type IDiplomeCarriere = {
  periode: string
  titre: string
  salaire: string
  missions: string
}

export type IDiplomeSalaireLigne = {
  age: string
  premiereAnnee: string
  deuxiemeAnnee: string
}

export type IDiplomeMetier = {
  icon: string
  title: string
  offres: string
  href: string
}

export type IDiplomeAutre = {
  icon: string
  title: string
  sousTitre?: string
  href: string
}

export type IDiplomeEcoleCard = {
  formationTitle: string
  etablissement: string
  lieu: string
  href: string
}

export type IDiplomeSeoData = {
  slug: string
  titre: string
  intituleLongFormation: string
  sousTitre: string
  kpis: IDiplomeKpis
  description: {
    text: string
    objectifs: string[]
  }
  programme: {
    text: string
    sections: IDiplomeProgrammeSections
  }
  entreprises: {
    title: string
    text: string
    liste: IDiplomeEntreprise[]
  }
  formations: {
    title: string
    niveaux: IDiplomeFormation[]
  }
  localisation: {
    title: string
    text: string
    villes: IDiplomeVille[]
  }
  perspectives: {
    title: string
    kpis: IDiplomePerspectiveKpi[]
    carrieres: IDiplomeCarriere[]
  }
  ecoles: IDiplomeEcoleCard[]
  salaire: IDiplomeSalaireLigne[]
  metiers: {
    title: string
    text: string
    liste: IDiplomeMetier[]
  }
  autresDiplomes: IDiplomeAutre[]
}
