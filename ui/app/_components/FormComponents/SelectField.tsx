"use client"
import { fr } from "@codegouvfr/react-dsfr"
import type { SelectProps } from "@codegouvfr/react-dsfr/SelectNext"
import { Select } from "@codegouvfr/react-dsfr/SelectNext"

export function SelectField<T extends SelectProps.Option>(props: SelectProps<T[]> & { id: string }) {
  return (
    <Select
      {...props}
      nativeSelectProps={{
        ...props.nativeSelectProps,
        style: {
          backgroundColor: fr.colors.decisions.background.default.grey.default,
          boxShadow: "none",
          border: "1px solid #E5E5E5",
          ...props.nativeSelectProps?.style,
        },
      }}
    />
  )
}
