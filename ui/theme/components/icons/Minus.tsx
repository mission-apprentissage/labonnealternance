import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import React from "react"

export function Minus({ sx = {} }) {
  return <Typography sx={{ ...sx }} className={fr.cx("fr-icon-subtract-line")} />
}
