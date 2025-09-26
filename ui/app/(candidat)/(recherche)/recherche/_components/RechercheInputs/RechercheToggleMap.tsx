import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch"
import { Box } from "@mui/material"

export const RechercheToggleMap = ({ onChange, checked }: { checked: boolean; onChange?: (value: boolean) => void }) => {
  return (
    <Box
      sx={{
        display: "flex",
        minWidth: "182px",
      }}
    >
      <ToggleSwitch
        disabled={onChange === null}
        showCheckedHint={false}
        label="Afficher la carte"
        labelPosition="left"
        inputTitle="display_map"
        checked={checked}
        onChange={onChange}
      />
    </Box>
  )
}
