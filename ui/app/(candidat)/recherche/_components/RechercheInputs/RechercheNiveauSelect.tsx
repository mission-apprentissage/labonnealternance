import { useField } from "formik"

import { SelectField } from "@/app/_components/FormComponents/SelectField"
import { SelectFormField } from "@/app/_components/FormComponents/SelectFormField"

export const niveauOptions = [
  {
    value: "",
    label: "Indifférent",
  },
  {
    value: "3 (CAP...)",
    label: "Cap, autres formations niveau 3",
  },
  {
    value: "4 (BAC...)",
    label: "Bac, autres formations niveau 4",
  },
  {
    value: "5 (BTS, DEUST...)",
    label: "BTS, DEUST, autres formations niveaux 5 (Bac+2)",
  },
  {
    value: "6 (Licence, BUT...)",
    label: "Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)",
  },
  {
    value: "7 (Master, titre ingénieur...)",
    label: "Master, titre ingénieur, autres formations niveaux 7 ou 8 (Bac+5)",
  },
] satisfies Array<{ value: string; label: string; selected?: boolean }>

export function RechercheNiveauSelectForm() {
  const [field] = useField({ name: "diploma" })

  return (
    <SelectFormField
      id="diploma"
      label="Niveau d'études visé"
      style={{
        marginBottom: 0,
        textWrap: "nowrap",
      }}
      options={niveauOptions.map((option) => ({ ...option, selected: option.value === field.value }))}
    />
  )
}

export function RechercheNiveauSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
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
        onChange: (event) => onChange(event.target.value),
        style: {
          fontWeight: 700,
        },
      }}
    />
  )
}
