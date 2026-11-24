import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"

import { pluralize } from "@/utils/strutils"

/**
 * Proposition de l'état vide du mode « Emplois avec formation incluse » (#5637). « Résultats » et
 * non « offres » : en mode emplois, le total compte aussi les entreprises à contacter.
 */
export function EmploisModeFallback({ count, onSwitch }: { count: number; onSwitch: () => void }) {
  return (
    <Box sx={{ mt: fr.spacing("6v"), display: "flex", flexDirection: "column", alignItems: "center", gap: fr.spacing("3v") }}>
      <Typography sx={{ color: fr.colors.decisions.text.default.grey.default }}>
        Les offres avec formation incluse sont peu nombreuses. Votre recherche trouve {pluralize(count, "résultat")} en mode « Emplois uniquement ».
      </Typography>
      <Button priority="primary" iconId="fr-icon-search-line" onClick={onSwitch}>
        Voir ces résultats
      </Button>
    </Box>
  )
}
