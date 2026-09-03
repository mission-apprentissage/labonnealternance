import { fr } from "@codegouvfr/react-dsfr"
import { Box, Divider } from "@mui/material"
import type { ReactNode } from "react"

/**
 * Mise en page à deux colonnes partagée par les formulaires de contact recruteur
 * (CompteRenderer, InformationCreationCompte, CreationEntrepriseDetailPage, DetailEntreprise) :
 * `left` (titre, champs, selects) et `right` (InformationLegaleEntreprise/InformationOpco/
 * InformationHandiEngagement) sur une même grille, `buttons` sous la grille, aligné à droite.
 *
 * Paramètres de grille repris de CreationEntrepriseDetailPage.tsx : sous le point de rupture `md`, la
 * colonne de droite passe sous celle de gauche (une seule colonne, ordre naturel du DOM). Les boutons
 * restent toujours sous la grille, quel que soit le point de rupture — d'où un second Box séparé plutôt
 * qu'un troisième élément de la grille.
 *
 * À placer à l'intérieur du <form> appelant : les boutons doivent rester dans le même <form> que les
 * champs pour que la soumission fonctionne, même s'ils sont visuellement en dehors de la grille.
 */
export const TwoColumnFormLayout = ({ left, right, buttons }: { left: ReactNode; right: ReactNode; buttons: ReactNode }) => {
  return (
    <>
      <Box sx={{ display: "grid", gridTemplateRows: "1fr", gridTemplateColumns: { xs: "1fr", md: "4fr 5fr" }, gap: fr.spacing("6v") }}>
        <Box sx={{ gridRowStart: { xs: "auto", md: 2 } }}>{left}</Box>
        <Box sx={{ gridRowStart: { xs: "auto", md: 2 }, pt: { xs: fr.spacing("4v"), md: 0 }, minWidth: "0" }}>{right}</Box>
      </Box>
      <Divider
        role="presentation"
        sx={{
          height: 0,
          background: "none",
          my: { xs: fr.spacing("3v"), md: fr.spacing("6v") },
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>{buttons}</Box>
    </>
  )
}
