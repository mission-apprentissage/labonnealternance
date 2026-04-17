"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Container } from "@mui/material"
import { CandidatRechercheFilters } from "@/app/(candidat)/(recherche)/recherche/_components/CandidatRechercheFilters"
import { CandidatRechercheForm } from "@/app/(candidat)/(recherche)/recherche/_components/CandidatRechercheForm"
import { useNavigateToRecherchePage } from "@/app/(candidat)/(recherche)/recherche/_hooks/useNavigateToRecherchePage"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"

export function RechercheHeader(props: { rechercheParams: IRecherchePageParams; fullWidth?: boolean }) {
  const { rechercheParams, fullWidth } = props
  const navigateToRecherchePage = useNavigateToRecherchePage(rechercheParams)
  return (
    <Box
      sx={
        fullWidth
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
          : undefined
      }
    >
      <Container
        maxWidth="xl"
        sx={
          props.fullWidth
            ? { px: { xs: 0, lg: fr.spacing("4v") } }
            : {
                maxWidth: {
                  xs: "100%",
                  lg: "xl",
                },
                mt: {
                  xs: 0,
                  lg: fr.spacing("4v"),
                },
              }
        }
      >
        <Box
          sx={{
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            gap: fr.spacing("3v"),
          }}
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
              ...(props.fullWidth
                ? {}
                : {
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
                  }),
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: {
                  md: fr.spacing("8v"),
                  lg: fr.spacing("16v"),
                },
                alignItems: "center",
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
                  <CandidatRechercheForm rechercheParams={rechercheParams} />
                </Box>
                <CandidatRechercheFilters rechercheParams={rechercheParams} embedded />
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
        </Box>
      </Container>
    </Box>
  )
}
