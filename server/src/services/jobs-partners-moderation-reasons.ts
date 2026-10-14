import { MODERATION_CLASSIFICATION_STATUS } from "shared/models/jobs-partners-moderation.model"

import type { IOffreClassificationResult } from "./offre-classification/offre-classification.service"

/**
 * Motifs écrits dans offer_status_history par la modération des offres LBA (#5498), regroupés tels quels dans les
 * tableaux de bord. `granted_by` vaut MODERATION_GRANTED_BY au dépôt et à l'édition, le nom du job sinon.
 */
export const MODERATION_GRANTED_BY = "classifier"
export const MODERATION_NON_CONFORME_REASON = "contenu non conforme selon le classifieur"
export const MODERATION_INDISPONIBLE_REASON = "classification indisponible"
export const MODERATION_RELEASED_REASON = "classification conforme ou à vérifier"

export const moderationBlockReason = ({ status }: Pick<IOffreClassificationResult, "status">) =>
  status === MODERATION_CLASSIFICATION_STATUS.OK ? MODERATION_NON_CONFORME_REASON : MODERATION_INDISPONIBLE_REASON
