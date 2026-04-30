import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Link from "next/link"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { diplomeData } from "@/app/(editorial)/alternance/_components/diplome_data"
import { ArrowRightLine } from "@/theme/components/icons"
import { UTM_PARAMS } from "../_data/constants"
import { SectionTitle } from "./SectionTitle"

export function ExplorerDiplomesSection({ currentSlug }: { currentSlug: string }) {
  const autresDiplomes = diplomeData.filter((d) => d.slug !== currentSlug)

  return (
    <Box
      sx={{
        py: fr.spacing("12v"),
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
      }}
    >
      <DefaultContainer>
        <SectionTitle title="Explorez d'autres métiers" description="Découvrez les autres diplômes en alternance :" />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, columnGap: fr.spacing("6v"), rowGap: fr.spacing("2v") }}>
          {autresDiplomes.map((diplome) => (
            <Link key={diplome.slug} href={`/alternance/diplome/${diplome.slug}?${UTM_PARAMS}`} style={{ textDecoration: "none", backgroundImage: "none" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: fr.spacing("6v"),
                  backgroundColor: fr.colors.decisions.background.default.grey.default,
                  borderRadius: "5px",
                  boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
                  "&:hover": { backgroundColor: fr.colors.decisions.background.default.grey.hover },
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "20px", lineHeight: "28px", color: fr.colors.decisions.background.actionHigh.blueFrance.default }}>
                    {diplome.titre}
                  </Typography>
                  {diplome.sousTitre && (
                    <Typography sx={{ fontSize: "14px", lineHeight: "24px", color: fr.colors.decisions.text.default.grey.default }}>{diplome.sousTitre}</Typography>
                  )}
                </Box>
                <ArrowRightLine sx={{ flexShrink: 0, color: fr.colors.decisions.background.actionHigh.blueFrance.default, ml: fr.spacing("4v") }} />
              </Box>
            </Link>
          ))}
        </Box>
      </DefaultContainer>
    </Box>
  )
}
