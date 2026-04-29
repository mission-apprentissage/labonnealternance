export type IDiplomeKpi = {
  label: string
  value: string
  /** Chemin vers l'image du pictogramme (ex: "/images/diplome/icon-offre-emploi.svg") */
  iconSrc: string
  /** Si true, le label s'affiche au-dessus de la valeur (sinon valeur en premier) */
  labelFirst?: boolean
}

export type IDiplomeObjectif = {
  iconSrc: string
  title: string
  items: string[]
}

export type IDiplomeProgramme = {
  icon: string
  title: string
  items: string[]
}

export type IDiplomeRessource = {
  title: string
  description: string
  href: string
  imageSrc?: string
}

export type IDiplomePrerequis = {
  label: string
}

export type IDiplomeEtape = {
  numero: number
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
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
  /** Partie du titre mise en valeur en bleu (ex: "BTS MCO") */
  titreAccent: string
  sousTitre: string
  kpis: IDiplomeKpi[]
  description: {
    title: string
    titleHighlight?: string
    text: string
    objectifs: IDiplomeObjectif[]
  }
  programme: {
    title: string
    titleHighlight?: string
    text: string
    sections: IDiplomeProgramme[]
  }
  preparation: {
    title: string
    titleHighlight?: string
    text: string
    ressources: IDiplomeRessource[]
  }
  integration: {
    title: string
    prerequis: IDiplomePrerequis[]
    etapes: IDiplomeEtape[]
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
  ecoles: {
    title: string
    titleHighlight?: string
    formations: IDiplomeEcoleCard[]
  }
  salaire: {
    title: string
    titleHighlight?: string
    titleSuffix?: string
    texteIntro: string
    lignes: IDiplomeSalaireLigne[]
  }
  metiers: {
    title: string
    text: string
    liste: IDiplomeMetier[]
  }
  autresDiplomes: IDiplomeAutre[]
}
