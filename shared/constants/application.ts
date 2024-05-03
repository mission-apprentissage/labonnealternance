export enum ApplicantIntention {
  ENTRETIEN = "entretien",
  NESAISPAS = "ne_sais_pas",
  REFUS = "refus",
}

export enum ApplicationErrorReasons {
  BURNER = "L'email est invalide.",
  NOTFOUND = "Aucune offre correspondante trouvée.",
  ATTACHMENT = "Pièce jointe invalide.",
  INTERNAL_EMAIL = "Aucun email trouver pour l'offre trouvé.",
}
