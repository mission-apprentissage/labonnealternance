import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Link from "next/link"
import { buildSearchUrl } from "@/app/(candidat)/(recherche)/recherche/_utils/search.params.utils"
import { cardLinkStyle, formatNumber, seoCardSx, seoH2Sx, seoHrSx, seoSectionSx, seoThreeColGridSx } from "@/app/(editorial)/alternance/_components/hub-styles"
import type { ISeoSecteurJson } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/secteur.types"
import { ArrowRightLine } from "@/theme/components/icons"
import { PAGES } from "@/utils/routes.utils"

type Props = Pick<ISeoSecteurJson, "secteur" | "metiers" | "metiers_counts"> & { utmParams: string }

export function MetiersSecteurSection({ secteur, metiers, metiers_counts, utmParams }: Props) {
  const countByLibelle = new Map((metiers_counts ?? []).map((m) => [m.libelle, m.job_count]))
  const sorted = [...metiers].sort((a, b) => (countByLibelle.get(b.libelle) ?? 0) - (countByLibelle.get(a.libelle) ?? 0))

  return (
    <Box sx={seoSectionSx}>
      <Typography component="h2" variant="h2" sx={seoH2Sx}>
        Quels métiers en alternance en <span style={{ color: fr.colors.decisions.text.default.info.default }}>{secteur}</span> ?
      </Typography>
      <Box aria-hidden="true" component="hr" sx={seoHrSx} />
      <Box sx={seoThreeColGridSx}>
        {sorted.map((metier) => {
          const jobCount = countByLibelle.get(metier.libelle)
          // Maillage interne : page métier si elle existe, sinon recherche préremplie avec le libellé étudiant.
          const href = metier.metier_slug
            ? `${PAGES.dynamic.seoMetier(metier.metier_slug).getPath()}?${utmParams}`
            : `${buildSearchUrl({ mode: "emplois", q: metier.libelle, is_algo_company: [false], radius: 30, page: 0, hitsPerPage: 20 })}&${utmParams}`
          return (
            <Link key={metier.libelle} href={href} style={cardLinkStyle}>
              <Box
                sx={{
                  ...seoCardSx,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  ":hover": { backgroundColor: fr.colors.decisions.background.alt.blueFrance.default },
                }}
              >
                <Typography component="h3" sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.background.actionHigh.blueFrance.default }}>
                  {metier.libelle}
                </Typography>
                <Typography sx={{ mt: fr.spacing("2v"), flex: 1 }}>{metier.description}</Typography>
                <Typography sx={{ mt: fr.spacing("3v"), fontSize: "0.875rem", color: fr.colors.decisions.text.mention.grey.default }}>
                  Niveau d'accès : {metier.niveau_acces}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: fr.spacing("2v") }}>
                  <Typography sx={{ flex: 1, fontWeight: "bold" }}>{jobCount !== undefined ? `${formatNumber(jobCount)} offres` : "Voir les offres"}</Typography>
                  <ArrowRightLine sx={{ color: fr.colors.decisions.background.actionHigh.blueFrance.default, width: 16, height: 16 }} />
                </Box>
              </Box>
            </Link>
          )
        })}
      </Box>
    </Box>
  )
}
