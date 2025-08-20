import { useField } from "formik"

import { SelectField } from "@/app/_components/FormComponents/SelectField"
import { SelectFormField } from "@/app/_components/FormComponents/SelectFormField"

export const RADIUS_OPTIONS_VALUES = [10, 30, 60, 100]

export const radiusOptions = RADIUS_OPTIONS_VALUES.map((value) => ({ label: `${value} km`, value: value.toString() })) satisfies Array<{
  value: string
  label: string
  selected?: boolean
}>

export function RechercheRayonSelectFormik() {
  const [field] = useField({ name: "radius" })

  return (
    <SelectFormField
      id="radius"
      label="Rayon"
      style={{
        marginBottom: 0,
      }}
      options={radiusOptions.map((option) => ({ ...option, selected: option.value === field.value }))}
    />
  )
}

export function RechercheRayonSelect({ value, onChange }: { value: number; onChange: (value: number) => void }) {
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
        onChange: (event) => onChange(parseInt(event.target.value, 10)),
        style: {
          fontWeight: 700,
        },
      }}
    />
  )
}
