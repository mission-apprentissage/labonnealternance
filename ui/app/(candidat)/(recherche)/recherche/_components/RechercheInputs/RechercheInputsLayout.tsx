"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import React from "react"

export function RechercheInputsLayout({
  viewTypeCheckboxs,
  metierInput,
  lieuInput,
  rayonSelect,
  niveauSelect,
  handicapCheckbox,
  submitButton,
  forceMobileStyle = false,
}: {
  viewTypeCheckboxs?: React.ReactNode
  metierInput?: React.ReactNode
  lieuInput?: React.ReactNode
  rayonSelect?: React.ReactNode
  niveauSelect?: React.ReactNode
  handicapCheckbox?: React.ReactNode
  submitButton?: React.ReactNode
  forceMobileStyle?: boolean
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: {
          xs: "column",
          md: forceMobileStyle ? "column" : "row",
        },
        alignItems: {
          xs: "stretch",
          md: forceMobileStyle ? "stretch" : "flex-start",
        },
        gap: fr.spacing("4v"),
      }}
    >
      {viewTypeCheckboxs && (
        <Box
          sx={{
            marginTop: { xs: 0, md: forceMobileStyle ? 0 : "18px" },
          }}
        >
          {viewTypeCheckboxs}
        </Box>
      )}
      {metierInput && <Box sx={{ flex: 450 }}>{metierInput}</Box>}
      {lieuInput && <Box sx={{ flex: 250 }}>{lieuInput}</Box>}
      {rayonSelect}
      {niveauSelect}
      {handicapCheckbox}
      {submitButton && <Box sx={{ marginTop: { xs: 0, md: forceMobileStyle ? 0 : "32px" } }}>{submitButton}</Box>}
    </Box>
  )
}
