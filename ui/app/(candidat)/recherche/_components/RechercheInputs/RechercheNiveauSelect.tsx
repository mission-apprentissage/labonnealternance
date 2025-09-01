import { useField } from "formik"
import { NIVEAUX_DIPLOMES_EUROPEENS } from "shared/models/jobsPartners.model"

import { SelectField } from "@/app/_components/FormComponents/SelectField"

export const niveauOptions = [
  {
    value: "",
    label: "Indifférent",
  },
  ...NIVEAUX_DIPLOMES_EUROPEENS,
] satisfies Array<{ value: string; label: string; selected?: boolean }>

export function RechercheNiveauSelectFormik() {
  const [field, meta, helper] = useField({ name: "diploma" })

  return <RechercheNiveauSelect value={field.value} onChange={(newValue) => helper.setValue(newValue, true)} error={meta.touched && meta.error} />
}

export function RechercheNiveauSelect({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <SelectField
      id="diploma"
      label="Niveau d'études visé"
      style={{
        marginBottom: 0,
        textWrap: "nowrap",
        maxWidth: "280px",
      }}
      options={niveauOptions.map((option) => ({ ...option, selected: option.value === value }))}
      nativeSelectProps={{
        value: value ?? undefined,
        onChange: (event) => {
          const { value } = event.target
          onChange(value)
        },
        style: {
          fontWeight: 700,
        },
      }}
      state={error ? "error" : "default"}
      stateRelatedMessage={error}
    />
  )
}
