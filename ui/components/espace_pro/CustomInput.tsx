import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input } from "@chakra-ui/react"
import { useField } from "formik"
import { BusinessErrorCodes } from "shared/constants/errorCodes"

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
          {meta.error === BusinessErrorCodes.NON_DIFFUSIBLE ? (
            <Box ml={1}>
              <Flex alignItems="center">
                <Warning mr={1} />
                Les informations de votre entreprise sont non diffusibles.
              </Flex>
              <Link
                href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Espace%20pro%20-%20Donnees%20entreprise%20non%20diffusibles"
                title="contacter l'équipe labonnealternance - nouvelle fenêtre"
                target="_blank"
                textColor="bluefrance.500"
                textDecoration="underline"
              >
                Contacter le support pour en savoir plus <ExternalLinkIcon mx="2px" />
              </Link>
            </Box>
          ) : (
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
          )}
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default CustomInput
