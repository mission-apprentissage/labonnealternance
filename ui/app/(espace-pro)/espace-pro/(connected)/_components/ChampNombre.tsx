import Button from "@codegouvfr/react-dsfr/Button"
import { Box, FormLabel } from "@mui/material"

import { fr } from "@codegouvfr/react-dsfr"
import { Minus, Plus } from "@/theme/components/icons"

export const ChampNombre = ({ value, max, name, handleChange, label, dataTestId }) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }} data-testid={dataTestId}>
      <FormLabel sx={{ flexGrow: 2 }}>{label}</FormLabel>

      <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("4v") }}>
        <Button onClick={() => handleChange(name, value - 1)} disabled={value === 1} priority="secondary" data-testid="-">
          <Minus />
        </Button>
        <FormLabel required={false} sx={{ minWidth: "24px", textAlign: "center" }} data-testid={`${dataTestId}-value`}>
          {value}
        </FormLabel>
        <Button onClick={() => handleChange(name, value + 1)} disabled={value === max} priority="secondary" data-testid="+">
          <Plus />
        </Button>
      </Box>
    </Box>
  )
}
