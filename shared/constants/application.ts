export enum ApplicationIntention {
  ENTRETIEN = "entretien",
  REFUS = "refus",
}

export enum ApplicationIntentionDefaultText {
  ENTRETIEN = "Bonjour, \r\n\r\nMerci pour l'intérêt que vous portez à notre établissement. \r\n\r\nVotre candidature a retenu toute notre attention et nous souhaitons échanger avec vous. \r\n\r\nPouvez-vous me recontacter au numéro de téléphone ou via l'email ci-dessous afin que nous puissions convenir d'un rendez-vous ?",
  REFUS = "Bonjour, \r\n\r\nMerci pour l'intérêt que vous portez à notre établissement. Nous avons étudié votre candidature avec attention. Nous ne sommes malheureusement pas en mesure de lui donner une suite favorable. \r\n\r\nNous vous souhaitons bonne chance dans vos recherches. \r\n\r\nBonne continuation",
}

export enum RefusalReasons {
  COMPETENCE = "Compétences insuffisantes ou non adaptées",
  CANDIDATURE_NON_PERSONNALISEE = "Manque de personnalisation de la candidature",
  ECOLE = "Avis négatif sur l’école/la formation",
  CONTRAT_INADAPTE = "Type de contrat inadapté",
  METIER_RECHERCHE = "Notre entreprise ne recrute pas sur le métier recherché",
}
