import { Box, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, Link } from "@chakra-ui/react"
import { useField } from "formik"
import { NavLink } from "react-router-dom"
import { Warning } from "../theme/components/icons"

export default (props) => {
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
                <Link as={NavLink} to="/authentification" textColor="bluefrance.500" textDecoration="underline" ml={1}>
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
