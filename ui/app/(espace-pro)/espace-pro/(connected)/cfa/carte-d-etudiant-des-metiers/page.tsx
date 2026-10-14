import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Grid, Typography } from "@mui/material"
import type { Metadata } from "next"
import Image from "next/image"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"
export const metadata: Metadata = METADATA.static.espaceProCfaCarteDEtudiantDesMetiers()

const CarteDEtudiantDesMetiersPage = () => (
  <Box
    sx={{
      mb: fr.spacing("8w"),
    }}
  >
    <Breadcrumb pages={[PAGES.static.espaceProCfaCarteDEtudiantDesMetiers]} />
    <DefaultContainer>
      <Typography component="h1" variant="h1">
        Carte d'étudiant des métiers
      </Typography>
      <Grid container sx={{ mt: { md: fr.spacing("4w"), xs: fr.spacing("2w") } }} spacing={fr.spacing("3w")}>
        <Grid size={{ md: 4, xs: 12 }} display="flex" flexDirection="column">
          <Box display={"flex"} justifyContent={"center"}>
            <Image
              fetchPriority="low"
              src="/images/carte-d-etudiant-des-metiers-recto.svg"
              width={181}
              height={121}
              alt="Aperçu du recto de la carte d'étudiant des métiers"
              unoptimized
              style={{ height: "100%" }}
            />
            <Image
              fetchPriority="low"
              src="/images/carte-d-etudiant-des-metiers-verso.svg"
              width={181}
              height={121}
              alt="Aperçu du verso de la carte d'étudiant des métiers"
              unoptimized
              style={{ height: "100%" }}
            />
          </Box>
          {/* RGAA 6.1 et 13.3 : l'intitulé annonce à lui seul le téléchargement, le format et le poids. */}
          <Button
            iconId="fr-icon-download-line"
            iconPosition="left"
            linkProps={{ href: "/ressources/carte-d-etudiant-des-metiers.zip", download: "carte-d-etudiant-des-metiers.zip" }}
            style={{ margin: "auto", marginTop: fr.spacing("3w") }}
          >
            Télécharger la carte (ZIP, 200 Ko)
          </Button>
        </Grid>
        <Grid size={{ md: 8, xs: 12 }} display={"flex"} flexDirection={"column"} gap={{ md: fr.spacing("3w"), xs: fr.spacing("2w") }}>
          <Typography>Le .ZIP mis à disposition comporte 3 fichiers au format PDF.</Typography>
          <Typography>
            La version "Carte des metiers 26-27-classique.pdf" est le fichier classique. Le fichier "Carte des metiers 26-27-imprimeur.pdf" vous permet de l’imprimer chez un
            imprimeur. Le fichier "Carte des metiers 26-27-numerique.pdf" vous permet de le compléter pour chaque étudiant depuis votre ordinateur avant impression.
          </Typography>
        </Grid>
      </Grid>
    </DefaultContainer>
  </Box>
)

export default CarteDEtudiantDesMetiersPage
