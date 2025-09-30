"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Divider, Grid, Tab, Tabs, Typography } from "@mui/material"
import { useState } from "react"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
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

const tabSx = {
  color: "#161616",
  backgroundColor: "#E3E3FD",
  marginRight: 2,
  "&.Mui-selected": {
    color: "#000091",
    backgroundColor: "white",
    borderBottom: "none",
    borderTop: "2px solid #000091",
    borderLeft: "1px solid #ddd",
    borderRight: "1px solid #ddd",
  },
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
            <Tabs value={value} onChange={handleChange} aria-label="statistiques tabs">
              <Tab sx={tabSx} label="Exposition" />
              <Tab sx={tabSx} label="Mise en relation" />
              <Tab sx={tabSx} label="Conversion" />
            </Tabs>
          </Box>

          <TabPanel value={value} index={0}>
            <Box sx={{ mb: 8, px: { xs: 1, sm: 2, md: 4 }, py: 4, border: "2px solid #E5E5E5", borderRadius: "5px" }}>
              <Typography sx={{ mb: 8, fontWeight: 700, fontSize: "28px", color: "#000091" }} component="h3">
                Les visites
              </Typography>
              <Divider sx={{ mt: 6, mb: 2 }} />
              <iframe
                width="100%"
                // @ts-expect-error: ?
                border="none"
                height="2100px"
                title="stats_plausible"
                plausible-embed="true"
                src="https://plausible.io/share/labonnealternance.apprentissage.beta.gouv.fr?auth=Ck7r5NwNNf9IveZVA5U0O&embed=true&theme=light&background=transparent"
                loading="lazy"
              ></iframe>
            </Box>

            <Box sx={{ mb: 8, px: { xs: 1, sm: 2, md: 4 }, py: 4, border: "2px solid #E5E5E5", borderRadius: "5px" }}>
              <Typography sx={{ mb: 8, fontWeight: 700, fontSize: "28px", color: "#000091" }} component="h3">
                Les opportunités d’emploi
              </Typography>
              <Divider sx={{ mt: 6, mb: 2 }} />
              <iframe
                width="100%"
                // @ts-expect-error: ?
                border="none"
                height="1100px"
                // onLoad={metabaseIframeOnLoad}
                title="stats_offres_lba"
                src={`${publicConfig.baseUrl}/metabase/public/dashboard/882fcfcc-8020-4387-9ab1-0180f5dd38b4`}
                loading="lazy"
              ></iframe>
            </Box>

            <Box sx={{ mb: 8, px: { xs: 1, sm: 2, md: 4 }, py: 4, border: "2px solid #E5E5E5", borderRadius: "5px" }}>
              <Typography sx={{ mb: 8, fontWeight: 700, fontSize: "28px", color: "#000091" }} component="h3">
                Les formations
              </Typography>
              <Divider sx={{ mt: 6, mb: 2 }} />
              <iframe
                width="100%"
                // @ts-expect-error: ?
                border="none"
                height="600px"
                // onLoad={metabaseIframeOnLoad}
                title="stats_formations_lba"
                src={`${publicConfig.baseUrl}/metabase/public/dashboard/d871dd8b-4021-493b-9081-0ad4ac4b066a`}
                loading="lazy"
              ></iframe>
            </Box>
          </TabPanel>

          <TabPanel value={value} index={1}>
            <Box sx={{ mb: 8, px: { xs: 1, sm: 2, md: 4 }, py: 4, border: "2px solid #E5E5E5", borderRadius: "5px" }}>
              <Typography sx={{ mb: 8, fontWeight: 700, fontSize: "28px", color: "#000091" }} component="h3">
                Les candidatures aux opportunités d’emploi
              </Typography>
              <Divider sx={{ mt: 6, mb: 2 }} />
              <iframe
                width="100%"
                // @ts-expect-error: ?
                border="none"
                height="1200px"
                // onLoad={metabaseIframeOnLoad}
                title="stats_candidatures_lba"
                src={`${publicConfig.baseUrl}/metabase/public/dashboard/08660119-0ec8-4311-a9a3-694a6b5504ee`}
                loading="lazy"
              ></iframe>
            </Box>

            <Box sx={{ mb: 8, px: { xs: 1, sm: 2, md: 4 }, py: 4, border: "2px solid #E5E5E5", borderRadius: "5px" }}>
              <Typography sx={{ mb: 8, fontWeight: 700, fontSize: "28px", color: "#000091" }} component="h3">
                Les demandes d’informations aux CFA
              </Typography>
              <Divider sx={{ mt: 6, mb: 2 }} />
              <iframe
                width="100%"
                // @ts-expect-error: ?
                border="none"
                height="1300px"
                title="stats_count_prdv"
                // onLoad={metabaseIframeOnLoad}
                src={`${publicConfig.baseUrl}/metabase/public/dashboard/da0e20fb-3fbf-4cf8-971c-ac06dadf75c9`}
                loading="lazy"
              ></iframe>
            </Box>

            <Grid container spacing={6}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 8, px: { xs: 1, sm: 2, md: 4 }, py: 4, border: "2px solid #E5E5E5", borderRadius: "5px" }}>
                  <Typography sx={{ mb: 8, fontWeight: 700, fontSize: "28px", color: "#000091" }} component="h3">
                    Les réponses des
                    <br />
                    recruteurs
                  </Typography>
                  <Divider sx={{ mt: 6, mb: 2 }} />
                  <iframe
                    width="100%"
                    max-width="300px"
                    // @ts-expect-error: ?
                    border="none"
                    height="550px"
                    title="stats_reponses_recruteurs"
                    // onLoad={metabaseIframeOnLoad}
                    src={`${publicConfig.baseUrl}/metabase/public/dashboard/17a7b8f6-160c-4510-b723-fdedf961913c`}
                    loading="lazy"
                  ></iframe>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 8, px: { xs: 1, sm: 2, md: 4 }, py: 4, border: "2px solid #E5E5E5", borderRadius: "5px" }}>
                  <Typography sx={{ mb: 8, fontWeight: 700, fontSize: "28px", color: "#000091" }} component="h3">
                    Les réponses des organismes de formation
                  </Typography>
                  <Divider sx={{ mt: 6, mb: 2 }} />
                  <iframe
                    width="100%"
                    max-width="300px"
                    // @ts-expect-error: ?
                    border="none"
                    height="550px"
                    title="stats_reponses_cfa"
                    // onLoad={metabaseIframeOnLoad}
                    src={`${publicConfig.baseUrl}/metabase/public/dashboard/74000a35-edfa-4b6f-b28a-64a3c54a0f22`}
                    loading="lazy"
                  ></iframe>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={value} index={2}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 8, px: { xs: 1, sm: 2, md: 4 }, py: 4, border: "2px solid #E5E5E5", borderRadius: "5px" }}>
                  <Typography sx={{ mb: 8, fontWeight: 700, fontSize: "28px", color: "#000091" }} component="h3">
                    Les signatures de contrat
                  </Typography>
                  <Divider sx={{ mt: 6, mb: 2 }} />
                  <iframe
                    width="100%"
                    max-width="300px"
                    // @ts-expect-error: ?
                    border="none"
                    height="1000px"
                    title="stats_signatures_contrat"
                    // onLoad={metabaseIframeOnLoad}
                    src={`${publicConfig.baseUrl}/metabase/public/dashboard/19e1b709-f955-415b-8212-4e085569810c`}
                    loading="lazy"
                  ></iframe>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 8, px: { xs: 1, sm: 2, md: 4 }, py: 4, border: "2px solid #E5E5E5", borderRadius: "5px" }}>
                  <Typography sx={{ mb: 8, fontWeight: 700, fontSize: "28px", color: "#000091" }} component="h3">
                    Les inscriptions en formation
                  </Typography>
                  <Divider sx={{ mt: 6, mb: 2 }} />
                  <iframe
                    width="100%"
                    max-width="300px"
                    // @ts-expect-error: ?
                    border="none"
                    height="1000px"
                    title="stats_inscriptions_formations"
                    // onLoad={metabaseIframeOnLoad}
                    src={`${publicConfig.baseUrl}/metabase/public/dashboard/c570909c-044a-4906-b0a3-61b6c47c9d6e`}
                    loading="lazy"
                  ></iframe>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
