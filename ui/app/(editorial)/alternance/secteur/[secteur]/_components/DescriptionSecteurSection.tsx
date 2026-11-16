import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import { kpiCardSx, seoCardSx, seoH2Sx, seoHrSx, seoSectionSx, seoThreeColGridSx } from "@/app/(editorial)/alternance/_components/hub-styles"
import type { ISeoSecteurJson } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/secteur.types"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

type Props = Pick<ISeoSecteurJson, "secteur_complement" | "description" | "chiffres_cles">

// Même mise en forme que le bloc « Missions principales » de la page métier : une introduction, puis des cartes courtes.
export function DescriptionSecteurSection({ secteur_complement, description, chiffres_cles }: Props) {
  return (
    <Box sx={seoSectionSx}>
      <Typography component="h2" variant="h2" sx={seoH2Sx}>
        L'alternance dans le secteur <span style={{ color: fr.colors.decisions.text.default.info.default }}>{secteur_complement}</span>
      </Typography>
      <Box aria-hidden="true" component="hr" sx={seoHrSx} />
      <Typography sx={{ fontSize: "1.125rem", mb: fr.spacing("6v") }}>{description.intro}</Typography>

      {chiffres_cles.length > 0 && (
        <Box
          component="ul"
          sx={{
            listStyle: "none",
            pl: 0,
            display: "grid",
            gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", sm: "repeat(2, minmax(0, 1fr))", md: `repeat(${Math.min(chiffres_cles.length, 4)}, minmax(0, 1fr))` },
            gap: fr.spacing("4v"),
            mb: fr.spacing("10v"),
          }}
        >
          {chiffres_cles.map((chiffre) => (
            <Box component="li" key={chiffre.libelle} sx={kpiCardSx}>
              <Typography sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, fontWeight: 700, color: fr.colors.decisions.text.default.info.default, lineHeight: 1.1 }}>
                {chiffre.valeur}
              </Typography>
              <Typography sx={{ mt: fr.spacing("1v"), fontSize: "0.95rem", fontWeight: 700 }}>{chiffre.libelle}</Typography>
              <Typography component="span" sx={{ mt: fr.spacing("1v"), fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default, lineHeight: 1.3 }}>
                {chiffre.source_url ? <DsfrLink href={chiffre.source_url}>{chiffre.source_libelle}</DsfrLink> : chiffre.source_libelle}, {chiffre.annee}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {description.blocs.length > 0 && (
        <>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Image src="/images/seo/metier/mission.svg" alt="" aria-hidden="true" width={60} height={60} />
            <Typography component="h3" sx={{ ml: fr.spacing("4v"), fontSize: "1.25rem", fontWeight: "bold" }}>
              Ce qu'il faut savoir
            </Typography>
          </Box>
          <Box sx={seoThreeColGridSx}>
            {description.blocs.map((bloc) => (
              <Box key={bloc.titre} sx={seoCardSx}>
                <Typography component="h4" sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.background.actionHigh.blueFrance.default }}>
                  {bloc.titre}
                </Typography>
                <Typography sx={{ mt: fr.spacing("1v") }}>{bloc.texte}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}
