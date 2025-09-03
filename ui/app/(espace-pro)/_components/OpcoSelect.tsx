import Select from "@codegouvfr/react-dsfr/Select"
import { FormikErrors, FormikTouched } from "formik"
import { OPCOS_LABEL } from "shared/constants/index"

interface Props {
  name: string
  onChange?: (value: OPCOS_LABEL) => void
  value: OPCOS_LABEL
  errors: FormikErrors<any>
  touched: FormikTouched<any>
}

export const OpcoSelect = ({ name, onChange, value, errors, touched }: Props) => {
  return (
    <Select
      label="OPCO"
      hint="Pour vous accompagner dans vos recrutements, votre OPCO accède à vos informations sur La bonne alternance."
      nativeSelectProps={{ name, value, required: true, onChange: (e) => onChange?.(e.target.value as OPCOS_LABEL) }}
      state={errors?.opco && touched?.opco ? "error" : "default"}
      stateRelatedMessage={errors?.opco && touched?.opco ? (errors.opco as string) : undefined}
    >
      <option hidden>Sélectionnez un OPCO</option>
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
