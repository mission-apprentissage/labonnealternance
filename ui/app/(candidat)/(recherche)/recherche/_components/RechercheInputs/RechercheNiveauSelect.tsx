import { useField } from "formik"
import { typedEntries } from "shared"
import { NIVEAUX_POUR_LBA } from "shared/constants/recruteur"
import type { IDiplomaParam } from "shared/routes/_params"

import { SelectField } from "@/app/_components/FormComponents/SelectField"

export const niveauOptions = typedEntries(NIVEAUX_POUR_LBA).map(([value, label]) => ({ value, label })) satisfies Array<{
  value: string
  label: string
  selected?: boolean
}>

export function RechercheNiveauSelectFormik() {
  const [field, meta, helper] = useField({ name: "diploma" })

  return <RechercheNiveauSelect value={field.value} onChange={async (newValue) => helper.setValue(newValue, true)} error={meta.touched && meta.error} />
}

export function RechercheNiveauSelect({ value, onChange, error }: { value: IDiplomaParam; onChange: (value: IDiplomaParam) => void; error?: string }) {
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
          const option = niveauOptions.find((option) => option.value === value)
          onChange(option?.value || null)
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
