"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid, Tab, Tabs, Typography } from "@mui/material"
import { useState } from "react"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { tabSx } from "@/components/espace_pro/CreationRecruteur/CustomTabs"
import { publicConfig } from "@/config.public"
import { PAGES } from "@/utils/routes.utils"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

function TabContent({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: fr.spacing("3w"), p: fr.spacing("3w"), border: "2px solid #E5E5E5", borderRadius: "5px" }}>
      <Typography sx={{ mb: fr.spacing("3w"), fontWeight: 700, fontSize: "28px", color: "#000091" }} component="h3">
        {title}
      </Typography>
      <hr />
      {children}
    </Box>
  )
}

export default function StatistiquesClient() {
  const [value, setValue] = useState(0)

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }

  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.statistiques]} />
      <DefaultContainer>
        <Typography id="editorial-content-container" component="h1" variant="h1" sx={{ mb: 2, color: fr.colors.decisions.text.default.info.default }}>
          Statistiques
        </Typography>

        <Typography>
          La bonne alternance est une startup d'Etat incubée par beta.gouv. Nous développons un service à destination des publics selon les principes du Manifeste de beta.gouv.
          Nous mesurons l'impact de nos actions et publions en toute transparence nos statistiques.
          <br />
          <br />
          Notre méthode de calcul d'impact se base sur 3 étapes :<br />
          1. Mesurer l'exposition de l'information,
          <br />
          2. Mesurer le nombre de mises en relation générées par nos services,
          <br />
          3. Mesurer que ces mises en relation se convertissent en recrutements effectifs.
          <br />
          <br />
          Pour visualiser correctement cette page, veuillez désactiver votre bloqueur de publicité
        </Typography>

        <Box sx={{ mt: 6 }}>
          <Box sx={{ px: { xs: 0, sm: 4 } }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="statistiques tabs"
              slotProps={{
                indicator: {
                  sx: {
                    top: 0, // ← Indicateur en haut
                    bottom: "auto",
                    height: "3px",
                    backgroundColor: "primary.main",
                  },
                },
              }}
              sx={tabSx}
            >
              <Tab disableRipple label="Exposition" />
              <Tab disableRipple label="Mise en relation" />
              <Tab disableRipple label="Conversion" />
            </Tabs>
          </Box>

          <TabPanel value={value} index={0}>
            <TabContent title="Les visites">
              <iframe
                width="100%"
                height="500px"
                title="stats_plausible"
                plausible-embed="true"
                src="https://plausible.io/share/labonnealternance.apprentissage.beta.gouv.fr?auth=Ck7r5NwNNf9IveZVA5U0O&embed=true&theme=light&background=transparent"
                loading="lazy"
              ></iframe>
            </TabContent>
            <TabContent title="Les opportunités d’emploi">
              <iframe
                width="100%"
                height="1100px"
                title="stats_offres_lba"
                src={`${publicConfig.baseUrl}/metabase/public/dashboard/882fcfcc-8020-4387-9ab1-0180f5dd38b4`}
                loading="lazy"
              ></iframe>
            </TabContent>
            <TabContent title="Les formations">
              <iframe
                width="100%"
                height="600px"
                title="stats_formations_lba"
                src={`${publicConfig.baseUrl}/metabase/public/dashboard/d871dd8b-4021-493b-9081-0ad4ac4b066a`}
                loading="lazy"
              ></iframe>
            </TabContent>
          </TabPanel>

          <TabPanel value={value} index={1}>
            <TabContent title="Les candidatures aux opportunités d’emploi">
              <iframe
                width="100%"
                height="1200px"
                title="stats_candidatures_lba"
                src={`${publicConfig.baseUrl}/metabase/public/dashboard/08660119-0ec8-4311-a9a3-694a6b5504ee`}
                loading="lazy"
              ></iframe>
            </TabContent>
            <TabContent title="Les demandes d’informations aux CFA">
              <iframe
                width="100%"
                height="1300px"
                title="stats_count_prdv"
                src={`${publicConfig.baseUrl}/metabase/public/dashboard/da0e20fb-3fbf-4cf8-971c-ac06dadf75c9`}
                loading="lazy"
              ></iframe>
            </TabContent>
          </TabPanel>

          <TabPanel value={value} index={2}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TabContent title="Les signatures de contrat">
                  <iframe
                    width="100%"
                    max-width="300px"
                    height="1000px"
                    title="stats_signatures_contrat"
                    src={`${publicConfig.baseUrl}/metabase/public/dashboard/19e1b709-f955-415b-8212-4e085569810c`}
                    loading="lazy"
                  ></iframe>
                </TabContent>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TabContent title="les inscriptions en formation">
                  <iframe
                    width="100%"
                    max-width="300px"
                    height="1000px"
                    title="stats_inscriptions_formations"
                    src={`${publicConfig.baseUrl}/metabase/public/dashboard/c570909c-044a-4906-b0a3-61b6c47c9d6e`}
                    loading="lazy"
                  ></iframe>
                </TabContent>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
