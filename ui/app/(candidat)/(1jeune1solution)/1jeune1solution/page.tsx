import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container } from "@mui/material"
import NextImage from "next/image"
import { IRechercheMode, parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { HomeRechercheForm } from "@/app/(home)/_components/HomeRechercheForm"
import ciel from "@/public/images/1j1s/ciel.jpg"
import mobileRight from "@/public/images/1j1s/mobile-right.png"
import sparkLeft from "@/public/images/1j1s/sparks-left.svg"
import sparkRight from "@/public/images/1j1s/sparks-right.svg"

export default async function unJeune1Solution({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const rechercheParams = parseRecherchePageParams(new URLSearchParams(await searchParams), IRechercheMode.DEFAULT)
  return (
    <Container
      component="main"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("16v"),
        marginTop: { xs: 0, lg: fr.spacing("8v") },
        marginBottom: fr.spacing("16v"),
        px: { xs: 0, lg: fr.spacing("4v") },
        pt: { xs: fr.spacing("6v"), sm: 0 },
      }}
      maxWidth="xl"
      role="main"
    >
      <Box
        component="section"
        sx={{
          position: "relative",
          borderRadius: { xs: 0, lg: fr.spacing("2v") },
        }}
      >
        <Box>
          <NextImage
            fetchPriority="low"
            src={ciel.src}
            alt=""
            width={ciel.width}
            height={ciel.height}
            unoptimized
            style={{
              overflow: "visible",
              height: "calc(100% - 10px)",
              width: "100%",
              top: "20px",
              position: "absolute",
              objectFit: "cover",
            }}
          />

          <Box
            sx={{
              overflow: "visible",
              top: { xs: "-10px", lg: "-20px" },
              left: { xs: "10px", lg: "-20px" },
              position: "absolute",
            }}
          >
            <NextImage fetchPriority="low" src={sparkLeft.src} alt="" width={sparkLeft.width} height={sparkLeft.height} unoptimized />
          </Box>
          <Box
            sx={{
              overflow: "visible",
              bottom: { xs: "-10px", lg: "-20px" },
              right: { xs: "10px", lg: "-20px" },
              position: "absolute",
            }}
          >
            <NextImage fetchPriority="low" src={sparkRight.src} alt="" width={sparkRight.width} height={sparkRight.height} unoptimized />
          </Box>
        </Box>
        <Box
          sx={{
            position: "relative",
            display: "grid",
            paddingY: { xs: fr.spacing("8v"), md: fr.spacing("12v") },
            paddingX: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
            gap: fr.spacing("8v"),
            gridTemplateColumns: "1fr",
          }}
        >
          <HomeRechercheForm rechercheParams={rechercheParams} />
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("4v") }}>
        <Box>Grid Bulb.svg LE JOB DE VOS RÊVES Renseignez le métier que vous souhaitez faire et la localisation</Box>
        <Box>arrow.svg EN UN CLIN D’OEIL Obtenez en un clin d’oeil la liste des formations et entreprises proche de chez vous</Box>
        <Box>dialog.svg UN CONTACT FACILE Contactez facilement les centres de formations ou les entreprises pour postuler</Box>
      </Box>

      <Box>
        <Box>La bonne alternance vous révèle les entreprises qui recrutent en alternance</Box>
        <Box sx={{ display: "flex", gap: fr.spacing("2v"), flexDirection: "row", marginTop: fr.spacing("4v") }}>
          <Box>
            La bonne alternance expose différents types d’opportunités d’emplois : Les offres d’emploi Les offres d’emploi identifiables grâce au tag TAG OFFRE EMPLOI . qui sont de
            2 types : celles publiées directement sur notre plateforme celles issues de nos partenaires : France Travail, Hellowork, MétéoJob et bien d’autres !
          </Box>
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <NextImage src={mobileRight.src} alt="" aria-hidden="true" width={mobileRight.width} height={mobileRight.height} unoptimized />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: fr.spacing("2v"), flexDirection: "row", marginTop: fr.spacing("4v") }}>
          <Box>
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <NextImage src={mobileRight.src} alt="" aria-hidden="true" width={mobileRight.width} height={mobileRight.height} unoptimized />
            </Box>

            <Box>
              Les candidatures spontanées C'est ce qu'on appelle le marché caché de l'emploi — et c'est là que ça devient intéressant ! Chaque semaine, La bonne alternance analyse
              pour vous diverses données sur les entreprises (recrutements passés, données financières, candidatures déjà reçues, ...) pour vous suggérer des entreprises auxquelles
              adresser vos candidatures spontanées.Résultat ? Vous obtenez une liste ciblée d'entreprises "à fort potentiel d'embauche en alternance", pour booster vos candidatures
              spontanées. Ces entreprises sont identifiées grâce au tag
            </Box>
          </Box>
        </Box>
      </Box>

      <Box>À chacun sa solution. Vous avez entre 15 et 30 ans ? Découvrez toutes les solutions pour votre avenir ! Bouton lien 1j1s Image des jeunes</Box>

      <Box>
        <Box>Retrouvez 1jeune1solution sur Instagram et Tiktok : liens bouton vers insta liens bouton vers tiktok</Box>
        <Box>Suivez La bonne alternance sur Linkedin pour rester informé de nos actualités : Image lba lien bouton vers linkedin</Box>
      </Box>
    </Container>
  )
}
