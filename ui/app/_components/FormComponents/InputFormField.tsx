"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Input } from "@codegouvfr/react-dsfr/Input"
import type { InputProps } from "@codegouvfr/react-dsfr/Input"
import type { PropsWithRef } from "react"

export function InputFormField(props: PropsWithRef<InputProps.RegularInput>) {
  return (
    <Input
      {...props}
      nativeInputProps={{
        ...props.nativeInputProps,
        style: {
          backgroundColor: fr.colors.decisions.background.default.grey.default,
          boxShadow: "none",
          border: `1px solid ${fr.colors.decisions.border.disabled.grey.default}`,
          ...props.nativeInputProps?.style,
        },
      }}
    />
  )
}
