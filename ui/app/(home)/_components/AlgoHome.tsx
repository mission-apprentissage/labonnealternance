import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, Typography } from "@mui/material"
import Image from "next/image"
import { SectionTitle } from "@/app/_components/Title/SectionTitle"
import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
import { TagEmploiFormation } from "@/components/ItemDetail/TagEmploiFormation"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"

export const AlgoHome = () => (
  <Container sx={{ px: { xs: fr.spacing("6v"), lg: "0 !important" } }} maxWidth="xl" component="section" aria-labelledby="toutes-les-opportunites">
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
        columnGap: fr.spacing("6v"),
        rowGap: fr.spacing("8v"),
        alignItems: "end",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("6v") }}>
        <SectionTitle id="toutes-les-opportunites" highlight="même celles qui ne sont pas publiées">
          Toutes les opportunités,
        </SectionTitle>
        <Typography className={fr.cx("fr-text--lg")} sx={{ mb: 0 }}>
          Une grande partie des recrutements en alternance se fait sans offre publiée. Ce marché profite d'abord aux candidats qui ont un réseau. L'objectif de La bonne alternance
          est de le rendre visible à tous.
        </Typography>
        <Typography className={fr.cx("fr-text--lg")} sx={{ mb: 0 }}>
          Vous avez ainsi accès à trois types d'opportunités :
        </Typography>
        <Typography className={fr.cx("fr-text--lg")} sx={{ mb: 0 }}>
          <Box component="span" sx={{ fontWeight: 700 }}>
            Les offres d'emploi
          </Box>
          , repérables grâce au tag <TagOffreEmploi /> : publiées sur notre site, ou issues de nos partenaires (France Travail, Hellowork, Meteojob…). Toutes sont vérifiées avant
          d'être affichées.
        </Typography>
        <Typography className={fr.cx("fr-text--lg")} sx={{ mb: 0 }}>
          <Box component="span" sx={{ fontWeight: 700 }}>
            Les candidatures spontanées
          </Box>
          , repérables grâce au tag <TagCandidatureSpontanee />. Chaque mois, La bonne alternance identifie des entreprises à fort potentiel d'embauche en alternance grâce à
          l'analyse de diverses données, pour repérer les entreprises susceptibles de recruter un alternant dans les 6 prochains mois, y compris celles qui ne l'ont jamais fait.
        </Typography>
        <Typography className={fr.cx("fr-text--lg")} sx={{ mb: 0 }}>
          <Box component="span" sx={{ fontWeight: 700 }}>
            Les offres des centres de formation
          </Box>
          , repérables grâce au tag <TagEmploiFormation /> : publiées par des CFA pour le compte d'entreprises partenaires. En postulant, vous candidatez à la fois pour un contrat
          en alternance et pour une place dans la formation correspondante.
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: fr.spacing("2v"),
            p: fr.spacing("7v"),
            borderRadius: fr.spacing("2v"),
            border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
            backgroundColor: fr.colors.decisions.background.default.grey.default,
          }}
        >
          <Typography component="p" sx={{ mb: 0, fontSize: "36px", lineHeight: "44px", fontWeight: 700, color: fr.colors.decisions.text.title.grey.default }}>
            Près de 1 sur 3
          </Typography>
          <Typography sx={{ mb: 0 }}>
            <Box component="span" sx={{ fontWeight: 700 }}>
              Près d'un tiers des contrats
            </Box>{" "}
            signés grâce à La bonne alternance entre 2025 et 2026 proviennent d'une candidature spontanée.
          </Typography>
        </Box>
        <Image src="/images/service-public/opportunites.png" alt="" width={598} height={355} style={{ width: "100%", maxWidth: "324px", height: "auto" }} />
      </Box>
    </Box>
  </Container>
)
