import Select from "@codegouvfr/react-dsfr/Select"
import type { FormikErrors, FormikTouched } from "formik"
import type { ReactNode } from "react"
import { OPCOS_LABEL } from "shared/constants/index"

import { OPCO_SHORT_LABELS } from "@/utils/opco-labels"

interface Props {
  name: string
  onChange?: (value: OPCOS_LABEL) => void
  value: OPCOS_LABEL
  errors: FormikErrors<any>
  touched: FormikTouched<any>
  label?: string
  hint?: string
  /** Message d'information affiché sous le select tant qu'il n'est pas en erreur. */
  infoMessage?: ReactNode
}

export const OpcoSelect = ({
  name,
  onChange,
  value,
  errors,
  touched,
  label = "OPCO",
  hint = "Pour vous accompagner dans vos recrutements, votre OPCO accède à vos informations sur La bonne alternance.",
  infoMessage,
}: Props) => {
  const hasError = Boolean(errors?.[name] && touched?.[name])
  const state = hasError ? "error" : infoMessage ? "info" : "default"

  return (
    <Select
      label={label}
      hint={hint}
      // aria-invalid : cf. HandiEngagementSelect
      nativeSelectProps={{ name, value, required: true, "aria-invalid": hasError, onChange: (e) => onChange?.(e.target.value as OPCOS_LABEL) }}
      state={state}
      stateRelatedMessage={hasError ? (errors[name] as string) : infoMessage}
    >
      <option value="" hidden>
        Sélectionnez un OPCO
      </option>
      {Object.entries(OPCO_SHORT_LABELS).map(([opco, shortLabel]) => (
        <option key={opco} value={opco}>
          {shortLabel}
        </option>
      ))}
      <option value={OPCOS_LABEL.UNKNOWN_OPCO}>Je ne sais pas</option>
    </Select>
  )
}
