import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"

import { CandidatRechercheFilters } from "@/app/(candidat)/recherche/_components/CandidatRechercheFilters"
import { RechercheHeader } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheHeader"
import { RechercheMobileEmpty } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMobileEmpty"
import { RechercheMobileFormUpdate } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMobileFormUpdate"
import { RechercheResultatsPlaceholder } from "@/app/(candidat)/recherche/_components/RechercheResultatsPlaceholder"
import { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function RecherchePageEmpty(props: { rechercheParams: IRecherchePageParams }) {
  const { displayMobileForm } = props.rechercheParams

  if (displayMobileForm) {
    return <RechercheMobileFormUpdate rechercheParams={props.rechercheParams} />
  }

  return (
    <>
      <Box
        sx={{
          display: {
            xs: "block",
            md: "none",
          },
        }}
      >
        <RechercheMobileEmpty {...props} />
      </Box>
      <Box
        sx={{
          backgroundColor: fr.colors.decisions.background.alt.grey.default,
          height: "100vh",
          flexDirection: "column",
          display: {
            xs: "none",
            md: "flex",
          },
        }}
      >
        <RechercheHeader {...props} />
        <Box
          sx={{
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: {
              xs: "column",
              md: "row",
            },
          }}
        >
          <Box
            sx={{
              overflow: "auto",
              height: "100%",
              width: "100%",
              contain: "strict",
              flex: 1,
            }}
          >
            <Box
              sx={{
                maxWidth: "xl",
                width: "100%",
                position: "relative",
                margin: "auto",
              }}
            >
              <CandidatRechercheFilters rechercheParams={props.rechercheParams} />
              <RechercheResultatsPlaceholder {...props} />
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  )
}
