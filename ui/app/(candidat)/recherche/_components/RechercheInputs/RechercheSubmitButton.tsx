"use client"

import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useFormikContext } from "formik"
import React, { CSSProperties } from "react"

export function RechercheSubmitButton({ children, style, forceMobileStyle = false }: { children?: React.ReactNode; style?: CSSProperties; forceMobileStyle?: boolean }) {
  const formikContext = useFormikContext()
  const { isSubmitting, errors, touched } = formikContext

  const hasError = Object.values(errors as object).some(([key, value]) => Boolean(value) && touched[key])

  return (
    <Box
      sx={{
        fontSize: {
          xs: "18px",
          md: forceMobileStyle ? "18px" : "16px",
        },
        lineHeight: {
          xs: "28px",
          md: forceMobileStyle ? "28px" : "24px",
        },
        "& button:before": {
          ...(!children ? { marginRight: "0 !important" } : {}),
        },
      }}
    >
      <Button
        disabled={isSubmitting || hasError}
        iconPosition="left"
        type="submit"
        iconId="fr-icon-search-line"
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          fontSize: "inherit",
          lineHeight: "inherit",
          ...style,
        }}
      >
        {children}
      </Button>
    </Box>
  )
}
