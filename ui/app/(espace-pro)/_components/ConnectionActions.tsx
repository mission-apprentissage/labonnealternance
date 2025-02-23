import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"

export const ConnectionActions = ({ service }) => (
  <Box sx={{ display: "flex", pt: fr.spacing("3w"), flexDirection: { sm: "column", md: "row" }, gap: fr.spacing("2w") }}>
    {service === "entreprise" && (
      <Button
        linkProps={{
          href: "/espace-pro/creation/entreprise",
        }}
        aria-label="Déposer une offre"
      >
        Déposer une offre
      </Button>
    )}
    {service === "cfa" && (
      <Button
        linkProps={{
          href: "/espace-pro/creation/cfa",
        }}
        aria-label="Créer mon espace dédié"
      >
        Créer mon espace dédié
      </Button>
    )}

    <Button
      linkProps={{
        href: "/espace-pro/authentification",
      }}
      aria-label="Me connecter"
      priority="secondary"
    >
      Me connecter
    </Button>
  </Box>
)
