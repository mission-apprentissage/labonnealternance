import { fr } from "@codegouvfr/react-dsfr"
import { Checkbox, FormControl, FormControlLabel, FormHelperText, Typography } from "@mui/material"
import { useField } from "formik"

/**
 * Case à cocher "je certifie l'exactitude des informations" partagée par CreationEntrepriseDetailPage
 * et DetailEntreprise (déclaration CFA sur une entreprise partenaire) : même texte, même validation
 * Yup (`isDeclarationExact: Yup.boolean().oneOf([true], ...)`) dans les deux. `name` posé nativement
 * pour que le scroll/focus de createSubmitWithFocusOnError puisse la cibler comme les autres champs.
 */
export const DeclarationExactCheckbox = () => {
  const [field, meta] = useField("isDeclarationExact")
  const hasError = Boolean(meta.touched && meta.error)

  return (
    <FormControl error={hasError}>
      <FormControlLabel
        control={<Checkbox name="isDeclarationExact" checked={Boolean(field.value)} onChange={field.onChange} />}
        label={
          <Typography>
            Je certifie que les informations relatives à l’entreprise partenaire sont exactes et vérifiables, et j’accepte que ces données puissent faire l’objet de contrôles par
            La bonne alternance.
          </Typography>
        }
        sx={{ alignItems: "flex-start", mt: fr.spacing("6v") }}
      />
      {hasError && (
        <FormHelperText className={fr.cx("fr-message--error")} sx={{ ml: 0 }}>
          {meta.error}
        </FormHelperText>
      )}
    </FormControl>
  )
}
