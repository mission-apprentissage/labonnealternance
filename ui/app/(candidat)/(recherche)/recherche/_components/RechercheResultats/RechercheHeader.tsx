"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Container } from "@mui/material"
import { CandidatRechercheFilters } from "@/app/(candidat)/(recherche)/recherche/_components/CandidatRechercheFilters"
import { CandidatRechercheForm } from "@/app/(candidat)/(recherche)/recherche/_components/CandidatRechercheForm"
import { useNavigateToRecherchePage } from "@/app/(candidat)/(recherche)/recherche/_hooks/useNavigateToRecherchePage"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"

export function RechercheHeader(props: { rechercheParams: IRecherchePageParams }) {
  const navigateToRecherchePage = useNavigateToRecherchePage(props.rechercheParams)

  return (
    <Container
      sx={{
        maxWidth: {
          xs: "100%",
          lg: "xl",
        },
        mt: {
          xs: 0,
          lg: fr.spacing("4v"),
        },
      }}
    >
      <Box
        sx={{
          zIndex: 5,
        }}
        display="flex"
        flexDirection="column"
        gap={fr.spacing("3v")}
      >
        <Box
          sx={{
            padding: fr.spacing("4v"),
            margin: "auto",
            display: "flex",
            gap: {
              md: fr.spacing("8v"),
              lg: fr.spacing("16v"),
            },
            alignItems: "center",
            borderRadius: fr.spacing("2v"),
            boxShadow: {
              xs: 0,
              lg: "0 6px 18px 0 rgba(0, 0, 18, 0.16);",
            },
            mx: {
              xs: 0,
              lg: "-2rem",
            },
            mt: {
              xs: 0,
              lg: fr.spacing("4v"),
            },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                display: {
                  xs: "none",
                  lg: "block",
                },
              }}
            >
              <CandidatRechercheForm {...props} />
            </Box>
            <CandidatRechercheFilters rechercheParams={props.rechercheParams} embedded />
            <Box
              sx={{
                display: {
                  xs: "flex",
                  lg: "none",
                },
                justifyContent: "flex-end",
              }}
            >
              <Button iconId="fr-icon-search-line" priority="secondary" onClick={() => navigateToRecherchePage({ displayMobileForm: true }, true)}>
                Modifier la recherche
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}
