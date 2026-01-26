import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Typography, Box, Grid } from "@mui/material"
import type { Metadata } from "next"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"
import { publicConfig } from "@/config.public"

export const metadata: Metadata = {
  title: PAGES.static.contact.getMetadata().title,
  description: PAGES.static.contact.getMetadata().description,
}

export default function Contact() {
  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.contact]} />
      <DefaultContainer>
        <Grid container spacing={0}>
          <Grid size={{ xs: 12, md: 4 }} sx={{ p: { xs: fr.spacing("2w"), md: fr.spacing("5w") } }}>
            <Typography id="editorial-content-container" component={"h1"} variant="h1" sx={{ mb: fr.spacing("1w"), color: fr.colors.decisions.text.default.info.default }}>
              Nous contacter
            </Typography>
            <Box
              component="hr"
              sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }} sx={{ p: { xs: fr.spacing("2w"), md: fr.spacing("5w") } }}>
            <Typography component="p" sx={{ mb: 2 }}>
              Vous avez une question sur nos outils ? Consultez notre foire aux questions.
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <Button priority="secondary" aria-label="Accès à la Foire aux questions" size="large">
                <DsfrLink href={PAGES.static.faq.getPath()}>Consulter la FAQ</DsfrLink>
              </Button>
            </Box>
            <Typography component="p" sx={{ mb: 2 }}>
              Si jamais vous ne trouvez pas votre réponse dans notre FAQ, ou souhaitez nous partager votre avis ou une suggestion d'amélioration sur nos outils, contactez nous par
              email à<br />
              <DsfrLink aria-label="Envoi d'un email au service candidat de La bonne alternance" href={`mailto:${publicConfig.publicEmail}?subject=Page%20Contact`}>
                {publicConfig.publicEmail}
              </DsfrLink>
            </Typography>
          </Grid>
        </Grid>
      </DefaultContainer>
    </Box>
  )
}
