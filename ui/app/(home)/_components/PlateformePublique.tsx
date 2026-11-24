import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, Typography } from "@mui/material"
import Image from "next/image"
import { SectionTitle } from "@/app/_components/Title/SectionTitle"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

type Engagement = {
  image: string
  width: number
  height: number
  title: string
  description: string
  kpi: string
  kpiLabel: string
  kpiSource: string
}

const ENGAGEMENTS: Engagement[] = [
  {
    image: "/images/service-public/offres-centralisees.png",
    width: 254,
    height: 290,
    title: "Toutes les offres au même endroit",
    description: "Le service centralise en un point unique l'ensemble des offres d'emploi et de formations en alternance.",
    kpi: "389 000",
    kpiLabel: "offres en alternance collectées sur l'année 2026",
    kpiSource: "(année partielle, donnée établie au 23/11/2026)",
  },
  {
    image: "/images/service-public/offres-verifiees.png",
    width: 312,
    height: 240,
    title: "Des offres vérifiées",
    description: "Chaque offre est contrôlée. Les fausses offres et les stages sont écartés. Les candidats peuvent également nous signaler des offres non conformes.",
    kpi: "1 sur 5",
    kpiLabel: "offre partenaire écartée par nos contrôles",
    kpiSource: "Entre février 2025 et octobre 2026",
  },
  {
    image: "/images/service-public/appui-pour-tous.png",
    width: 312,
    height: 236,
    title: "Un appui pour tous, et surtout ceux qui en ont besoin",
    description:
      "Le service suggère aux candidats des entreprises et des secteurs qui recrutent. Il porte une attention particulière aux candidats et aux entreprises qui peinent à se trouver.",
    kpi: "11 000",
    kpiLabel: "employeurs engagés handicap mis en avant depuis septembre 2025",
    kpiSource: "(donnée établie au 23/11/2026)",
  },
]

export const PlateformePublique = () => (
  <Container sx={{ px: { xs: fr.spacing("6v"), lg: "0 !important" } }} maxWidth="xl" component="section" aria-labelledby="plateforme-publique">
    <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("8v") }}>
      <SectionTitle id="plateforme-publique" highlight="pour trouver votre alternance">
        La plateforme publique
      </SectionTitle>
      <Typography className={fr.cx("fr-text--lg")} sx={{ maxWidth: "860px", mb: 0 }}>
        Les sites pour chercher une alternance sont nombreux. La bonne alternance est le service public du ministère du Travail et des Solidarités dédié à l'alternance. Son rôle
        est d'aider chaque candidat à trouver son employeur, en particulier ceux qui n'ont pas de réseau. Pour cela, elle simplifie le recrutement des entreprises, surtout les plus
        petites, et rend visibles celles qui recrutent sans publier d'offre.
      </Typography>
      <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: fr.spacing("6v") }}>
        {ENGAGEMENTS.map((engagement) => (
          <Box
            component="li"
            key={engagement.title}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: fr.spacing("3v"),
              p: fr.spacing("6v"),
              borderRadius: fr.spacing("2v"),
              backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
            }}
          >
            <Image
              src={engagement.image}
              alt=""
              width={engagement.width}
              height={engagement.height}
              style={{ alignSelf: "center", width: "auto", height: "143px", maxWidth: "100%", objectFit: "contain" }}
            />
            <Typography component="h3" variant="h6" sx={{ mb: 0 }}>
              {engagement.title}
            </Typography>
            <Typography sx={{ mb: 0 }}>{engagement.description}</Typography>
            <Box
              sx={{
                mt: "auto",
                pt: fr.spacing("3v"),
                borderTop: `1px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
                color: fr.colors.decisions.text.mention.grey.default,
              }}
            >
              <Typography component="p" sx={{ mb: 0, fontSize: "14px", lineHeight: "20px" }}>
                <Box component="span" sx={{ display: "block", fontSize: "20px", lineHeight: "28px", fontWeight: 700, color: fr.colors.decisions.text.title.blueFrance.default }}>
                  {engagement.kpi}
                </Box>
                {engagement.kpiLabel}
                <Box component="span" sx={{ display: "block", mt: fr.spacing("1v"), fontSize: "12px", lineHeight: "18px" }}>
                  {engagement.kpiSource}
                </Box>
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
      <Box>
        <DsfrLink href={PAGES.static.aPropos.getPath()} arrow="right">
          Découvrir nos engagements de service public
        </DsfrLink>
      </Box>
    </Box>
  </Container>
)
