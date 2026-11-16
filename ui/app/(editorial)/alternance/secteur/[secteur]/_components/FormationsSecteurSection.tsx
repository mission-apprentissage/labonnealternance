import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import Link from "next/link"
import { SEO_METIER_FORMATION_NIVEAUX } from "shared/models/seo-metier.model"
import { seoCardSx, seoThreeColGridSx } from "@/app/(editorial)/alternance/_components/hub-styles"
import type { ISeoSecteurJson } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/secteur.types"
import { ArrowRightLine } from "@/theme/components/icons"
import { PAGES } from "@/utils/routes.utils"

// Libellés courts : les titres des pages métier (« Master, diplôme d'école de commerce… ») débordent des cartes.
const NIVEAU_COURT: Record<string, string> = {
  [SEO_METIER_FORMATION_NIVEAUX["3 (CAP...)"]]: "CAP",
  [SEO_METIER_FORMATION_NIVEAUX["4 (BAC...)"]]: "Bac",
  [SEO_METIER_FORMATION_NIVEAUX["5 (BTS, DEUST...)"]]: "Bac+2",
  [SEO_METIER_FORMATION_NIVEAUX["6 (Licence, BUT...)"]]: "Bac+3",
  [SEO_METIER_FORMATION_NIVEAUX["7 (Master, titre ingénieur...)"]]: "Bac+5",
}

type Props = Pick<ISeoSecteurJson, "secteur" | "formations_niveaux" | "formations"> & { formationsSearchUrl: string }

export function FormationsSecteurSection({ secteur, formations_niveaux, formations, formationsSearchUrl }: Props) {
  const countByNiveau = new Map((formations ?? []).map((f) => [f.niveau, f.count]))

  return (
    <Box
      sx={{
        mt: fr.spacing("10v"),
        mb: fr.spacing("8v"),
        py: fr.spacing("8v"),
        px: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
        backgroundColor: fr.colors.decisions.background.default.grey.hover,
      }}
    >
      <Typography component="h2" variant="h2" sx={{ mb: fr.spacing("4v"), color: "#161616" }}>
        Quelle formation pour une alternance en {secteur} ?
      </Typography>
      <Box aria-hidden="true" component="hr" sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: "4px solid #4B9F6C", opacity: 1 }} />
      <Box sx={seoThreeColGridSx}>
        {formations_niveaux.map((niveau) => {
          const count = countByNiveau.get(niveau.niveau)
          return (
            <Box key={niveau.niveau} sx={{ ...seoCardSx, textAlign: "center" }}>
              <Typography component="h3" sx={{ fontSize: "1.75rem", fontWeight: "bold", color: "#4B9F6C" }}>
                {NIVEAU_COURT[niveau.niveau] ?? niveau.niveau}
              </Typography>
              <Typography sx={{ my: fr.spacing("4v"), fontSize: "1.125rem", color: "#666" }}>{niveau.diplomes}</Typography>
              {count ? <Typography sx={{ fontSize: "1.375rem", fontWeight: 700 }}>{count} formations</Typography> : null}
              {niveau.diplome_slug && (
                <Link href={PAGES.dynamic.seoDiplome(niveau.diplome_slug).getPath()} className={fr.cx("fr-link")}>
                  Découvrir ce diplôme en alternance
                </Link>
              )}
            </Box>
          )
        })}
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Button linkProps={{ href: formationsSearchUrl }} size="large" priority="primary" style={{ marginTop: fr.spacing("6v") }}>
          Voir les formations en {secteur}
          <ArrowRightLine sx={{ color: "#fff", mt: fr.spacing("1v"), ml: fr.spacing("3v"), width: 16, height: 16 }} />
        </Button>
      </Box>
    </Box>
  )
}
