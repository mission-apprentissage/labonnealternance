import { PAGES } from "@/utils/routes.utils"
import type { IModerationQueueItemJson, IModerationUserType } from "./moderation.types"

type IRecruiterJson = IModerationQueueItemJson["recruiter"]
type IOfferLinkFields = Pick<IModerationQueueItemJson, "_id" | "workplace_siret" | "offer_title">

/** Fiche du compte recruteur. Un OPCO n'accède pas aux comptes CFA : la route renverrait 403, qui ferme la session. */
export const getRecruiterAccountPath = (recruiter: IRecruiterJson, userType: IModerationUserType): string | null => {
  if (!recruiter.user_id) return null
  if (userType === "OPCO") {
    return recruiter.account_type === "ENTREPRISE" ? PAGES.dynamic.backOpcoInformationEntreprise({ user_id: recruiter.user_id }).getPath() : null
  }
  return PAGES.dynamic.backAdminRecruteurOffres({ user_id: recruiter.user_id }).getPath()
}

/** Édition de l'offre depuis le back-office, sur le modèle de la fiche entreprise (cf. DetailEntreprise). */
export const getOfferEditionPath = (offer: IOfferLinkFields, recruiter: IRecruiterJson, userType: IModerationUserType): string | null => {
  if (!recruiter.user_id || !offer.workplace_siret) return null
  if (userType === "OPCO" && recruiter.account_type === "CFA") return null
  return PAGES.dynamic
    .offreUpsert({
      offerId: offer._id,
      establishment_id: `${recruiter.user_id}_${offer.workplace_siret}`,
      userType,
      userId: recruiter.user_id,
      raison_sociale: recruiter.raison_sociale ?? undefined,
    })
    .getPath()
}
