import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import React from "react"

export function Plus({ sx = {} }) {
  return <Typography component="span" aria-hidden="true" sx={{ ...sx }} className={fr.cx("fr-icon-add-line")} />
}
