import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, List, ListItem, Typography } from "@mui/material"
import NextImage from "next/image"
import Social from "@/app/(1jeune1solution)/components/Social"
import { IRechercheMode, parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { HomeRechercheForm } from "@/app/(home)/_components/HomeRechercheForm"
import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"

const utmParams = "utm_source=lba&utm_medium=website&utm_campaign=landinglba1j1s"
export default async function unJeune1Solution({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const rechercheParams = parseRecherchePageParams(new URLSearchParams(await searchParams), IRechercheMode.DEFAULT)
  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("8v"),
        marginTop: { xs: 0, lg: fr.spacing("8v") },
        marginBottom: fr.spacing("16v"),
        px: { xs: 0, lg: fr.spacing("4v") },
        pt: { xs: fr.spacing("6v"), sm: 0 },
      }}
      maxWidth="xl"
    >
      <Box
        component="section"
        sx={{
          position: "relative",
          borderRadius: { xs: 0, lg: fr.spacing("2v") },
        }}
      >
        <Box sx={{ pb: fr.spacing("5v"), "& > #sky-background": { borderRadius: { xs: 0, md: fr.spacing("2v") } } }}>
          <NextImage
            fetchPriority="low"
            src="/images/1j1s/ciel.webp"
            alt=""
            id="sky-background"
            aria-hidden="true"
            width={1120}
            height={334}
            unoptimized
            style={{
              height: "100%",
              width: "100%",
              top: "20px",
              position: "absolute",
              objectFit: "cover",
            }}
          />
          <Box
            sx={{
              top: { xs: "-10px", lg: "-20px" },
              left: { xs: "10px", lg: "-20px" },
              position: "absolute",
            }}
          >
            <NextImage fetchPriority="low" src="/images/1j1s/sparks-left.svg" alt="" aria-hidden="true" width={108} height={133} unoptimized />
          </Box>
          <Box
            sx={{
              bottom: { xs: "-10px", lg: "-20px" },
              right: { xs: "10px", lg: "-20px" },
              position: "absolute",
            }}
          >
            <NextImage fetchPriority="low" src="/images/1j1s/sparks-right.svg" alt="" aria-hidden="true" width={108} height={133} unoptimized />
          </Box>
        </Box>
        <Box
          id="editorial-1j1s-content-container"
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

      <Box
        sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("6v"), px: { xs: fr.spacing("3v"), md: fr.spacing("6v"), lg: 0 }, py: fr.spacing("8v") }}
      >
        <Box sx={{ flex: 1 }}>
          <NextImage src="/images/1j1s/bulb.svg" width={78} height={83} fetchPriority="low" alt="" unoptimized aria-hidden="true" />
          <Typography
            sx={{
              background: "#FFE817",
              width: "fit-content",
              padding: "0",
              fontWeight: 800,
              lineHeight: "32px",
              fontSize: "20px",
              mt: fr.spacing("6v"),
              textTransform: "uppercase",
            }}
          >
            350 000 opportunités
          </Typography>
          <Typography
            sx={{
              background: "#FFE817",
              width: "fit-content",
              padding: "0",
              fontWeight: 800,
              lineHeight: "32px",
              fontSize: "20px",
              mt: fr.spacing("2v"),
              mb: fr.spacing("3v"),
              textTransform: "uppercase",
            }}
          >
            pour lancer votre carrière
          </Typography>
          <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>
            Renseignez{" "}
            <Box component="span" sx={{ color: "#EA619E" }}>
              le métier
            </Box>{" "}
            que vous souhaitez faire et{" "}
            <Box component="span" sx={{ color: "#EA619E" }}>
              la localisation
            </Box>
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <NextImage src="/images/1j1s/arrow.svg" width={71} height={80} fetchPriority="low" alt="" unoptimized aria-hidden="true" />
          <Typography
            sx={{ background: "#FFE817", width: "fit-content", padding: "0", fontWeight: 800, lineHeight: "32px", fontSize: "20px", mt: fr.spacing("6v"), mb: fr.spacing("3v") }}
          >
            EN UN CLIN D’OEIL
          </Typography>
          <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>
            Obtenez en un clin d’oeil la{" "}
            <Box component="span" sx={{ color: "#EA619E" }}>
              liste des formations et entreprises proche de chez vous
            </Box>
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <NextImage src="/images/1j1s/dialog.svg" width={78} height={78} fetchPriority="low" alt="" unoptimized aria-hidden="true" />
          <Typography
            sx={{ background: "#FFE817", width: "fit-content", padding: "0", fontWeight: 800, lineHeight: "32px", fontSize: "20px", mt: fr.spacing("6v"), mb: fr.spacing("3v") }}
          >
            UN CONTACT FACILE
          </Typography>
          <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>
            <Box component="span" sx={{ color: "#EA619E" }}>
              Contactez facilement
            </Box>{" "}
            les centres de formations ou les entreprises pour postuler
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: { xs: fr.spacing("3v"), md: fr.spacing("6v"), lg: 0 } }}>
        <Typography id="home-content-container" variant="h1">
          La bonne alternance vous connecte
          <br />
          <Box component="span" sx={{ color: "#EA619E" }}>
            aux entreprises qui recrutent en alternance
          </Box>
        </Typography>
        <Box sx={{ width: "13%", height: "4px", background: "#EA619E", mt: fr.spacing("9v") }} />

        <Box sx={{ display: "flex", gap: { xs: fr.spacing("2v"), md: fr.spacing("13v") }, flexDirection: "row", marginTop: fr.spacing("4v") }}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Box>
              <Typography sx={{ fontSize: "18px" }}>La bonne alternance expose différents types d’opportunités d’emplois :</Typography>
              <Typography
                sx={{
                  background: "#FFE817",
                  width: "fit-content",
                  padding: "0",
                  fontWeight: 800,
                  lineHeight: "32px",
                  fontSize: "20px",
                  mt: fr.spacing("6v"),
                  mb: fr.spacing("6v"),
                }}
              >
                LES OFFRES D'EMPLOI
              </Typography>
              <Typography sx={{ fontSize: "18px" }}>
                <Box component="span" sx={{ fontWeight: 700 }}>
                  Les offres d’emploi
                </Box>{" "}
                identifiables grâce au tag <TagOffreEmploi /> qui sont de 2 types :
                <List sx={{ listStyleType: "disc", pl: 4, "& .MuiListItem-root": { display: "list-item", p: 0, fontSize: "18px" } }}>
                  <ListItem>celles publiées directement sur notre plateforme</ListItem>
                  <ListItem>celles issues de nos partenaires : France Travail, Hellowork, MétéoJob et bien d’autres !</ListItem>
                </List>
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <NextImage src="/images/1j1s/mobile-right.webp" alt="" aria-hidden="true" width={320} height={356} unoptimized />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: { xs: fr.spacing("6v"), md: fr.spacing("13v") }, flexDirection: { xs: "column-reverse", md: "row" }, marginTop: fr.spacing("4v") }}>
          <Box sx={{ display: { md: "block" }, margin: "auto", "& > img": { maxWidth: "100%", height: "auto" } }}>
            <NextImage src="/images/1j1s/mobile-left.webp" alt="" aria-hidden="true" width={314} height={339} unoptimized />
          </Box>

          <Box sx={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Box>
              <Typography
                sx={{
                  background: "#FFE817",
                  width: "fit-content",
                  padding: "0",
                  fontWeight: 800,
                  lineHeight: "32px",
                  fontSize: "20px",
                  mt: fr.spacing("6v"),
                  mb: fr.spacing("6v"),
                }}
              >
                LES CANDIDATURES SPONTANÉES
              </Typography>{" "}
              <Typography sx={{ fontSize: "18px" }}>
                C'est ce qu'on appelle le marché caché de l'emploi — et c'est là que ça devient intéressant ! Chaque semaine, La bonne alternance analyse pour vous diverses données
                sur les entreprises (recrutements passés, données financières, candidatures déjà reçues, ...) pour vous suggérer des entreprises auxquelles adresser vos
                candidatures spontanées.
              </Typography>
              <Typography sx={{ fontSize: "18px", mt: fr.spacing("3v") }}>
                Résultat ? Vous obtenez{" "}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  une liste ciblée d'entreprises "à fort potentiel d'embauche en alternance"
                </Box>
                , pour booster vos candidatures spontanées. Ces entreprises sont identifiées grâce au tag <TagCandidatureSpontanee />
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Social utmParams={utmParams} />
    </Container>
  )
}
