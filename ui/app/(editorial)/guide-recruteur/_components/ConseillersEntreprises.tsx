"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomo-utils"

const CONSEILLERS_ENTREPRISES_URL = "https://conseillers-entreprises.service-public.gouv.fr/"

export const ConseillersEntreprises = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: { xs: "column", md: "row" },
      alignItems: { xs: "flex-start", md: "center" },
      gap: fr.spacing("7v"),
      padding: fr.spacing("6v"),
      borderRadius: "4px",
      border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
    }}
  >
    <Box sx={{ flex: 1 }}>
      <Typography component="h3" variant="h3" sx={{ color: fr.colors.decisions.text.title.grey.default }}>
        TPE & PME, vous avez une question ?
      </Typography>
      <Typography component="p" variant="body1" sx={{ my: fr.spacing("3v") }}>
        <Typography component="span" fontWeight="bold">
          Le Service Public Conseillers entreprises
        </Typography>{" "}
        rassemble de nombreux partenaires publics et parapublics chargés d’accompagner les TPE & PME. Décrivez votre besoin et un conseiller vous contacte sous 5 jours (délai
        moyen) pour vous parler de votre besoin.
      </Typography>
      <DsfrLink href={CONSEILLERS_ENTREPRISES_URL} onClick={() => pushMatomoEvent({ event: MATOMO_EVENTS.CONSEILLERS_ENTREPRISES_CLICKED })}>
        Échanger avec un conseiller
      </DsfrLink>
    </Box>
    <Box sx={{ flexShrink: 0, width: { xs: 252, md: 362 }, maxWidth: "100%" }}>
      <Image
        src="/images/guides/guide-recruteur/conseillers-entreprises.svg"
        width={362}
        height={204}
        alt=""
        aria-hidden={true}
        style={{ display: "block", width: "100%", height: "auto" }}
      />
    </Box>
  </Box>
)
