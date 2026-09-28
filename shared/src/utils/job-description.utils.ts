const normalize = (text: string): string => text.replace(/\s+/g, " ").trim()

/**
 * Une offre déposée sans description rédigée reçoit la définition de la fiche ROME dans
 * offer_description (cf. formulaire.service). Comparer les deux textes distingue une description du
 * recruteur d'une fiche métier recopiée là où offer_description_mode n'est pas disponible (offres
 * non renseignées, item de la fiche UI).
 * Limite connue : si le référentiel modifie sa définition après le dépôt, l'offre repasse pour
 * rédigée.
 */
export const isRomeDefinition = (description: string | null | undefined, romeDefinition: string | null | undefined): boolean =>
  Boolean(description && romeDefinition && normalize(description) === normalize(romeDefinition))

/**
 * Repli pour une offre sans offer_description_mode : description non vide et différente de la
 * fiche ROME. Sans définition de référence, toute description non vide passe pour rédigée.
 */
export const isRecruiterWrittenDescription = (description: string | null | undefined, romeDefinition: string | null | undefined): boolean =>
  Boolean(description?.trim()) && !isRomeDefinition(description, romeDefinition)
