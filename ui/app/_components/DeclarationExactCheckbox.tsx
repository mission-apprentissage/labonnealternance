import { fr } from "@codegouvfr/react-dsfr"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import { Box } from "@mui/material"
import { useField } from "formik"

/**
 * Case à cocher "je certifie l'exactitude des informations" partagée par CreationEntrepriseDetailPage
 * et DetailEntreprise (déclaration CFA sur une entreprise partenaire) : même texte, même validation
 * Yup (`isDeclarationExact: Yup.boolean().oneOf([true], ...)`) dans les deux. `name` posé nativement
 * pour que le scroll/focus de createSubmitWithFocusOnError puisse la cibler comme les autres champs.
 *
 * Composant Checkbox du DSFR plutôt que FormControlLabel/Checkbox MUI : le RGAA (11.1) exige une
 * association explicite label[for] ↔ input[id], et le message d'erreur doit être lié au champ
 * (aria-describedby) avec aria-invalid — react-dsfr gère les trois.
 */
export const DeclarationExactCheckbox = () => {
  const [field, meta] = useField("isDeclarationExact")
  const hasError = Boolean(meta.touched && meta.error)

  return (
    <Box sx={{ mt: fr.spacing("6v") }}>
      <Checkbox
        options={[
          {
            label:
              "Je certifie que les informations relatives à l’entreprise partenaire sont exactes et vérifiables, et j’accepte que ces données puissent faire l’objet de contrôles par La bonne alternance.",
            nativeInputProps: { name: "isDeclarationExact", checked: Boolean(field.value), onChange: field.onChange, onBlur: field.onBlur },
          },
        ]}
        state={hasError ? "error" : "default"}
        stateRelatedMessage={hasError ? meta.error : undefined}
      />
    </Box>
  )
}
