import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { kpiCardSx, seoH2Sx, seoHrSx, seoSectionSx } from "@/app/(editorial)/alternance/_components/hub-styles"
import type { ISeoSecteurJson } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/secteur.types"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

type Props = Pick<ISeoSecteurJson, "secteur_complement" | "description" | "chiffres_cles">

export function DescriptionSecteurSection({ secteur_complement, description, chiffres_cles }: Props) {
  return (
    <Box sx={seoSectionSx}>
      <Typography component="h2" variant="h2" sx={seoH2Sx}>
        L'alternance dans le secteur <span style={{ color: fr.colors.decisions.text.default.info.default }}>{secteur_complement}</span>
      </Typography>
      <Box aria-hidden="true" component="hr" sx={seoHrSx} />

      {chiffres_cles.length > 0 && (
        <Box
          component="ul"
          sx={{
            listStyle: "none",
            pl: 0,
            display: "grid",
            gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", sm: "repeat(2, minmax(0, 1fr))", md: `repeat(${Math.min(chiffres_cles.length, 4)}, minmax(0, 1fr))` },
            gap: fr.spacing("4v"),
            my: fr.spacing("6v"),
          }}
        >
          {chiffres_cles.map((chiffre) => (
            <Box component="li" key={chiffre.libelle} sx={kpiCardSx}>
              <Typography sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, fontWeight: 700, color: fr.colors.decisions.text.default.info.default, lineHeight: 1.1 }}>
                {chiffre.valeur}
              </Typography>
              <Typography sx={{ mt: fr.spacing("1v"), fontSize: "0.95rem", fontWeight: 700 }}>{chiffre.libelle}</Typography>
              <Typography component="span" sx={{ mt: fr.spacing("1v"), fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default, lineHeight: 1.3 }}>
                Source : {chiffre.source_url ? <DsfrLink href={chiffre.source_url}>{chiffre.source_libelle}</DsfrLink> : chiffre.source_libelle} ({chiffre.annee})
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {description.map((paragraphe) => (
        <Typography key={paragraphe.slice(0, 40)} sx={{ mb: fr.spacing("3v") }}>
          {paragraphe}
        </Typography>
      ))}
    </Box>
  )
}
