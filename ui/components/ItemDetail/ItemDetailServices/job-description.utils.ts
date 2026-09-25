import { isRomeDefinition } from "shared/utils/job-description.utils"

export const BAD_DESCRIPTION_LENGTH = 50

/**
 * Le seuil de longueur écarte les descriptions inexploitables des flux partenaires ("CDI", "voir
 * notre site"). Une offre LBA passe par notre formulaire de dépôt, qui impose déjà 30 caractères et
 * une modération : l'y appliquer masquerait une description valide de 30 à 50 caractères.
 */
export const isDisplayableDescription = (description: string | null | undefined, isLbaOffer: boolean): boolean =>
  Boolean(description && (isLbaOffer || description.length > BAD_DESCRIPTION_LENGTH))

/**
 * Texte à afficher comme description rédigée par le recruteur, ou null s'il n'y en a pas : une
 * description inexploitable, ou la fiche métier recopiée (cf. isRomeDefinition).
 */
export const getRecruiterWrittenDescription = (description: string | null | undefined, romeDefinition: string | null | undefined, isLbaOffer: boolean): string | null => {
  if (!isDisplayableDescription(description, isLbaOffer)) return null
  return isRomeDefinition(description, romeDefinition) ? null : (description ?? null)
}
