import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid, Typography } from "@mui/material"
import type { Metadata } from "next"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.planDuSite.getMetadata().title,
  description: PAGES.static.planDuSite.getMetadata().description,
}

export default function PlanDuSite() {
  return (
    <div>
      <Box>
        <Breadcrumb pages={[PAGES.static.planDuSite]} />
        <DefaultContainer>
          <Box sx={{ p: fr.spacing("10v"), marginBottom: fr.spacing("10v"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
            <Grid container spacing={fr.spacing("2v")}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography id="editorial-content-container" component={"h1"} variant="h1" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.default.info.default }}>
                  Plan du site
                </Typography>
                <Box
                  component="hr"
                  sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 9 }}>
                <Typography component={"p"} mb={fr.spacing("4v")}>
                  Retrouvez ci-dessous l'ensemble des pages principales de La bonne alternance.
                </Typography>

                <Box component="nav" role="navigation" aria-label="Navigation du plan du site">
                  <Box component="ul" sx={{ my: fr.spacing("8v"), pl: fr.spacing("4v"), listStyle: "disc", "& > li": { mb: fr.spacing("6v") } }}>
                    <li>
                      <DsfrLink href="/">Espace candidat</DsfrLink>
                    </li>
                    <li>
                      <DsfrLink href="/acces-recruteur">Accès recruteur</DsfrLink>
                    </li>
                    <li>
                      <DsfrLink href="/organisme-de-formation">Organisme de formation</DsfrLink>
                    </li>
                    <li>
                      <DsfrLink href="/espace-pro/authentification">Authentification espace pro</DsfrLink>
                    </li>
                    <li>
                      <DsfrLink href="/espace-pro/creation/entreprise">Création de compte entreprise</DsfrLink>
                    </li>
                    <li>
                      <DsfrLink href="/espace-pro/creation/cfa">Création de compte CFA</DsfrLink>
                    </li>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DefaultContainer>
      </Box>
    </div>
  )
}
