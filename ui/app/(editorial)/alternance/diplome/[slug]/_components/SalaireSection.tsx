import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, List, ListItem, Typography } from "@mui/material"
import { ArrowRightLine } from "@/theme/components/icons"
import { PAGES } from "@/utils/routes.utils"

const cardSx = {
  backgroundColor: "white",
  padding: fr.spacing("7v"),
  borderRadius: "5px",
  boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
}

export function SalaireSection({ titre, utmParams }: { titre: React.ReactNode; utmParams: string }) {
  return (
    <Box
      sx={{
        mb: fr.spacing("8v"),
        py: fr.spacing("8v"),
        px: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
      }}
    >
      <Typography component={"h2"} variant="h2" sx={{ mb: fr.spacing("4v") }}>
        {titre}
      </Typography>
      <Box component="hr" sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }} />
      <Typography variant="h3" sx={{ mb: fr.spacing("4v"), fontSize: { xs: "1.25rem", md: "1.375rem" }, lineHeight: "1.75rem" }} gutterBottom>
        Rémunération et évolution des apprentis
      </Typography>
      <Typography variant="body1">Minimum réglementaire en pourcentage du SMIC selon l’âge et à mesure de l’avancée dans le contrat :</Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
          gap: fr.spacing("4v"),
          alignItems: "stretch",
          mt: fr.spacing("4v"),
        }}
      >
        <Box sx={cardSx}>
          <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.artwork.minor.blueFrance.default, mb: fr.spacing("4v"), textAlign: "center" }}>
            Moins de 18 ans
          </Typography>
          <List sx={{ m: fr.spacing("2v"), "& li": { padding: fr.spacing("1v"), listStyleType: "disc", display: "list-item", textAlign: "center", listStylePosition: "inside" } }}>
            <ListItem>
              <Typography component={"span"} fontWeight={"bold"}>
                27%
              </Typography>{" "}
              la 1re année
            </ListItem>
            <ListItem>
              <Typography component={"span"} fontWeight={"bold"}>
                39%
              </Typography>{" "}
              la 2e année
            </ListItem>
            <ListItem>
              <Typography component={"span"} fontWeight={"bold"}>
                55%
              </Typography>{" "}
              la 3e année
            </ListItem>
          </List>
        </Box>
        <Box sx={cardSx}>
          <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.artwork.minor.blueFrance.default, mb: fr.spacing("4v"), textAlign: "center" }}>
            18 à 20 ans
          </Typography>
          <List sx={{ m: fr.spacing("2v"), "& li": { padding: fr.spacing("1v"), listStyleType: "disc", display: "list-item", textAlign: "center", listStylePosition: "inside" } }}>
            <ListItem>
              <Typography component={"span"} fontWeight={"bold"}>
                43%
              </Typography>{" "}
              la 1re année
            </ListItem>
            <ListItem>
              <Typography component={"span"} fontWeight={"bold"}>
                51%
              </Typography>{" "}
              la 2e année
            </ListItem>
            <ListItem>
              <Typography component={"span"} fontWeight={"bold"}>
                60%
              </Typography>{" "}
              la 3e année
            </ListItem>
          </List>
        </Box>
        <Box sx={cardSx}>
          <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.artwork.minor.blueFrance.default, mb: fr.spacing("4v"), textAlign: "center" }}>
            21 à 25 ans
          </Typography>
          <List sx={{ m: fr.spacing("2v"), "& li": { padding: fr.spacing("1v"), listStyleType: "disc", display: "list-item", textAlign: "center", listStylePosition: "inside" } }}>
            <ListItem>
              <Typography component={"span"} fontWeight={"bold"}>
                53%
              </Typography>{" "}
              la 1re année
            </ListItem>
            <ListItem>
              <Typography component={"span"} fontWeight={"bold"}>
                61%
              </Typography>{" "}
              la 2e année
            </ListItem>
            <ListItem>
              <Typography component={"span"} fontWeight={"bold"}>
                78%
              </Typography>{" "}
              la 3e année
            </ListItem>
          </List>
        </Box>
        <Box sx={cardSx}>
          <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.artwork.minor.blueFrance.default, mb: fr.spacing("4v"), textAlign: "center" }}>
            26 ans et plus
          </Typography>
          <List sx={{ m: fr.spacing("2v"), "& li": { padding: fr.spacing("1v"), listStyleType: "disc", display: "list-item", textAlign: "center", listStylePosition: "inside" } }}>
            <ListItem>
              <Typography component={"span"} fontWeight={"bold"}>
                100%
              </Typography>{" "}
              la 1re année
            </ListItem>
            <ListItem>
              <Typography component={"span"} fontWeight={"bold"}>
                100%
              </Typography>{" "}
              la 2e année
            </ListItem>
            <ListItem>
              <Typography component={"span"} fontWeight={"bold"}>
                100%
              </Typography>{" "}
              la 3e année
            </ListItem>
          </List>
        </Box>
      </Box>
      <Box sx={{ mt: fr.spacing("6v"), mb: fr.spacing("4v"), textAlign: "center" }}>
        <Button
          linkProps={{ href: `${PAGES.static.salaireAlternant.getPath()}?${utmParams}` }}
          aria-label={"Calculer ma rémunération en alternance sur le simulateur la bonne alternance"}
          size="large"
          priority="secondary"
          style={{ marginTop: fr.spacing("2v") }}
        >
          Calculer ma rémunération en alternance
          <ArrowRightLine sx={{ mt: fr.spacing("1v"), ml: fr.spacing("3v"), width: 16, height: 16 }} />
        </Button>
      </Box>
    </Box>
  )
}
