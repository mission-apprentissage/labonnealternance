import Input from "@codegouvfr/react-dsfr/Input"
import { FormControl, FormHelperText } from "@mui/material"
import { useField } from "formik"
import parse from "html-react-parser"

/**
 * `errorMessage` affiche une erreur qui ne vient pas de la validation Formik (réponse serveur) avec le même
 * rendu et la même liaison au champ, tant que la valeur saisie passe la validation.
 */
const CustomDSFRInput = (props) => {
  const [field, meta] = useField(props)

  const errorMessage = meta.error && meta.touched ? parse(meta.error) : props.errorMessage
  const hasError = Boolean(errorMessage)

  return (
    <FormControl sx={{ width: "100%" }} error={hasError} required={props.required ?? true}>
      <Input
        hintText={props.hintText || ""}
        state={hasError ? "error" : "default"}
        label={props.label}
        nativeInputProps={{ ...field, ...props.nativeInputProps, "aria-invalid": hasError }}
        {...(hasError ? { stateRelatedMessage: errorMessage } : {})}
      />
      {props.helper && <FormHelperText>{props.helper}</FormHelperText>}
    </FormControl>
  )
}

export default CustomDSFRInput
