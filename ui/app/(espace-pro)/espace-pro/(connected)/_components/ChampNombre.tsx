import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useId } from "react"

export const ChampNombre = ({ value, max, name, handleChange, label, dataTestId }) => {
  const labelId = useId()
  const isMin = value === 1
  const isMax = value === max

  return (
    // pas de saisie libre : le groupe nomme les deux boutons et la valeur est annoncée à chaque changement (RGAA 11.5)
    <Box role="group" aria-labelledby={labelId} sx={{ display: "flex", alignItems: "center", gap: fr.spacing("4v"), width: "100%" }} data-testid={dataTestId}>
      <Box component="span" id={labelId} className={fr.cx("fr-label")} sx={{ flexGrow: 2 }}>
        {label}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: fr.spacing("4v"),
          // reprend le style DSFR de .fr-btn--secondary:disabled, que le DSFR n'applique pas à aria-disabled
          "& .fr-btn--secondary[aria-disabled='true']": {
            "--hover": "inherit",
            "--active": "inherit",
            backgroundColor: "transparent",
            boxShadow: "inset 0 0 0 1px var(--border-disabled-grey)",
            color: "var(--text-disabled-grey)",
            cursor: "not-allowed",
          },
        }}
      >
        {/* boutons icône : le title est le nom accessible (RGAA 1.1 / 7.1).
            aria-disabled plutôt que disabled : un bouton désactivé au clic perdrait le focus clavier. */}
        <Button
          title="Retirer un poste"
          iconId="fr-icon-subtract-line"
          onClick={() => !isMin && handleChange(name, value - 1)}
          nativeButtonProps={{ "aria-disabled": isMin }}
          priority="secondary"
          data-testid="-"
        />
        <Box component="output" aria-live="polite" sx={{ minWidth: "24px", textAlign: "center" }} data-testid={`${dataTestId}-value`}>
          {value}
        </Box>
        <Button
          title="Ajouter un poste"
          iconId="fr-icon-add-line"
          onClick={() => !isMax && handleChange(name, value + 1)}
          nativeButtonProps={{ "aria-disabled": isMax }}
          priority="secondary"
          data-testid="+"
        />
      </Box>
    </Box>
  )
}
