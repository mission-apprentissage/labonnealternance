import { ExternalLinkIcon } from "@chakra-ui/icons"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, FormControl, FormHelperText, FormLabel, Input, Typography } from "@mui/material"
import { useField } from "formik"
import parse from "html-react-parser"
import { BusinessErrorCodes } from "shared/constants/errorCodes"

import Link from "@/app/_components/Link"
import { Warning } from "@/theme/components/icons"

const CustomInput = (props) => {
  const [field, meta] = useField(props)
  return (
    <Box pb={props.pb ?? 3}>
      <FormControl sx={{ width: "100%" }} error={meta.error && meta.touched} required={props.required ?? true}>
        <FormLabel sx={{ fontWeight: 700 }} error={meta.error && meta.touched}>
          {props.label}
        </FormLabel>
        {props.info && <FormHelperText sx={{ pb: 1 }}>{props.info}</FormHelperText>}
        <Input className={fr.cx("fr-input")} {...field} {...props} />
        {props.helper && <FormHelperText>{props.helper}</FormHelperText>}
        {meta.error &&
          meta.touched &&
          (meta.error === BusinessErrorCodes.NON_DIFFUSIBLE ? (
            <Box ml={1}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Warning mr={1} />
                Les informations de votre entreprise sont non diffusibles.
              </Box>
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
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box sx={{ display: "flex" }} ml={1}>
                <Typography className={fr.cx("fr-message--error")}>{parse(meta.error || "")}</Typography>
                {meta.error?.includes("déjà associé") && (
                  <Link href="/espace-pro/authentification" textColor="bluefrance.500" textDecoration="underline" ml={1}>
                    Connexion
                  </Link>
                )}
              </Box>
            </Box>
          ))}
      </FormControl>
    </Box>
  )
}

export default CustomInput
