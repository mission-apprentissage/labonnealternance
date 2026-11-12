import Select from "@codegouvfr/react-dsfr/Select"
import type { FormikErrors, FormikTouched } from "formik"
import type { ReactNode } from "react"
import { OPCOS_LABEL } from "shared/constants/index"

export const OPCO_SHORT_LABELS: Partial<Record<OPCOS_LABEL, string>> = {
  [OPCOS_LABEL.AFDAS]: "AFDAS",
  [OPCOS_LABEL.AKTO]: "AKTO",
  [OPCOS_LABEL.ATLAS]: "ATLAS",
  [OPCOS_LABEL.CONSTRUCTYS]: "Constructys",
  [OPCOS_LABEL.OPCOMMERCE]: "L'Opcommerce",
  [OPCOS_LABEL.OCAPIAT]: "OCAPIAT",
  [OPCOS_LABEL.OPCO2I]: "Opco 2i",
  [OPCOS_LABEL.EP]: "Opco EP",
  [OPCOS_LABEL.MOBILITE]: "Opco Mobilités",
  [OPCOS_LABEL.SANTE]: "Opco Santé",
  [OPCOS_LABEL.UNIFORMATION]: "Uniformation",
}

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
