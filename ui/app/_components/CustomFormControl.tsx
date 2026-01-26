import { Box, FormControl, FormHelperText, FormLabel } from "@mui/material"
import { useField } from "formik"

import { Warning } from "@/theme/components/icons"

export const CustomFormControl = (props) => {
  const [_field, meta] = useField(props)

  return (
    <Box
      sx={{
        pb: props.pb ?? "5",
        width: "100%",
      }}
    >
      <FormControl sx={{ width: "100%" }} required={props.required ?? true} error={meta.error && meta.touched}>
        <FormLabel>{props.label}</FormLabel>
        {props.info && <FormHelperText sx={{ pb: "8px" }}>{props.info}</FormHelperText>}
        {props.children}
        {props.helper && <FormHelperText>{props.helper}</FormHelperText>}
        {meta.error && (
          <Box
            sx={{
              pb: 3,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Warning sx={{ m: 0 }} />
            <Box
              sx={{
                ml: 1,
                display: "flex",
              }}
            >
              {meta.error}
            </Box>
          </Box>
        )}
      </FormControl>
    </Box>
  )
}
