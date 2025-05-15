import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Image, Input } from "@chakra-ui/react"
import { useField } from "formik"
import { BusinessErrorCodes } from "shared/constants/errorCodes"

import Link from "@/app/_components/Link"
import { Warning } from "@/theme/components/icons"

const CustomInput = (props) => {
  const [field, meta] = useField(props)
  return (
    <Box pb={props.pb ?? "5"}>
      <FormControl isInvalid={meta.error && meta.touched} isRequired={props.required ?? true}>
        <FormLabel _invalid={{ color: "red.500" }}>{props.label}</FormLabel>
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
              {meta.error === "Société inconnue" ? <Image src="/images/icons/crossInOctogon.svg" alt="" h="13px" aria-hidden="true" m={0} mt={1} /> : <Warning m={0} />}
              <Flex ml={1}>
                <div>{meta.error}</div>
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
