import Input from "@codegouvfr/react-dsfr/Input"
import { FormControl, FormHelperText } from "@mui/material"
import { useField } from "formik"
import parse from "html-react-parser"

const CustomDSFRInput = (props) => {
  const [field, meta] = useField(props)

  const hasError = Boolean(meta.error && meta.touched)
  const stateRelatedMessage = hasError ? { stateRelatedMessage: parse(meta.error) } : {}

  return (
    <FormControl sx={{ width: "100%" }} error={hasError} required={props.required ?? true}>
      <Input
        hintText={props.hintText || ""}
        state={hasError ? "error" : "default"}
        label={props.label}
        nativeInputProps={{ ...field, ...props.nativeInputProps, "aria-invalid": hasError }}
        {...stateRelatedMessage}
      />
      {props.helper && <FormHelperText>{props.helper}</FormHelperText>}
    </FormControl>
  )
}

export default CustomDSFRInput
