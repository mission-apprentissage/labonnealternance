"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Select } from "@codegouvfr/react-dsfr/SelectNext"
import { useStyles } from "tss-react/dsfr"

export function SelectFormField(props /*SelectProps*/) {
  const { css } = useStyles()
  return (
    <Select {...props} className={css({ "& select": { backgroundColor: fr.colors.decisions.background.default.grey.default, boxShadow: "none", border: "1px solid #E5E5E5" } })} />
  )
}
