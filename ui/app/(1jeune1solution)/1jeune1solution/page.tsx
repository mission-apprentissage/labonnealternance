import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, List, ListItem, Typography } from "@mui/material"
import NextImage from "next/image"
import { zoneScopedId } from "@/app/_components/zone-ids"
import Social from "@/app/(1jeune1solution)/components/Social"
import { SearchHomeForm } from "@/app/(candidat)/(recherche)/recherche/_components/SearchHomeForm"
import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"

const utmParams = "utm_source=lba&utm_medium=website&utm_campaign=landinglba1j1s"
const featureTitleSx = { color: fr.colors.decisions.text.title.grey.default, fontWeight: 700, fontSize: "28px", lineHeight: "36px" }

export default function unJeune1Solution() {
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
      <Box component="section" sx={{ px: { xs: fr.spacing("4v"), md: fr.spacing("8v"), lg: 0 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("8v") }}>
          <Typography component="h1" sx={{ flex: 1, mb: { xs: fr.spacing("8v"), lg: 0 }, fontSize: "56px", lineHeight: "64px", fontWeight: 700 }}>
            À chacun
            <br />
            <Box component="span" sx={{ color: "#6A6AF4" }}>
              son alternance
            </Box>
          </Typography>
          {/* mb négatif : le formulaire recouvre les 76 px du bas de l'image. */}
          <Box sx={{ display: { xs: "none", lg: "block" }, flex: 1, mb: "-76px", "& > img": { display: "block", maxWidth: "100%", height: "auto", ml: "auto" } }}>
            <NextImage src="/images/1j1s/personna.webp" alt="" aria-hidden="true" width={626} height={347} unoptimized />
          </Box>
        </Box>
        <Box sx={{ position: "relative" }}>
          <SearchHomeForm id={zoneScopedId("1jeune1solution", "search-form")} showTitle={false} />
        </Box>
      </Box>

      <Box
        sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("6v"), px: { xs: fr.spacing("3v"), md: fr.spacing("6v"), lg: 0 }, py: fr.spacing("8v") }}
      >
        <Box sx={{ flex: 1 }}>
          <NextImage src="/images/1j1s/france.webp" width={80} height={80} fetchPriority="low" alt="" unoptimized aria-hidden="true" style={{ display: "block" }} />
          <Typography sx={{ ...featureTitleSx, mt: fr.spacing("8v") }}>350 000 opportunités</Typography>
          <Typography sx={{ ...featureTitleSx, mt: fr.spacing("2v"), mb: fr.spacing("3v") }}>pour lancer votre carrière</Typography>
          <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>
            Renseignez{" "}
            <Box component="span" sx={{ color: "#6A6AF4" }}>
              le métier
            </Box>{" "}
            que vous souhaitez faire et{" "}
            <Box component="span" sx={{ color: "#6A6AF4" }}>
              la localisation
            </Box>
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <NextImage src="/images/1j1s/loupe.webp" width={80} height={80} fetchPriority="low" alt="" unoptimized aria-hidden="true" style={{ display: "block" }} />
          <Typography sx={{ ...featureTitleSx, mt: fr.spacing("8v"), mb: fr.spacing("3v") }}>En un clin d’oeil</Typography>
          <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>
            Obtenez en un clin d’oeil la{" "}
            <Box component="span" sx={{ color: "#6A6AF4" }}>
              liste des formations et entreprises proche de chez vous
            </Box>
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <NextImage src="/images/1j1s/enveloppe.webp" width={80} height={80} fetchPriority="low" alt="" unoptimized aria-hidden="true" style={{ display: "block" }} />
          <Typography sx={{ ...featureTitleSx, mt: fr.spacing("8v"), mb: fr.spacing("3v") }}>Un contact facile</Typography>
          <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>
            <Box component="span" sx={{ color: "#6A6AF4" }}>
              Contactez facilement
            </Box>{" "}
            les centres de formations ou les entreprises pour postuler
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: { xs: fr.spacing("3v"), md: fr.spacing("6v"), lg: 0 } }}>
        <Box sx={{ display: "flex", gap: { xs: fr.spacing("2v"), md: fr.spacing("13v") }, flexDirection: "row" }}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Box>
              <Typography variant="h1" component="h2" sx={{ fontSize: { xs: "32px", lg: "40px" }, lineHeight: { xs: "40px", lg: "48px" } }}>
                La bonne alternance vous connecte
                <br />
                <Box component="span" sx={{ color: "#6A6AF4" }}>
                  aux entreprises qui recrutent
                </Box>
              </Typography>
              <Typography sx={{ fontSize: "18px" }}>La bonne alternance expose différents types d’opportunités d’emplois :</Typography>
              <Typography component="h3" sx={{ ...featureTitleSx, color: fr.colors.decisions.text.title.blueFrance.default, mt: fr.spacing("6v"), mb: fr.spacing("6v") }}>
                Les offres d’emploi
              </Typography>
              <Box>
                <Typography sx={{ fontSize: "18px" }}>
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    Les offres d’emploi
                  </Box>{" "}
                  identifiables grâce au tag <TagOffreEmploi /> qui sont de 2 types :
                </Typography>
                <List sx={{ listStyleType: "disc", pl: 4, "& .MuiListItem-root": { display: "list-item", p: 0, fontSize: "18px" } }}>
                  <ListItem>celles publiées directement sur notre plateforme</ListItem>
                  <ListItem>celles issues de nos partenaires : France Travail, Hellowork, MétéoJob et bien d’autres !</ListItem>
                </List>
              </Box>
            </Box>
          </Box>
          <Box
            sx={{ display: { xs: "none", md: "block" }, flex: { md: "0 1 40%", lg: "0 1 499px" }, minWidth: 0, "& > img": { display: "block", maxWidth: "100%", height: "auto" } }}
          >
            <NextImage src="/images/1j1s/mobile-offres.webp" alt="" aria-hidden="true" width={499} height={596} unoptimized />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: { xs: fr.spacing("6v"), md: fr.spacing("13v") }, flexDirection: { xs: "column-reverse", md: "row" }, marginTop: fr.spacing("4v") }}>
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              flex: { md: "0 1 40%", lg: "0 1 446px" },
              minWidth: 0,
              margin: "auto",
              "& > img": { display: "block", maxWidth: "100%", height: "auto" },
            }}
          >
            <NextImage src="/images/1j1s/mobile-candidatures.webp" alt="" aria-hidden="true" width={446} height={482} unoptimized />
          </Box>

          <Box sx={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Box>
              <Typography component="h3" sx={{ ...featureTitleSx, color: fr.colors.decisions.text.title.blueFrance.default, mt: fr.spacing("6v"), mb: fr.spacing("6v") }}>
                Les candidatures spontanées
              </Typography>
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
