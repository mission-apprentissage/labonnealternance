import Badge from "@codegouvfr/react-dsfr/Badge"
import type { ReactNode } from "react"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import type { IModerationReviewStatus, IModerationVerdict, IOfferModerationStatus } from "shared/models/jobs-partners-moderation.model"
import { OFFER_MODERATION_STATUS } from "shared/models/jobs-partners-moderation.model"
import { AccessStatus } from "shared/models/role-management.model"

type IBadgeTone = "success" | "error" | "warning" | "new" | "info" | "na"

// Légende de la maquette (#5499) : vert, rouge, orange avec pictogramme, jaune, bleu pour le type de compte, violet pour « non applicable ».
const ModerationBadge = ({ tone, withIcon = false, children }: { tone: IBadgeTone; withIcon?: boolean; children: ReactNode }) => (
  <Badge small noIcon={!withIcon} severity={tone === "na" ? undefined : tone} className={tone === "na" ? "fr-badge--purple-glycine" : undefined}>
    {children}
  </Badge>
)

export const OfferStatusBadge = ({ status }: { status: JOB_STATUS_ENGLISH }) => {
  switch (status) {
    case JOB_STATUS_ENGLISH.ACTIVE:
      return <ModerationBadge tone="success">Publiée</ModerationBadge>
    case JOB_STATUS_ENGLISH.POURVUE:
      return <ModerationBadge tone="success">Pourvue</ModerationBadge>
    case JOB_STATUS_ENGLISH.ANNULEE:
      return <ModerationBadge tone="error">Expirée</ModerationBadge>
    default:
      return <ModerationBadge tone="new">En attente</ModerationBadge>
  }
}

export const AccountStatusBadge = ({ status }: { status: AccessStatus | null }) => {
  switch (status) {
    case AccessStatus.GRANTED:
      return <ModerationBadge tone="success">Actif</ModerationBadge>
    case AccessStatus.DENIED:
      return <ModerationBadge tone="error">Désactivé</ModerationBadge>
    default:
      return <ModerationBadge tone="new">À vérifier</ModerationBadge>
  }
}

export const AccountTypeBadge = ({ type }: { type: "ENTREPRISE" | "CFA" }) => <ModerationBadge tone="info">{type === "CFA" ? "CFA" : "Entreprise"}</ModerationBadge>

/** Une offre jamais classifiée n'a ni décision ni conformité : « non applicable ». */
export const ReviewStatusBadge = ({ review, isClassified }: { review: IModerationReviewStatus | null | undefined; isClassified: boolean }) => {
  if (!isClassified) return <ModerationBadge tone="na">Non applicable</ModerationBadge>
  if (review === "validee") return <ModerationBadge tone="success">Validé</ModerationBadge>
  if (review === "refusee") return <ModerationBadge tone="error">Refusé</ModerationBadge>
  return <ModerationBadge tone="new">En attente</ModerationBadge>
}

/** Le statut de la classification passe avant le verdict : en échec, le verdict stocké vaut `a_verifier`. */
export const ConformityBadge = ({ verdict, status }: { verdict: IModerationVerdict | null | undefined; status: IOfferModerationStatus | null | undefined }) => {
  if (!verdict || !status) return <ModerationBadge tone="na">Non applicable</ModerationBadge>
  if (status !== OFFER_MODERATION_STATUS.OK) {
    return (
      <ModerationBadge tone="error" withIcon>
        Analyse indisponible
      </ModerationBadge>
    )
  }
  switch (verdict) {
    case "conforme":
      return <ModerationBadge tone="success">Conforme</ModerationBadge>
    case "non_conforme":
      return (
        <ModerationBadge tone="warning" withIcon>
          Non conforme
        </ModerationBadge>
      )
    default:
      return <ModerationBadge tone="new">À vérifier</ModerationBadge>
  }
}
