import Select from "@codegouvfr/react-dsfr/Select"
import { useField } from "formik"
import type { HandiEngagement } from "shared/models/referentiel-engagement-entreprise.model"

interface Props {
  name: string
  onChange?: (value: HandiEngagement) => void
  value: HandiEngagement | ""
  disabled?: boolean
}

export const HandiEngagementSelect = ({ name, onChange, value, disabled = false }: Props) => {
  // useField (comme CustomInput) plutôt que des props errors/touched passées manuellement : field.onBlur
  // marque le champ "touché" au blur, exactement comme un input texte — pas seulement au changement de
  // valeur — pour que "touché mais rien sélectionné" affiche bien l'erreur.
  const [field, meta] = useField(name)
  const hasError = Boolean(meta.error && meta.touched)

  return (
    <Select
      label="Valoriser mon engagement pour l’emploi des personnes en situation de handicap"
      hint="Nous transmettons vos coordonnées à France Travail pour qu'un conseiller puisse vous recontacter."
      disabled={disabled}
      // Pas de `required` natif : on ne veut pas de la bulle de validation HTML5 flottante du navigateur au
      // submit, seulement notre propre affichage d'erreur (state/stateRelatedMessage) piloté par Formik/Yup.
      // aria-required informe les technologies d'assistance du caractère obligatoire sans déclencher la validation native
      nativeSelectProps={{ name, value, "aria-required": true, onBlur: field.onBlur, onChange: (e) => onChange?.(e.target.value as HandiEngagement) }}
      state={hasError ? "error" : "default"}
      stateRelatedMessage={hasError ? meta.error : undefined}
    >
      <option value="" hidden>
        Sélectionnez une option
      </option>
      <option value="oui">Oui, je souhaite valoriser l’engagement de mon entreprise</option>
      <option value="non">Non, je ne souhaite pas m’engager</option>
    </Select>
  )
}
