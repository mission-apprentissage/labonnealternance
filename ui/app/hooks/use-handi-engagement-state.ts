import { useQuery } from "@tanstack/react-query"
import { EntrepriseEngagementSources } from "shared/models/referentiel-engagement-entreprise.model"

import { getEntrepriseInformation } from "@/utils/api"

/**
 * Dérive l'état d'affichage du champ handiEngagement à partir de engagementHandicapOrigin (source unique
 * de la règle métier "France Travail masque, La bonne alternance verrouille"), partagée entre l'écran de
 * création de compte (InformationCreationCompte) et l'écran d'édition de compte (CompteRenderer).
 *
 * @param siret Siret de l'entreprise (undefined tant qu'il n'est pas encore connu).
 * @param isEntreprise La règle ne s'applique qu'aux comptes de type ENTREPRISE (pas CFA).
 */
export const useHandiEngagementState = (siret: string | undefined, isEntreprise: boolean) => {
  const needsEntrepriseInfo = Boolean(siret && isEntreprise)

  // Même queryKey que InformationLegaleEntreprise : partage le cache React Query, pas d'appel réseau
  // dupliqué.
  const { data: entrepriseInfosResult } = useQuery({
    queryKey: ["get-entreprise", siret],
    queryFn: () => getEntrepriseInformation(siret!, { skipUpdate: true }),
    enabled: needsEntrepriseInfo,
  })

  // error est le discriminant du type retourné par getEntrepriseInformation : plus simple et plus sûr
  // que de vérifier structurellement la présence de "data" puis de "siret" dans ce "data".
  const entrepriseInfos = entrepriseInfosResult?.error === false ? entrepriseInfosResult.data : undefined
  const engagementHandicapOrigin = entrepriseInfos?.engagementHandicapOrigin

  // France Travail a déjà recensé l'entreprise : on ne redemande pas son consentement, champ et bloc masqués.
  const hideHandiEngagement = engagementHandicapOrigin === EntrepriseEngagementSources.FRANCE_TRAVAIL
  // Un "oui" déjà enregistré via La bonne alternance est irréversible depuis ces écrans (one way ticket) :
  // le champ reste visible mais verrouillé sur "oui", et le bloc de sensibilisation n'a plus lieu d'être.
  const isHandiEngagementLocked = engagementHandicapOrigin === EntrepriseEngagementSources.LBA

  // true tant que la requête est pertinente et n'a pas encore résolu (ni succès, ni erreur) : à utiliser
  // pour retarder le montage d'un formulaire dont les initialValues dépendent de hideHandiEngagement/
  // isHandiEngagementLocked, plutôt que de les corriger après coup.
  const isPending = needsEntrepriseInfo && entrepriseInfosResult === undefined

  return { needsEntrepriseInfo, hideHandiEngagement, isHandiEngagementLocked, isPending }
}
