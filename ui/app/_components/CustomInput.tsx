import { fr } from "@codegouvfr/react-dsfr"
import { Box, FormControl, FormHelperText, FormLabel, Input, Typography } from "@mui/material"
import { useField } from "formik"
import parse from "html-react-parser"
import { BusinessErrorCodes } from "shared/constants/errorCodes"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { Warning } from "@/theme/components/icons"

const CustomInput = (props) => {
  const [field, meta] = useField(props)
  return (
    <Box pb={props.pb ?? 3} sx={props.sx ? { ...props.sx } : {}}>
      <FormControl sx={{ width: "100%" }} error={meta.error && meta.touched} required={props.required ?? true}>
        {props.label && <FormLabel error={meta.error && meta.touched}>{props.label}</FormLabel>}
        {props.info && (
          <Box className={fr.cx("fr-hint-text")} sx={{ pb: 1 }}>
            {props.info}
          </Box>
        )}
        <Input sx={{ mt: "8px !important" }} className={fr.cx("fr-input")} {...field} {...props} />
        {props.helper && <FormHelperText>{props.helper}</FormHelperText>}
        {meta.error &&
          meta.touched &&
          (meta.error === BusinessErrorCodes.NON_DIFFUSIBLE ? (
            <Box ml={1}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Warning sx={{ mr: 1 }} />
                Les informations de votre entreprise sont non diffusibles.
              </Box>
              <DsfrLink href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Espace%20pro%20-%20Donnees%20entreprise%20non%20diffusibles" external={true}>
                Contacter le support pour en savoir plus
              </DsfrLink>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box sx={{ display: "flex" }} ml={1}>
                <Typography className={fr.cx("fr-message--error")}>{parse(meta.error || "")}</Typography>
                {meta.error?.includes("déjà associé") && <DsfrLink href="/espace-pro/authentification">Connexion</DsfrLink>}
              </Box>
            </Box>
          ))}
      </FormControl>
    </Box>
  )
}

export default CustomInput
