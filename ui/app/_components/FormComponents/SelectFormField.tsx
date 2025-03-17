"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Select, SelectProps } from "@codegouvfr/react-dsfr/SelectNext"
import { useField } from "formik"
import { useStyles } from "tss-react/dsfr"

export function SelectFormField<T extends SelectProps.Option>(props: SelectProps<T[]> & { id: string }) {
  const { css } = useStyles()
  const [field, meta] = useField(props.id)

  return (
    <Select
      {...props}
      className={css({ "& select": { backgroundColor: fr.colors.decisions.background.default.grey.default, boxShadow: "none", border: "1px solid #E5E5E5" } })}
      nativeSelectProps={{ ...field, ...props.nativeSelectProps }}
      state={meta.touched && meta.error ? "error" : "default"}
      stateRelatedMessage="champ obligatoire"
    />
  )
}
