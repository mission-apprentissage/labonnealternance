import { Badge } from "@codegouvfr/react-dsfr/Badge"
import type { ETAT_UTILISATEUR as ETAT_UTILISATEUR_TYPE } from "shared/constants/recruteur"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"

// Le DSFR n'a pas de badge jaune : « à vérifier » reprend la couleur `awaiting` du Badge de l'app.
const AWAITING_STYLE = { backgroundColor: "#FEECC2", color: "#716043" }

export const AccountStatusBadge = ({ status }: { status: ETAT_UTILISATEUR_TYPE | null | undefined }) => {
  switch (status) {
    case ETAT_UTILISATEUR.ATTENTE:
      return (
        <Badge small noIcon as="span" style={AWAITING_STYLE}>
          À vérifier
        </Badge>
      )
    case ETAT_UTILISATEUR.VALIDE:
      return (
        <Badge severity="success" small noIcon as="span">
          Actif
        </Badge>
      )
    case ETAT_UTILISATEUR.DESACTIVE:
      return (
        <Badge severity="error" small noIcon as="span">
          Inactif
        </Badge>
      )
    default:
      return (
        <Badge small noIcon as="span">
          {status ?? "inconnu"}
        </Badge>
      )
  }
}
