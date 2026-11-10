import { fr } from "@codegouvfr/react-dsfr"
import Badge from "@codegouvfr/react-dsfr/Badge"
import type { ReactNode } from "react"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import type { IAccountOfferConformity, IModerationReviewStatus, IModerationVerdict, IOfferModerationStatus } from "shared/models/jobs-partners-moderation.model"
import { ACCOUNT_OFFER_CONFORMITIES, OFFER_MODERATION_STATUS } from "shared/models/jobs-partners-moderation.model"
import { AccessStatus } from "shared/models/role-management.model"

type IBadgeTone = "success" | "error" | "warning" | "new" | "info" | "na"

// Légende de la maquette (#5499) : vert, rouge, orange avec pictogramme, jaune, bleu pour le type de compte, violet pour « non applicable ».
// `as="span"` pour un badge placé dans un paragraphe : le badge DSFR est un <p> par défaut.
const ModerationBadge = ({ tone, withIcon = false, as, children }: { tone: IBadgeTone; withIcon?: boolean; as?: "p" | "span"; children: ReactNode }) => (
  <Badge small noIcon={!withIcon} as={as} severity={tone === "na" ? undefined : tone} className={tone === "na" ? "fr-badge--purple-glycine" : undefined}>
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

/** Statut d'un compte des listes de recruteurs, avec la légende de AccountStatusBadge. */
export const UserRecruteurStatusBadge = ({ status }: { status: ETAT_UTILISATEUR | null }) => {
  switch (status) {
    case ETAT_UTILISATEUR.VALIDE:
      return <AccountStatusBadge status={AccessStatus.GRANTED} />
    case ETAT_UTILISATEUR.DESACTIVE:
      return <AccountStatusBadge status={AccessStatus.DENIED} />
    case ETAT_UTILISATEUR.ERROR:
      return <ModerationBadge tone="warning">En erreur</ModerationBadge>
    case ETAT_UTILISATEUR.ATTENTE:
      return <AccountStatusBadge status={AccessStatus.AWAITING_VALIDATION} />
    default:
      return null
  }
}

export const AccountTypeBadge = ({ type, as }: { type: "ENTREPRISE" | "CFA"; as?: "p" | "span" }) => (
  <ModerationBadge tone="info" as={as}>
    {type === "CFA" ? "CFA" : "Entreprise"}
  </ModerationBadge>
)

/**
 * Une offre jamais classifiée n'a ni décision ni conformité : « non applicable ». Une offre jugée conforme n'entre pas
 * dans la file et n'attend aucune décision : « non requise ».
 */
export const ReviewStatusBadge = ({
  review,
  isClassified,
  verdict,
  status,
}: {
  review: IModerationReviewStatus | null | undefined
  isClassified: boolean
  verdict: IModerationVerdict | null | undefined
  status: IOfferModerationStatus | null | undefined
}) => {
  if (!isClassified) return <ModerationBadge tone="na">Non applicable</ModerationBadge>
  if (review === "validee") return <ModerationBadge tone="success">Validé</ModerationBadge>
  if (review === "refusee") return <ModerationBadge tone="error">Refusé</ModerationBadge>
  if (verdict === "conforme" && status === OFFER_MODERATION_STATUS.OK) return <ModerationBadge tone="na">Non requise</ModerationBadge>
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

const ACCOUNT_CONFORMITY_AS_OFFER: Record<Exclude<IAccountOfferConformity, "aucune_offre">, Parameters<typeof ConformityBadge>[0]> = {
  non_conforme: { verdict: "non_conforme", status: OFFER_MODERATION_STATUS.OK },
  indisponible: { verdict: "a_verifier", status: OFFER_MODERATION_STATUS.INDISPONIBLE },
  a_verifier: { verdict: "a_verifier", status: OFFER_MODERATION_STATUS.OK },
  conforme: { verdict: "conforme", status: OFFER_MODERATION_STATUS.OK },
  non_applicable: { verdict: null, status: null },
}

/** Rang de tri de la conformité d'un compte, de la plus défavorable à « aucune offre ». */
export const accountConformityRank = (conformity: IAccountOfferConformity) => ACCOUNT_OFFER_CONFORMITIES.indexOf(conformity)

/** Conformité d'un compte, celle de sa pire offre non close : un compte sans offre n'a pas de badge (#5757). */
export const AccountConformityBadge = ({ conformity }: { conformity: IAccountOfferConformity }) =>
  conformity === "aucune_offre" ? <span className={fr.cx("fr-text--sm", "fr-mb-0")}>Aucune offre</span> : <ConformityBadge {...ACCOUNT_CONFORMITY_AS_OFFER[conformity]} />
