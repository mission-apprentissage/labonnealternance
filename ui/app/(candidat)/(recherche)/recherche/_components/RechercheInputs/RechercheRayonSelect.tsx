import { useField } from "formik"

import { SelectField } from "@/app/_components/FormComponents/SelectField"

export const RADIUS_OPTIONS_VALUES = [10, 30, 60, 100]

export const radiusOptions = RADIUS_OPTIONS_VALUES.map((value) => ({ label: `${value} km`, value: value.toString() })) satisfies Array<{
  value: string
  label: string
  selected?: boolean
}>

export function RechercheRayonSelectFormik() {
  const [field, meta, helper] = useField({ name: "radius" })

  return <RechercheRayonSelect value={field.value} onChange={(newValue) => helper.setValue(newValue.toString(), true)} error={meta.touched && meta.error} />
}

export function RechercheRayonSelect({ value, onChange, error }: { value: number; onChange: (value: number) => void; error?: string }) {
  const valueString: string | undefined = value?.toString() ?? undefined
  return (
    <SelectField
      id="radius"
      label="Rayon"
      style={{
        marginBottom: 0,
        maxWidth: "120px",
      }}
      options={radiusOptions.map((option) => ({ ...option, selected: option.value === valueString }))}
      nativeSelectProps={{
        value: valueString,
        onChange: (event) => {
          const { value } = event.target
          onChange(parseInt(value, 10))
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
