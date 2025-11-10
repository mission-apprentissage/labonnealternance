"use client"
import { fr } from "@codegouvfr/react-dsfr"
import type { SelectProps } from "@codegouvfr/react-dsfr/SelectNext"
import { Select } from "@codegouvfr/react-dsfr/SelectNext"
import { useField } from "formik"

export function SelectFormField<T extends SelectProps.Option>(props: SelectProps<T[]> & { id: string }) {
  const [field, meta] = useField(props.id)

  return (
    <Select
      {...props}
      nativeSelectProps={{
        ...field,
        ...props.nativeSelectProps,
        style: {
          backgroundColor: fr.colors.decisions.background.default.grey.default,
          boxShadow: "none",
          border: "1px solid #E5E5E5",
          ...props.nativeSelectProps?.style,
        },
      }}
      state={meta.touched && meta.error ? "error" : "default"}
      stateRelatedMessage="champ obligatoire"
    />
  )
}
