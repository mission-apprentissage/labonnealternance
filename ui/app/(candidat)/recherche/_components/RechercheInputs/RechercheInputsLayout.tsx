"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"

export function RechercheInputsLayout({
  viewTypeCheckboxs,
  metierInput,
  lieuInput,
  rayonSelect,
  niveauSelect,
  submitButton,
}: {
  viewTypeCheckboxs?: React.ReactNode
  metierInput?: React.ReactNode
  lieuInput?: React.ReactNode
  rayonSelect?: React.ReactNode
  niveauSelect?: React.ReactNode
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
            minWidth: "170px",
            "& .fr-fieldset__content": {
              display: "flex",
              flexDirection: { xs: "row", md: "column" },
              gap: fr.spacing("1w"),

              "& .fr-checkbox-group": {
                marginTop: "-0.75rem",
                marginBottom: "-0.75rem",
              },
            },
          }}
        >
          {viewTypeCheckboxs}
        </Box>
      )}
      {metierInput && <Box sx={{ flex: 450 }}>{metierInput}</Box>}
      {lieuInput && <Box sx={{ flex: 250 }}>{lieuInput}</Box>}
      {rayonSelect}
      {niveauSelect}
      {submitButton && <Box sx={{ marginTop: { xs: 0, md: "32px" } }}>{submitButton}</Box>}
    </Box>
  )
}
