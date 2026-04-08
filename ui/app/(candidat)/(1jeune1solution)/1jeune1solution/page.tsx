import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Container, List, ListItem, Typography } from "@mui/material"
import NextImage from "next/image"
import { IRechercheMode, parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { HomeRechercheForm } from "@/app/(home)/_components/HomeRechercheForm"
import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"
import arrow from "@/public/images/1j1s/arrow.svg"
import bulb from "@/public/images/1j1s/bulb.svg"
import ciel from "@/public/images/1j1s/ciel.webp"
import dialog from "@/public/images/1j1s/dialog.svg"
import illustrationLba from "@/public/images/1j1s/illustration-lba.svg"
import jeuneGarcon from "@/public/images/1j1s/jeune-garcon.webp"
import jeunes from "@/public/images/1j1s/jeunes.webp"
import mobileLeft from "@/public/images/1j1s/mobile-left.webp"
import mobileRight from "@/public/images/1j1s/mobile-right.webp"
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
          marginBottom: { xs: 0, md: fr.spacing("8v"), lg: fr.spacing("16v") },
        }}
      >
        <Box>
          <NextImage
            fetchPriority="low"
            src={ciel.src}
            alt=""
            aria-hidden="true"
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
            <NextImage fetchPriority="low" src={sparkLeft.src} alt="" aria-hidden="true" width={sparkLeft.width} height={sparkLeft.height} unoptimized />
          </Box>
          <Box
            sx={{
              overflow: "visible",
              bottom: { xs: "-10px", lg: "-20px" },
              right: { xs: "10px", lg: "-20px" },
              position: "absolute",
            }}
          >
            <NextImage fetchPriority="low" src={sparkRight.src} alt="" aria-hidden="true" width={sparkRight.width} height={sparkRight.height} unoptimized />
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

      <Box
        sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("6v"), px: { xs: fr.spacing("3v"), md: fr.spacing("6v"), lg: 0 }, py: fr.spacing("8v") }}
      >
        <Box sx={{ flex: 1 }}>
          <NextImage src={bulb.src} width={bulb.width} height={bulb.height} fetchPriority="low" alt="" unoptimized aria-hidden="true" />
          <Typography
            sx={{ background: "#FFE817", width: "fit-content", padding: "0", fontWeight: 800, lineHeight: "32px", fontSize: "20px", mt: fr.spacing("6v"), mb: fr.spacing("3v") }}
          >
            LE JOB DE VOS RÊVES
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
          <NextImage src={arrow.src} width={arrow.width} height={arrow.height} fetchPriority="low" alt="" unoptimized aria-hidden="true" />
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
          <NextImage src={dialog.src} width={dialog.width} height={dialog.height} fetchPriority="low" alt="" unoptimized aria-hidden="true" />
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
          La bonne alternance vous révèle
          <br />
          <Box component="span" sx={{ color: "#EA619E" }}>
            les entreprises qui recrutent en alternance
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
            <NextImage src={mobileRight.src} alt="" aria-hidden="true" width={mobileRight.width} height={mobileRight.height} unoptimized />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: { xs: fr.spacing("6v"), md: fr.spacing("13v") }, flexDirection: { xs: "column-reverse", md: "row" }, marginTop: fr.spacing("4v") }}>
          <Box sx={{ display: { md: "block" }, margin: "auto" }}>
            <NextImage src={mobileLeft.src} alt="" aria-hidden="true" width={mobileLeft.width} height={mobileLeft.height} unoptimized />
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

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          color: "#FFFFFF",
          gap: fr.spacing("10v"),
          background: "#566BB1",
          pl: { xs: fr.spacing("3v"), md: fr.spacing("6v"), lg: 0 },
          pr: { xs: fr.spacing("3v"), md: 0 },
        }}
      >
        <Box sx={{ flex: 1, px: { xs: fr.spacing("3v"), md: fr.spacing("6v") }, py: fr.spacing("4v") }}>
          <Typography sx={{ fontSize: { xs: "28px", md: "32px" }, fontWeight: 700, lineHeight: { xs: "36px", md: "40px" } }}>À chacun sa solution.</Typography>
          <Typography sx={{ fontSize: { xs: "22px", md: "24px" }, fontWeight: 700, lineHeight: { xs: "28px", md: "32px" } }}>
            Vous avez entre 15 et 30 ans ? Découvrez toutes les solutions pour votre avenir !
          </Typography>
          <Button
            linkProps={{ href: "https://www.1jeune1solution.gouv.fr/" }}
            size="large"
            priority="tertiary"
            style={{ fontSize: "16px", background: "#FFF", marginTop: fr.spacing("2v") }}
          >
            Visiter le site 1jeune1solution.gouv.fr
          </Button>
        </Box>
        <Box sx={{ display: { xs: "none", md: "block" }, maxHeight: jeunes.height, overflow: "hidden" }}>
          <NextImage src={jeunes.src} alt="" aria-hidden="true" width={jeunes.width} height={jeunes.height} unoptimized />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: { xs: fr.spacing("3v"), md: fr.spacing("11v") },
          px: { xs: fr.spacing("3v"), md: 0 },
          py: fr.spacing("8v"),
        }}
      >
        <Box sx={{ flex: 1, display: "flex", flexDirection: { xs: "column", sm: "row" }, background: "#000091", maxHeight: { xs: "unset", sm: "280px" } }}>
          <Box sx={{ flex: 1, p: fr.spacing("6v"), display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
            <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "#FFFFFF", lineHeight: "30px" }}>Retrouvez 1jeune1solution sur Instagram et Tiktok :</Typography>
            <Box sx={{ "& > a:hover": { background: "#000091" } }}>
              <Button
                linkProps={{
                  href: "https://www.instagram.com/1jeune1solution/",
                  target: "_self",
                  "aria-label": "Lien vers le compte Instagram de 1jeune1solution",
                }}
                size="large"
                priority="tertiary"
                iconId="fr-icon-instagram-fill"
                iconPosition="right"
                style={{ color: "#FFFFFF", fontSize: "16px" }}
              >
                @1jeune1solution
              </Button>
            </Box>
            <Box sx={{ "& > a:hover": { background: "#000091" } }}>
              <Button
                linkProps={{
                  href: "https://www.tiktok.com/@1jeune_1solution",
                  target: "_self",
                  "aria-label": "Lien vers le compte Tiktok de 1jeune1solution",
                }}
                size="large"
                priority="tertiary"
                iconId="fr-icon-tiktok-fill"
                iconPosition="right"
                style={{ color: "#FFFFFF", fontSize: "16px" }}
              >
                @1jeune1solution
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              position: "relative",
              bottom: { xs: 0, sm: 0, md: 3 },
              right: { xs: -1, sm: 0, md: -1 },
              overflow: { xs: "hidden", md: "visible" },
              maxHeight: { xs: "150px", sm: "unset" },
              textAlign: "right",
            }}
          >
            <NextImage src={jeuneGarcon.src} alt="" aria-hidden="true" width={jeuneGarcon.width} height={jeuneGarcon.height} unoptimized />
          </Box>
        </Box>
        <Box sx={{ flex: 1, display: "flex", flexDirection: { xs: "column", lg: "row" }, background: "#EEDBF5", maxHeight: { xs: "unset", sm: "280px" } }}>
          <Box sx={{ flex: 1, p: fr.spacing("6v"), alignItems: "top", display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
            <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "#000091", lineHeight: "30px" }}>
              Suivez La bonne alternance sur Linkedin pour rester informé de nos actualités :
            </Typography>
            <Box sx={{ "& > a:hover": { background: "#EEDBF5" } }}>
              <Button
                linkProps={{
                  href: "https://www.linkedin.com/company/la-bonne-alternance/",
                  target: "_self",
                  "aria-label": "Lien vers le compte LinkedIn de La bonne alternance",
                }}
                size="large"
                priority="secondary"
                iconId="fr-icon-linkedin-box-fill"
                iconPosition="right"
                style={{ color: "#000091", fontSize: "16px", whiteSpace: "nowrap" }}
              >
                LinkedIn La bonne alternance
              </Button>
            </Box>
          </Box>
          <Box sx={{ flex: 1, textAlign: "center", overflow: "hidden", mt: { xs: "-5px", lg: fr.spacing("10v") } }}>
            <NextImage src={illustrationLba.src} alt="" aria-hidden="true" width={illustrationLba.width} height={illustrationLba.height} unoptimized />
          </Box>
        </Box>
      </Box>
    </Container>
  )
}
