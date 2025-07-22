import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

type Target = "candidat" | "cfa" | "recruteur"

const textes: Record<Target, string> = {
  cfa: "La bonne alternance recense une liste d’outils et de liens utiles pour les organismes de formation qui accompagnent des jeunes dans leurs recherches de contrat.",
  recruteur: "La bonne alternance recense une liste d’outils et de liens utiles pour les recruteurs afin de vous aider dans vos démarches de recrutement en alternance.",
  candidat: "La bonne alternance recense une liste d’outils et de liens utiles pour vous aider dans vos démarches de recherche d’alternance.",
}

export const PromoRessources = ({ target }: { target: Target }) => (
  <Box
    component="section"
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: fr.spacing("3w"),
      padding: fr.spacing("3v"),
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Image fetchPriority="low" src="/images/pages_ressources/outils.svg" aria-hidden={true} alt="" width={212} height={145} />
    <Typography textAlign="center" sx={{ fontWeight: 700, fontSize: "1.5rem", lineHeight: "2rem", textWrap: "balance" }}>
      {textes[target]}
    </Typography>

    <DsfrLink href={`${PAGES.static.ressources.getPath()}#${target}`} size="lg" className={fr.cx("fr-btn", "fr-btn--lg", "fr-btn--secondary")}>
      Découvrir les ressources
    </DsfrLink>
  </Box>
)
