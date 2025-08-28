"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Link } from "@mui/material"
import Image from "next/image"
import NextLink from "next/link"

import { CandidatRechercheForm } from "@/app/(candidat)/recherche/_components/CandidatRechercheForm"
import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import type { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { PAGES } from "@/utils/routes.utils"

export function RechercheHeader(props: { rechercheParams: IRecherchePageParams }) {
  const navigateToRecherchePage = useNavigateToRecherchePage(props.rechercheParams)

  return (
    <Box
      sx={{
        boxShadow: {
          xs: 0,
          md: 2,
        },
        backgroundColor: {
          xs: fr.colors.decisions.background.alt.grey.default,
          md: fr.colors.decisions.background.default.grey.default,
        },
        zIndex: 5,
      }}
    >
      <Box
        sx={{
          padding: fr.spacing("3v"),
          maxWidth: "xl",
          margin: "auto",
          display: "flex",
          gap: {
            md: fr.spacing("4w"),
            lg: fr.spacing("8w"),
          },
          alignItems: "center",
        }}
      >
        <Link
          component={NextLink}
          sx={{
            textDecoration: "none",
          }}
          href={PAGES.static.home.getPath()}
        >
          <Image src="/images/logo-violet-seul.svg" width={40} height={44} alt="Retour page d'accueil de La bonne alternance" unoptimized />
        </Link>
        <Box sx={{ flex: 1 }}>
          <Box
            sx={{
              display: {
                xs: "none",
                md: "block",
              },
            }}
          >
            <CandidatRechercheForm {...props} />
          </Box>
          <Box
            sx={{
              display: {
                xs: "flex",
                md: "none",
                justifyContent: "flex-end",
              },
            }}
          >
            <ModifierRechercheButton onClick={() => navigateToRecherchePage({ displayMobileForm: true }, true)} />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

function ModifierRechercheButton({ onClick }: { onClick: () => void }) {
  return (
    <Button iconId="fr-icon-search-line" priority="secondary" onClick={onClick}>
      Modifier la recherche
    </Button>
  )
}
