const normalize = (text: string): string => text.replace(/\s+/g, " ").trim()

/**
 * Une offre déposée sans description rédigée reçoit la définition de la fiche ROME dans
 * offer_description (cf. formulaire.service). Comparer les deux textes est le seul moyen, en
 * relecture, de distinguer une description du recruteur d'une fiche métier recopiée : rien dans le
 * modèle ne porte le mode de rédaction choisi au dépôt.
 * Limite connue : si le référentiel modifie sa définition après le dépôt, l'offre repasse pour
 * rédigée.
 */
export const isRomeDefinition = (description: string | null | undefined, romeDefinition: string | null | undefined): boolean =>
  Boolean(description && romeDefinition && normalize(description) === normalize(romeDefinition))
