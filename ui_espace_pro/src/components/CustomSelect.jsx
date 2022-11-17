import { Box, FormControl, FormLabel, FormHelperText, FormErrorMessage, Select } from "@chakra-ui/react"
import { useField } from "formik"

export default (props) => {
  const [field, meta, helpers] = useField(props)
  return (
    <Box pb="5">
      <FormControl isInvalid={meta.error && meta.touched} isRequired={props.required ?? true}>
        <FormLabel>{props.label}</FormLabel>
        {props.info && <FormHelperText pb={2}>{props.info}</FormHelperText>}
        <Select {...field} {...props} onChange={(e) => helpers.setValue(e.target.value)}>
          {props.children}
        </Select>
        {props.helper && <FormHelperText>{props.helper}</FormHelperText>}
        <FormErrorMessage>{meta.error}</FormErrorMessage>
      </FormControl>
    </Box>
  )
}
