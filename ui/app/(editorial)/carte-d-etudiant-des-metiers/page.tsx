import type { Metadata } from "next"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid, Typography } from "@mui/material"
import Image from "next/image"
import Button from "@codegouvfr/react-dsfr/Button"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PAGES } from "@/utils/routes.utils"
import { DsfrIcon } from "@/components/DsfrIcon"

export const metadata: Metadata = PAGES.static.carteDEtudiantDesMetiers.getMetadata()

const CarteDEtudiantDesMetiersPage = () => (
  <Box
    sx={{
      mb: fr.spacing("8w"),
    }}
  >
    <Breadcrumb pages={[PAGES.static.carteDEtudiantDesMetiers]} />
    <DefaultContainer>
      <Typography component="h1" variant="h1">
        Carte d'étudiant des métiers
      </Typography>
      <Grid container sx={{ mt: { md: fr.spacing("4w"), xs: fr.spacing("2w") } }} spacing={fr.spacing("3w")}>
        <Grid size={{ md: 4, xs: 12 }} display="flex" flexDirection="column">
          <Box display={"flex"} justifyContent={"center"}>
            <Image fetchPriority="low" src="/images/carte-d-etudiant-des-metiers-recto.svg" width={181} height={121} alt="" unoptimized style={{ height: "100%" }} />
            <Image fetchPriority="low" src="/images/carte-d-etudiant-des-metiers-verso.svg" width={181} height={121} alt="" unoptimized style={{ height: "100%" }} />
          </Box>
          <Button linkProps={{ href: "/ressources/carte-d-etudiant-des-metiers.zip" }} style={{ margin: "auto", marginTop: fr.spacing("3w") }}>
            <DsfrIcon name="fr-icon-download-line" size={16} />
            Télécharger la carte (ZIP)
            <Typography component={"span"} variant="caption" mt={"auto"} ml={fr.spacing("1w")}>
              (3.1 Mo)
            </Typography>
          </Button>
        </Grid>
        <Grid size={{ md: 8, xs: 12 }} display={"flex"} flexDirection={"column"} gap={{ md: fr.spacing("3w"), xs: fr.spacing("2w") }}>
          <Typography>Le .ZIP mis à disposition comporte 3 fichiers au format PDF.</Typography>
          <Typography>
            La version Carte_etudiant_bureautique.pdf est le fichier classique. Le fichier Carte_etudiante_imprimeur.pdf vous permet de l’imprimer chez un imprimeur.Le fichier
            Carte_etudiante_numerique.pdf vous permet de le compléter pour chaque étudiant depuis votre ordinateur avant impression.
          </Typography>
        </Grid>
      </Grid>
    </DefaultContainer>
  </Box>
)

export default CarteDEtudiantDesMetiersPage
