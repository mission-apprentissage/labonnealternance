import { fr } from "@codegouvfr/react-dsfr"
import { Box, FormControl, FormHelperText, FormLabel } from "@mui/material"
import { useField } from "formik"
import type { ReactNode } from "react"
import { Warning } from "@/theme/components/icons"

type CustomFormControlProps = {
  name: string
  label: ReactNode
  children: ReactNode
  /** id du champ enfant, relié au label par htmlFor (champ simple) */
  fieldId?: string
  /** ensemble de cases ou de radios : fieldset + legend (RGAA 11.5) */
  group?: boolean
  required?: boolean
  info?: ReactNode
  helper?: ReactNode
  pb?: string | number
}

export const getCustomFormControlErrorId = (fieldIdOrName: string) => `${fieldIdOrName}-error`

/**
 * En champ simple, l'appelant pose lui-même `error` et `aria-describedby` (cf. getCustomFormControlErrorId)
 * sur son champ : un TextField crée son propre contexte FormControl, l'état d'erreur du parent ne lui parvient pas.
 */
export const CustomFormControl = ({ name, label, children, fieldId, group = false, required = true, info, helper, pb }: CustomFormControlProps) => {
  const [_field, meta] = useField(name)
  const hasError = Boolean(meta.touched && meta.error)
  const baseId = fieldId ?? name
  const infoId = `${baseId}-info`
  const helperId = `${baseId}-helper`
  const errorId = getCustomFormControlErrorId(baseId)
  const groupDescribedBy = [info ? infoId : null, helper ? helperId : null, hasError ? errorId : null].filter(Boolean).join(" ") || undefined

  return (
    <Box
      sx={{
        pb: pb ?? "5",
        width: "100%",
      }}
    >
      <FormControl sx={{ width: "100%" }} required={required} error={hasError} {...(group ? { component: "fieldset" as const, "aria-describedby": groupDescribedBy } : {})}>
        {group ? (
          <FormLabel component="legend" sx={{ p: 0 }}>
            {label}
          </FormLabel>
        ) : (
          <FormLabel htmlFor={fieldId}>{label}</FormLabel>
        )}
        {info && (
          <FormHelperText id={infoId} sx={{ mx: 0, pb: "8px" }}>
            {info}
          </FormHelperText>
        )}
        {children}
        {helper && (
          <FormHelperText id={helperId} sx={{ mx: 0 }}>
            {helper}
          </FormHelperText>
        )}
        {hasError && (
          <Box
            id={errorId}
            sx={{
              pb: fr.spacing("6v"),
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Warning sx={{ m: 0 }} />
            <Box
              sx={{
                ml: fr.spacing("2v"),
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
