import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link } from "@mui/material"
import Image from "next/image"
import NextLink from "next/link"
import { Suspense } from "react"

import { CandidatRechercheFilters } from "@/app/(candidat)/recherche/_components/CandidatRechercheFilters"
import { CandidatRechercheForm } from "@/app/(candidat)/recherche/_components/CandidatRechercheForm"
import { RechercheResultats } from "@/app/(candidat)/recherche/_components/RechercheResultats"
import { RechercheResultatsPlaceholder } from "@/app/(candidat)/recherche/_components/RechercheResultatsPlaceholder"
import type { WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { PAGES } from "@/utils/routes.utils"

function RechercheHeader(props: WithRecherchePageParams) {
  return (
    <>
      <Box
        sx={{
          boxShadow: 2,
          backgroundColor: fr.colors.decisions.background.default.grey.default,
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
            <CandidatRechercheForm {...props} />
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          maxWidth: "xl",
          alignSelf: "center",
          width: "100%",
          marginTop: fr.spacing("2w"),
          marginBottom: fr.spacing("4w"),
        }}
      >
        <CandidatRechercheFilters {...props} />
      </Box>
    </>
  )
}

export function RecherchePageComponent(props: WithRecherchePageParams) {
  return (
    <Box
      sx={{
        backgroundColor: fr.colors.decisions.background.alt.grey.default,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <RechercheHeader {...props} />
      <Suspense fallback={<RechercheResultatsPlaceholder />}>
        <Box
          sx={{
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <RechercheResultats {...props} />
        </Box>
      </Suspense>
    </Box>
  )
}
