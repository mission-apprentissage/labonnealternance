"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Input, type InputProps } from "@codegouvfr/react-dsfr/Input"
import type { PropsWithRef } from "react"
import { useStyles } from "tss-react/dsfr"

export function InputFormField(props: PropsWithRef<InputProps.RegularInput>) {
  const { css } = useStyles()
  return (
    <Input {...props} className={css({ "& input": { backgroundColor: fr.colors.decisions.background.default.grey.default, boxShadow: "none", border: "1px solid #E5E5E5" } })} />
  )
}
