import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"

import { PAGES } from "@/utils/routes.utils"

export const ConnectionActions = ({ service }: { service: "entreprise" | "cfa" }) => (
  <Box sx={{ display: "flex", pt: fr.spacing("3w"), flexDirection: { xs: "column", sm: "column", md: "row" }, gap: fr.spacing("2w"), alignItems: "center" }}>
    {service === "entreprise" && (
      <Button
        linkProps={{
          href: PAGES.static.espaceProCreationEntreprise.getPath(),
        }}
        id="home-pro-content"
        aria-label="Déposer une offre"
      >
        Déposer une offre
      </Button>
    )}
    {service === "cfa" && (
      <Button
        linkProps={{
          href: PAGES.static.espaceProCreationCfa.getPath(),
        }}
        id="home-pro-content"
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
