import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, Typography } from "@mui/material"
import Image from "next/image"

import TagCandidatureSpontanee from "../../../components/ItemDetail/TagCandidatureSpontanee"
import TagOffreEmploi from "../../../components/ItemDetail/TagOffreEmploi"

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
        <Typography variant="h1">
          Vous révéler
          <br />
          <Box component="span" sx={{ color: fr.colors.decisions.border.default.blueFrance.default }}>
            le marché caché de l&apos;emploi
          </Box>
        </Typography>
        <Box sx={{ width: "13%", height: "4px", background: fr.colors.decisions.border.default.blueFrance.default }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3w") }}>
          <Typography className={fr.cx("fr-text--lg")}>La bonne alternance expose différents types d&apos;opportunités d&apos;emplois :</Typography>
          <Box component="ul" sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3w") }}>
            <li>
              <Typography className={fr.cx("fr-text--lg")}>
                <strong>Les offres d&apos;emploi</strong> : publiées sur notre plateforme ainsi que celles issues de France Travail et ses partenaires. Elles sont identifiées grâce
                au tag <TagOffreEmploi />
              </Typography>
            </li>
            <li>
              <Typography className={fr.cx("fr-text--lg")}>
                <strong>Les candidatures spontanées</strong> : correspondant au marché caché de l&apos;emploi. Grâce à l'analyse de diverses données publiques (données de
                recrutement, données financières, etc.), La bonne alternance identifie chaque mois une liste restreinte d'entreprises à fort potentiel d'embauche en alternance,
                afin de faciliter les démarches de candidatures spontanées de ses utilisateurs. Elles sont identifiées grâce au tag <TagCandidatureSpontanee />
              </Typography>
            </li>
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
        <Image src="/images/icons/algo_home.png" alt="" width={324} height={387} />
      </Box>
    </Box>
  </Container>
)
