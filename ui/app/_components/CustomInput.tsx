import { fr } from "@codegouvfr/react-dsfr"
import { Box, FormControl, FormHelperText, FormLabel, Input, Typography } from "@mui/material"
import { useField } from "formik"
import parse from "html-react-parser"
import { BusinessErrorCodes } from "shared/constants/errorCodes"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { publicConfig } from "@/config.public"
import { Warning } from "@/theme/components/icons"

const CustomInput = (props) => {
  const [field, meta] = useField(props)
  return (
    <Box
      sx={[
        {
          pb: props.pb ?? 3,
        },
        props.sx ? { ...props.sx } : {},
      ]}
    >
      <FormControl sx={{ width: "100%" }} error={meta.error && meta.touched} required={props.required ?? true}>
        {props.label && <FormLabel error={meta.error && meta.touched}>{props.label}</FormLabel>}
        {props.info && (
          <Box className={fr.cx("fr-hint-text")} sx={{ pt: fr.spacing("2v") }}>
            {props.info}
          </Box>
        )}
        <Input sx={{ mt: "8px !important" }} className={fr.cx("fr-input")} {...field} {...props} />
        {props.helper && <FormHelperText>{props.helper}</FormHelperText>}
        {meta.error &&
          meta.touched &&
          (meta.error === BusinessErrorCodes.NON_DIFFUSIBLE ? (
            <Box
              sx={{
                ml: fr.spacing("2v"),
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Warning sx={{ mr: fr.spacing("2v") }} />
                <Typography sx={{ color: fr.colors.decisions.text.actionHigh.redMarianne.default }}>Les informations de votre entreprise sont non diffusibles.</Typography>
              </Box>
              <DsfrLink href={`mailto:${publicConfig.publicEmail}?subject=Espace%20pro%20-%20Donnees%20entreprise%20non%20diffusibles`} external={true}>
                Contacter le support pour en savoir plus
              </DsfrLink>
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: fr.spacing("2v"), alignItems: "flex-start" }}>
              <Typography className={fr.cx("fr-message--error")}>
                {parse(meta.error || "")}
                {meta.error?.includes("a été refusé") && (
                  <Typography component="span" sx={{ color: `${fr.colors.decisions.text.actionHigh.blueFrance.default} !important` }}>
                    {" "}
                    <a href={`mailto:${publicConfig.publicEmail}?subject=Espace%20pro%20-%20Acces%20entreprise%20refusé`}>{publicConfig.publicEmail}</a>
                  </Typography>
                )}
              </Typography>
              {meta.error?.includes("déjà associé") && <DsfrLink href="/espace-pro/authentification">Connexion</DsfrLink>}
            </Box>
          ))}
      </FormControl>
    </Box>
  )
}

export default CustomInput
