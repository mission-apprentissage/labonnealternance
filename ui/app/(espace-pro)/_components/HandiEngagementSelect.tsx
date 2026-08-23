import Select from "@codegouvfr/react-dsfr/Select"
import type { FormikErrors, FormikTouched } from "formik"
import type { HandiEngagement } from "shared/models/referentiel-engagement-entreprise.model"

interface Props {
  name: string
  onChange?: (value: HandiEngagement) => void
  value: HandiEngagement | ""
  errors: FormikErrors<any>
  touched: FormikTouched<any>
  disabled?: boolean
}

export const HandiEngagementSelect = ({ name, onChange, value, errors, touched, disabled = false }: Props) => {
  return (
    <Select
      label="Valoriser mon engagement pour l’emploi des personnes en situation de handicap"
      hint="Nous transmettons vos coordonnées à France Travail pour qu'un conseiller puisse vous recontacter."
      nativeSelectProps={{ name, value, required: true, disabled, onChange: (e) => onChange?.(e.target.value as HandiEngagement) }}
      state={errors?.handiEngagement && touched?.handiEngagement ? "error" : "default"}
      stateRelatedMessage={errors?.handiEngagement && touched?.handiEngagement ? (errors.handiEngagement as string) : undefined}
    >
      <option value="" hidden>
        Sélectionnez une option
      </option>
      <option value="oui">Oui, je souhaite valoriser l’engagement de mon entreprise</option>
      <option value="non">Non, je ne souhaite pas m’engager</option>
    </Select>
  )
}
