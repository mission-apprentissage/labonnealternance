import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { ReactNode } from "react"

/**
 * Mise en page des formulaires de compte (création, Mon compte, entreprise partenaire) : `aside`
 * (InformationLegaleEntreprise) à gauche, `content` (sections du formulaire) à droite, `buttons` sous le
 * formulaire. Sous `md`, une seule colonne : l'aside passe au-dessus du formulaire.
 *
 * L'aside précède le formulaire dans le DOM pour que l'ordre de tabulation suive l'ordre visuel (RGAA 12.8).
 * À placer dans le <form> appelant : les boutons doivent rester dans le même <form> que les champs.
 */
export const TwoColumnFormLayout = ({ aside, content, buttons }: { aside?: ReactNode; content: ReactNode; buttons: ReactNode }) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: aside ? "minmax(260px, 360px) minmax(0, 760px)" : "minmax(0, 760px)" },
        columnGap: fr.spacing("8v"),
        rowGap: fr.spacing("8v"),
        alignItems: "start",
      }}
    >
      {aside && <Box sx={{ gridRow: { md: "1 / span 2" }, minWidth: 0 }}>{aside}</Box>}
      <Box sx={{ minWidth: 0 }}>{content}</Box>
      <Box
        sx={{
          gridColumn: { md: aside ? 2 : 1 },
          borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          pt: fr.spacing("6v"),
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          flexWrap: "wrap",
          gap: fr.spacing("4v"),
        }}
      >
        {buttons}
      </Box>
    </Box>
  )
}
