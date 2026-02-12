import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, Typography } from "@mui/material"
import Image from "next/image"

import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"

export const AlgoHome = () => (
  <Container maxWidth="xl" component="section">
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "2fr 1fr",
        },
        gap: fr.spacing("2w"),
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: fr.spacing("5w"),
        }}
      >
        <Typography id="home-content-container" variant="h1">
          Vous révéler
          <br />
          <Box component="span" sx={{ color: fr.colors.decisions.border.default.blueFrance.default }}>
            le marché caché de l&apos;emploi
          </Box>
        </Typography>
        <Box sx={{ width: "13%", height: "4px", background: fr.colors.decisions.border.default.blueFrance.default }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3w") }}>
          <Typography className={fr.cx("fr-text--lg")}>La bonne alternance expose différents types d&apos;opportunités d&apos;emplois :</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3w") }}>
            <Box className={fr.cx("fr-text--lg")}>
              <Typography>
                <strong>Les offres d&apos;emploi</strong> identifiables grâce au tag <TagOffreEmploi /> qui sont de 3 types :
              </Typography>
              <ul>
                <li>celles publiées directement sur notre plateforme</li>
                <li>celles issues de nos partenaires : France Travail, Hellowork, MétéoJob et bien d’autres,</li>
                <li>celles publiées par des écoles qui recrutent pour le compte des entreprises de leur réseau.</li>
              </ul>
            </Box>
            <Typography className={fr.cx("fr-text--lg")}>
              <strong>Les candidatures spontanées :</strong> correspondant au marché caché de l'emploi. Chaque mois, un algorithme prédictif de France Travail analyse les
              recrutements des 6 années passées pour prédire ceux des 6 mois à venir. Grâce à ces données, il identifie une liste restreinte d'entreprises "à fort potentiel
              d'embauche en alternance" pour faciliter vos démarches de candidatures spontanées. Elles sont identifiées grâce au tag <TagCandidatureSpontanee />
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: { xs: "center", sm: "center", md: "center", lg: "flex-end" } }}>
        <Image src="/images/icons/algo-home.png" alt="" width={324} height={387} />
      </Box>
    </Box>
  </Container>
)
