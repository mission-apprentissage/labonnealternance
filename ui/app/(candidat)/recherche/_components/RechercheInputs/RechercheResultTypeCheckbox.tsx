import { fr } from "@codegouvfr/react-dsfr"
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox"
import { useField } from "formik"

import { UserItemTypes } from "@/app/_components/RechercheForm/RechercheForm"

export const RechercheResultTypeCheckboxForm = ({ counts }: { counts?: Partial<Record<UserItemTypes, number>> }) => {
  const [field, _meta, helper] = useField({ name: "displayedItemTypes" })
  const checkedLabels: UserItemTypes[] = field.value || []

  return <RechercheResultTypeCheckbox checked={checkedLabels} onChange={(newValues) => helper.setValue(newValues, true)} counts={counts} />
}

export const RechercheResultTypeCheckbox = ({
  checked,
  counts,
  onChange,
}: {
  counts?: Partial<Record<UserItemTypes, number>>
  checked: UserItemTypes[]
  onChange: (checked: UserItemTypes[]) => void
}) => {
  const isChecked = (label: UserItemTypes) => checked.includes(label)

  const toggleValue = (label: UserItemTypes, wasChecked: boolean) => {
    const newCheckedLabels = wasChecked ? checked.filter((labelIte) => labelIte !== label) : [...checked, label]
    onChange(newCheckedLabels)
  }

  return (
    <Checkbox
      classes={{
        root: fr.cx("fr-m-0", "fr-p-0"),
        content: fr.cx("fr-m-0", "fr-p-0"),
      }}
      disabled={false}
      options={Object.values(UserItemTypes).map((label) => {
        const checked = isChecked(label)
        const count = counts?.[label]
        return {
          label: `${label}${count === undefined ? "" : ` (${count})`}`,
          nativeInputProps: {
            checked,
            onChange: () => toggleValue(label, checked),
            name: label,
          },
        }
      })}
      orientation="horizontal"
      small
    />
  )
}
