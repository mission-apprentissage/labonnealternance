import { Box, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel } from "@chakra-ui/react"
import { FieldHookConfig, useField } from "formik"

import { Warning } from "../../theme/components/icons"

export const CustomFormControl = (props: FieldHookConfig<unknown>) => {
  const [_field, meta] = useField(props)

  return (
    <Box pb={props.pb ?? "5"}>
      <FormControl isInvalid={meta.error && meta.touched} isRequired={props.required ?? true}>
        <FormLabel>{props.label}</FormLabel>
        {props.info && <FormHelperText pb={2}>{props.info}</FormHelperText>}
        {props.children}
        {props.helper && <FormHelperText>{props.helper}</FormHelperText>}
        <FormErrorMessage>
          <Flex direction="row" alignItems="center">
            <Warning m={0} />
            <Flex ml={1}>{meta.error}</Flex>
          </Flex>
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}
