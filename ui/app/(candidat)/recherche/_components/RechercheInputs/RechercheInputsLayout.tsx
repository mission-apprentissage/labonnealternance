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
}: {
  viewTypeCheckboxs?: React.ReactNode
  metierInput?: React.ReactNode
  lieuInput?: React.ReactNode
  rayonSelect?: React.ReactNode
  niveauSelect?: React.ReactNode
  handicapCheckbox?: React.ReactNode
  submitButton?: React.ReactNode
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: {
          xs: "column",
          md: "row",
        },
        alignItems: { xs: "stretch", md: "flex-start" },
        gap: fr.spacing("2w"),
      }}
    >
      {viewTypeCheckboxs && (
        <Box
          sx={{
            marginTop: { xs: 0, md: "18px" },
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
      {submitButton && <Box sx={{ marginTop: { xs: 0, md: "32px" } }}>{submitButton}</Box>}
    </Box>
  )
}
