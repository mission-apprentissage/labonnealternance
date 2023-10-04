import { Box, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input } from "@chakra-ui/react"
import { useField } from "formik"

import { Warning } from "../../theme/components/icons"
import Link from "../Link"

export const CustomInput = (props) => {
  const [field, meta] = useField(props)

  return (
    <Box pb={props.pb ?? "5"}>
      <FormControl isInvalid={meta.error && meta.touched} isRequired={props.required ?? true}>
        <FormLabel>{props.label}</FormLabel>
        {props.info && <FormHelperText pb={2}>{props.info}</FormHelperText>}
        <Input {...field} {...props} />
        {props.helper && <FormHelperText>{props.helper}</FormHelperText>}
        <FormErrorMessage>
          <Flex direction="row" alignItems="center">
            <Warning m={0} />
            <Flex ml={1}>
              <div dangerouslySetInnerHTML={{ __html: meta.error }} />
              {meta.error?.includes("déjà associé") && (
                <Link href="/espace-pro/authentification" textColor="bluefrance.500" textDecoration="underline" ml={1}>
                  Connexion
                </Link>
              )}
            </Flex>
          </Flex>
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default CustomInput
