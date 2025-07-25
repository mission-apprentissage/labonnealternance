"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid2 as Grid, Typography } from "@mui/material"
import dynamic from "next/dynamic"
import Link from "next/link"
import type { ExtendedRecordMap } from "notion-types"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { publicConfig } from "@/config.public"
import { PAGES } from "@/utils/routes.utils"

const NotionRenderer = dynamic(() => import("react-notion-x").then((mod) => mod.NotionRenderer))

export default function MentionLegalesRendererClient({ mentionsLegales }: { mentionsLegales: ExtendedRecordMap }) {
  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.mentionsLegales]} />
      <DefaultContainer>
        <Box
          sx={{
            p: fr.spacing("5w"),
            marginBottom: fr.spacing("5w"),
            borderRadius: "10px",
            backgroundColor: fr.colors.decisions.background.default.grey.hover,
          }}
        >
          <Grid container spacing={0}>
            <Grid size={{ xs: 12, md: 5 }} sx={{ px: 4 }}>
              <Typography component={"h1"} variant="h1" sx={{ mb: 2, color: fr.colors.decisions.text.default.info.default }}>
                Mentions légales
              </Typography>
              <Box
                component="hr"
                sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 7 }} sx={{ px: 4 }}>
              <Box>
                <NotionRenderer
                  recordMap={mentionsLegales}
                  fullPage={false}
                  darkMode={false}
                  disableHeader={true}
                  rootDomain={publicConfig.baseUrl}
                  bodyClassName="notion-body"
                  components={{
                    nextImage: Image,
                    nextLink: Link,
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
