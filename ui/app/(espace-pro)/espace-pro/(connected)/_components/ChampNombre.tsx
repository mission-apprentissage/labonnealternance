import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useId } from "react"

export const ChampNombre = ({ value, max, name, handleChange, label, dataTestId }) => {
  const labelId = useId()

  return (
    // pas de saisie libre : le groupe nomme les deux boutons et la valeur est annoncée à chaque changement (RGAA 11.5)
    <Box role="group" aria-labelledby={labelId} sx={{ display: "flex", alignItems: "center", gap: fr.spacing("4v"), width: "100%" }} data-testid={dataTestId}>
      <Box component="span" id={labelId} className={fr.cx("fr-label")} sx={{ flexGrow: 2 }}>
        {label}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("4v") }}>
        {/* boutons icône : le title est le nom accessible (RGAA 1.1 / 7.1) */}
        <Button title="Retirer un poste" iconId="fr-icon-subtract-line" onClick={() => handleChange(name, value - 1)} disabled={value === 1} priority="secondary" data-testid="-" />
        <Box component="output" aria-live="polite" sx={{ minWidth: "24px", textAlign: "center" }} data-testid={`${dataTestId}-value`}>
          {value}
        </Box>
        <Button title="Ajouter un poste" iconId="fr-icon-add-line" onClick={() => handleChange(name, value + 1)} disabled={value === max} priority="secondary" data-testid="+" />
      </Box>
    </Box>
  )
}
