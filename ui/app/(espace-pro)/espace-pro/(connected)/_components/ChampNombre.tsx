import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, FormLabel } from "@mui/material"

export const ChampNombre = ({ value, max, name, handleChange, label, dataTestId }) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("4v"), width: "100%" }} data-testid={dataTestId}>
      <FormLabel sx={{ flexGrow: 2 }}>{label}</FormLabel>

      <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("4v") }}>
        {/* boutons icône : le title est le nom accessible (RGAA 1.1 / 7.1) */}
        <Button title="Retirer un poste" iconId="fr-icon-subtract-line" onClick={() => handleChange(name, value - 1)} disabled={value === 1} priority="secondary" data-testid="-" />
        <FormLabel required={false} sx={{ minWidth: "24px", textAlign: "center" }} data-testid={`${dataTestId}-value`}>
          {value}
        </FormLabel>
        <Button title="Ajouter un poste" iconId="fr-icon-add-line" onClick={() => handleChange(name, value + 1)} disabled={value === max} priority="secondary" data-testid="+" />
      </Box>
    </Box>
  )
}
