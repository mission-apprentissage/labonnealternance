import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { seoHrSx } from "@/app/(editorial)/alternance/_components/hub-styles"
import type { ISeoSecteurJson } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/secteur.types"
import { TexteEmphase } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/TexteEmphase"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

type Props = Pick<ISeoSecteurJson, "secteur_complement" | "description" | "chiffres_cles">

const h3Sx = { mb: fr.spacing("4v"), fontSize: { xs: "1.25rem", md: "1.375rem" }, lineHeight: "1.75rem", fontWeight: 700 }

// Même gabarit que le bloc « La vie d'alternant » de la page ville : texte à gauche, chiffres clés à droite.
export function DescriptionSecteurSection({ secteur_complement, description, chiffres_cles }: Props) {
  return (
    <Box
      sx={{
        mb: fr.spacing("8v"),
        py: fr.spacing("8v"),
        px: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
      }}
    >
      <Typography component="h2" variant="h2" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.default.info.default }}>
        L'alternance <span style={{ color: "#161616" }}>dans le secteur {secteur_complement}</span>
      </Typography>
      <Box aria-hidden="true" component="hr" sx={seoHrSx} />

      <Box sx={{ mt: fr.spacing("6v"), display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("8v") }}>
        <Box sx={{ flex: 3 }}>
          <Typography sx={{ mb: fr.spacing("3v") }}>
            <TexteEmphase texte={description.intro} />
          </Typography>
          {description.points.length > 0 && (
            <Box component="ul" sx={{ mb: fr.spacing("3v") }}>
              {description.points.map((point, idx) => (
                // Liste statique, jamais réordonnée : l'index suffit et évite deux clés identiques.
                <li key={idx}>
                  <Typography component="span">
                    <TexteEmphase texte={point} />
                  </Typography>
                </li>
              ))}
            </Box>
          )}
          {description.conclusion && (
            <Typography>
              <TexteEmphase texte={description.conclusion} />
            </Typography>
          )}
        </Box>

        {chiffres_cles.length > 0 && (
          <Box sx={{ flex: 2 }}>
            <Typography component="h3" sx={h3Sx}>
              En chiffres :
            </Typography>
            <Box
              component="ul"
              sx={{ listStyle: "none", pl: 0, m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: fr.spacing("3v") }}
            >
              {chiffres_cles.map((chiffre) => (
                <Box
                  component="li"
                  key={chiffre.libelle}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "white",
                    p: fr.spacing("4v"),
                    borderRadius: "5px",
                    boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
                  }}
                >
                  <Typography sx={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.1, color: fr.colors.decisions.text.default.info.default }}>{chiffre.valeur}</Typography>
                  <Typography sx={{ mt: fr.spacing("2v"), fontSize: "0.875rem", fontWeight: 700, lineHeight: 1.35, flex: 1 }}>{chiffre.libelle}</Typography>
                  <Typography sx={{ mt: fr.spacing("3v"), fontSize: "0.75rem", lineHeight: 1.3, color: fr.colors.decisions.text.mention.grey.default }}>
                    Source :{" "}
                    {chiffre.source_url ? (
                      <DsfrLink href={chiffre.source_url} size="sm">
                        {chiffre.source_libelle}
                      </DsfrLink>
                    ) : (
                      chiffre.source_libelle
                    )}
                    , {chiffre.annee}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}
