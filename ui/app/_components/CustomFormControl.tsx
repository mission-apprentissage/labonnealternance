import { fr } from "@codegouvfr/react-dsfr"
import { Box, FormControl, FormHelperText, FormLabel } from "@mui/material"
import { useField } from "formik"

import { Warning } from "@/theme/components/icons"

export const CustomFormControl = (props) => {
  const [_field, meta] = useField(props)

  return (
    <Box sx={{ width: "100%" }} pb={props.pb ?? fr.spacing("10v")}>
      <FormControl sx={{ width: "100%" }} required={props.required ?? true} error={meta.error && meta.touched}>
        <FormLabel>{props.label}</FormLabel>
        {props.info && <FormHelperText sx={{ pb: fr.spacing("2v") }}>{props.info}</FormHelperText>}
        {props.children}
        {props.helper && <FormHelperText>{props.helper}</FormHelperText>}
        {meta.error && (
          <Box pb={fr.spacing("6v")} sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Warning sx={{ m: 0 }} />
            <Box sx={{ display: "flex" }} ml={fr.spacing("2v")}>
              {meta.error}
            </Box>
          </Box>
        )}
      </FormControl>
    </Box>
  )
}
