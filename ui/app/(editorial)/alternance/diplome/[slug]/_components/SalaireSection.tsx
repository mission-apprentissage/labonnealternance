import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import type { IDiplomeSalaireLigne } from "shared/models/seoDiplome.model"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { UTM_PARAMS } from "../_data/constants"
import { SectionTitle } from "./SectionTitle"

export function SalaireSection({ titre, lignes }: { titre: string; lignes: IDiplomeSalaireLigne[] }) {
  const title = "Le salaire en"
  const titleHighlight = titre
  const titleSuffix = "en alternance"
  const texteIntro = "Grille de salaire sur la base des contrats en apprentissage en France sur l'année 2024/2025 :"
  const headerSx = {
    fontWeight: 700,
    px: fr.spacing("4v"),
    py: fr.spacing("2v"),
    backgroundColor: "#F6F6F6",
    borderBottom: "1px solid #3A3A3A",
    fontSize: "14px",
    lineHeight: "24px",
    color: fr.colors.decisions.text.default.grey.default,
  }

  const cellSx = {
    px: fr.spacing("4v"),
    py: fr.spacing("2v"),
    borderBottom: "1px solid #929292",
    fontSize: "14px",
    lineHeight: "24px",
    color: fr.colors.decisions.text.default.grey.default,
  }

  return (
    <Box
      sx={{
        py: fr.spacing("12v"),
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
      }}
    >
      <DefaultContainer>
        <SectionTitle title={title} highlightedText={titleHighlight} highlightedSuffix={titleSuffix} />
        <Typography sx={{ fontWeight: 700, fontSize: "22px", lineHeight: "28px", mb: fr.spacing("6v"), color: fr.colors.decisions.text.title.grey.default }}>
          {texteIntro}
        </Typography>

        <Box sx={{ overflowX: "auto", mb: fr.spacing("8v") }}>
          <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: "500px", border: "1px solid #929292" }}>
            <thead>
              <tr>
                <Box component="th" sx={{ ...headerSx, textAlign: "left" }}>
                  Âge
                </Box>
                <Box component="th" sx={{ ...headerSx, textAlign: "left" }}>
                  1ère année
                </Box>
                <Box component="th" sx={{ ...headerSx, textAlign: "left" }}>
                  2ème année
                </Box>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne) => (
                <tr key={ligne.age}>
                  <Box component="td" sx={cellSx}>
                    {ligne.age}
                  </Box>
                  <Box component="td" sx={cellSx}>
                    {ligne.premiereAnnee}
                  </Box>
                  <Box component="td" sx={cellSx}>
                    {ligne.deuxiemeAnnee}
                  </Box>
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>

        <Box sx={{ textAlign: "center" }}>
          <Button
            title="Accéder au simulateur de salaire pour calculer ma rémunération en alternance"
            priority="secondary"
            size="large"
            iconId="fr-icon-arrow-right-line"
            iconPosition="right"
            linkProps={{ href: `/salaire-alternant?${UTM_PARAMS}` }}
          >
            Calculer ma rémunération en alternance
          </Button>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
