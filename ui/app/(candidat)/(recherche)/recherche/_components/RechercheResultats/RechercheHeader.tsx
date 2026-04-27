"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container } from "@mui/material"
import { CandidatRechercheFilters } from "@/app/(candidat)/(recherche)/recherche/_components/CandidatRechercheFilters"
import { CandidatRechercheForm } from "@/app/(candidat)/(recherche)/recherche/_components/CandidatRechercheForm"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"

export function RechercheHeader(props: { rechercheParams: IRecherchePageParams; fullWidth?: boolean }) {
  const { rechercheParams, fullWidth } = props
  return (
    <Box
      sx={{
        ...(fullWidth
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              backgroundColor: "white",
              filter: "drop-shadow(0px 4px 4px rgba(213, 213, 213, 0.25))",
              boxShadow: "0 4px 12px 0 rgba(0, 0, 18, 0.16)",
            }
          : {}),
      }}
    >
      <Container
        maxWidth="xl"
        sx={
          fullWidth
            ? { px: fr.spacing("4v") }
            : {
                maxWidth: "xl",
                mt: fr.spacing("4v"),
                px: fr.spacing("4v"),
              }
        }
      >
        <Box
          sx={{
            margin: "auto",
            display: "flex",
            gap: fr.spacing("16v"),
            alignItems: "center",
            backgroundColor: "white",
            ...(fullWidth
              ? {
                  padding: fr.spacing("4v"),
                }
              : {
                  padding: fr.spacing("4v"),
                  borderRadius: fr.spacing("2v"),
                  boxShadow: "0 6px 18px 0 rgba(0, 0, 18, 0.16)",
                  mx: {
                    xl: "-2rem",
                    lg: 0,
                  },
                  mt: fr.spacing("4v"),
                }),
          }}
        >
          <Box sx={{ flex: 1 }}>
            <CandidatRechercheForm rechercheParams={rechercheParams} />
            <CandidatRechercheFilters rechercheParams={rechercheParams} embedded />
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
