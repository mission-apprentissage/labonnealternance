"use client"

import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useFormikContext } from "formik"
import React from "react"

const iconOnlyStyle = {
  '& button[type="submit"]': {
    marginRight: 0,
  },
}

export function RechercheSubmitButton({ children }: { children?: React.ReactNode }) {
  const formikContext = useFormikContext()
  const { isSubmitting, errors, touched } = formikContext

  const hasError = Object.values(errors as object).some(([key, value]) => Boolean(value) && touched[key])

  return (
    <Box
      sx={{
        whiteSpace: "nowrap",
        alignSelf: "end",
        ...(children ? {} : iconOnlyStyle),
      }}
    >
      <Button disabled={isSubmitting || hasError} iconPosition="left" type="submit" iconId="fr-icon-search-line">
        {children}
      </Button>
    </Box>
  )
}
