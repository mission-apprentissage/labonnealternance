import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link } from "@mui/material"
import Image from "next/image"
import NextLink from "next/link"
import { Suspense } from "react"

import { CandidatRechercheFilters } from "@/app/(candidat)/recherche/_components/CandidatRechercheFilters"
import { CandidatRechercheForm } from "@/app/(candidat)/recherche/_components/CandidatRechercheForm"
import { RechercheResulats } from "@/app/(candidat)/recherche/_components/RechercheResulats"
import { RechercheResultatsPlaceholder } from "@/app/(candidat)/recherche/_components/RechercheResultatsPlaceholder"
import type { WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { PAGES } from "@/utils/routes.utils"

function RechercheHeader(props: WithRecherchePageParams) {
  return (
    <Box
      sx={{
        boxShadow: 2,
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        zIndex: 5,
      }}
    >
      <Box
        sx={{
          p: fr.spacing("3v"),
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "max-content 1fr",
          },
          gap: fr.spacing("4w"),
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "xl",
          margin: "auto",
        }}
      >
        <Box
          sx={{
            display: {
              xs: "none",
              lg: "block",
            },
            alignSelf: "start",
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
        </Box>
        <Box>
          <CandidatRechercheForm {...props} />
          <CandidatRechercheFilters {...props} />
        </Box>
      </Box>
    </Box>
  )
}

export function RecherchePageComponent(props: WithRecherchePageParams) {
  return (
    <Box
      sx={{
        backgroundColor: fr.colors.decisions.background.alt.grey.default,
        height: "100vh",
        gridTemplateRows: "min-content 1fr",
        display: "grid",
      }}
    >
      <RechercheHeader {...props} />
      <Suspense fallback={<RechercheResultatsPlaceholder />}>
        <RechercheResulats {...props} />
      </Suspense>
    </Box>
  )
}
