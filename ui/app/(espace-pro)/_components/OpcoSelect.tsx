import Select from "@codegouvfr/react-dsfr/Select"
import type { FormikErrors, FormikTouched } from "formik"
import { OPCOS_LABEL } from "shared/constants/index"

interface Props {
  name: string
  onChange?: (value: OPCOS_LABEL) => void
  value: OPCOS_LABEL
  errors: FormikErrors<any>
  touched: FormikTouched<any>
}

export const OpcoSelect = ({ name, onChange, value, errors, touched }: Props) => {
  const hasError = Boolean(errors?.[name] && touched?.[name])

  return (
    <Select
      label="OPCO"
      hint="Pour vous accompagner dans vos recrutements, votre OPCO accède à vos informations sur La bonne alternance."
      // aria-invalid : cf. HandiEngagementSelect
      nativeSelectProps={{ name, value, required: true, "aria-invalid": hasError, onChange: (e) => onChange?.(e.target.value as OPCOS_LABEL) }}
      state={hasError ? "error" : "default"}
      stateRelatedMessage={hasError ? (errors[name] as string) : undefined}
    >
      <option value="" hidden>
        Sélectionnez un OPCO
      </option>
      <option value={OPCOS_LABEL.AFDAS}>AFDAS</option>
      <option value={OPCOS_LABEL.AKTO}>AKTO</option>
      <option value={OPCOS_LABEL.ATLAS}>ATLAS</option>
      <option value={OPCOS_LABEL.CONSTRUCTYS}>Constructys</option>
      <option value={OPCOS_LABEL.OPCOMMERCE}>L'Opcommerce</option>
      <option value={OPCOS_LABEL.OCAPIAT}>OCAPIAT</option>
      <option value={OPCOS_LABEL.OPCO2I}>Opco 2i</option>
      <option value={OPCOS_LABEL.EP}>Opco EP</option>
      <option value={OPCOS_LABEL.MOBILITE}>Opco Mobilités</option>
      <option value={OPCOS_LABEL.SANTE}>Opco Santé</option>
      <option value={OPCOS_LABEL.UNIFORMATION}>Uniformation</option>
      <option value={OPCOS_LABEL.UNKNOWN_OPCO}>Je ne sais pas</option>
    </Select>
  )
}
