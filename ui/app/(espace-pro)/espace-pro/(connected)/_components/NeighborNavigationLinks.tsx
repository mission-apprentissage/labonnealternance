"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"

const ICONS = {
  previous: { iconId: "fr-icon-arrow-left-s-line", iconPosition: "left" },
  next: { iconId: "fr-icon-arrow-right-s-line", iconPosition: "right" },
} as const

type INeighbor = { href: string | null; label: string }

// Un lien ne se désactive pas : sans voisin, un bouton désactivé prend sa place.
const NeighborLink = ({ href, label, direction }: INeighbor & { direction: keyof typeof ICONS }) =>
  href ? (
    <Button priority="secondary" size="small" {...ICONS[direction]} linkProps={{ href }}>
      {label}
    </Button>
  ) : (
    <Button priority="secondary" size="small" {...ICONS[direction]} disabled>
      {label}
    </Button>
  )

/** Boutons « précédent » et « suivant » entre les éléments d'une liste (offres de la file de modération, candidatures d'une offre). */
export const NeighborNavigationLinks = ({ ariaLabel, previous, next }: { ariaLabel: string; previous: INeighbor; next: INeighbor }) => (
  <Box component="nav" aria-label={ariaLabel} sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("2v") }}>
    <NeighborLink {...previous} direction="previous" />
    <NeighborLink {...next} direction="next" />
  </Box>
)
