import Input from "@codegouvfr/react-dsfr/Input"
import { FormControl, FormHelperText } from "@mui/material"
import { useField } from "formik"
import parse from "html-react-parser"

const CustomDSFRInput = (props) => {
  const [field, meta] = useField(props)

  const stateRelatedMessage = meta.error && meta.touched ? { stateRelatedMessage: parse(meta.error) } : {}

  return (
    <FormControl sx={{ width: "100%" }} error={meta.error && meta.touched} required={props.required ?? true}>
      <Input
        hintText={props.hintText || ""}
        state={meta.error && meta.touched ? "error" : "default"}
        label={props.label}
        nativeInputProps={{ ...field, ...props.nativeInputProps }}
        {...stateRelatedMessage}
      />
      {props.helper && <FormHelperText>{props.helper}</FormHelperText>}
    </FormControl>
  )
}

export default CustomDSFRInput
