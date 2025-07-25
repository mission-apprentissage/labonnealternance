"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid2 as Grid, Typography } from "@mui/material"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { ExtendedRecordMap } from "notion-types"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { publicConfig } from "@/config.public"
import { PAGES } from "@/utils/routes.utils"

const NotionRenderer = dynamic(() => import("react-notion-x").then((mod) => mod.NotionRenderer))

export default function CGURendererClient({ recordMap }: { recordMap: ExtendedRecordMap }) {
  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.cgu]} />
      <DefaultContainer>
        <Box sx={{ p: fr.spacing("5w"), marginBottom: fr.spacing("5w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <Grid container spacing={0}>
            <Grid size={{ xs: 12, md: 5 }} sx={{ px: 4 }}>
              <Typography component={"h1"} variant="h1" sx={{ mb: 2 }}>
                Conditions
              </Typography>
              <Typography component={"h1"} variant="h1" sx={{ mb: 2 }}>
                générales
              </Typography>
              <Typography component={"h1"} variant="h1" sx={{ mb: 2, color: fr.colors.decisions.text.default.info.default }}>
                d&apos;utilisation
              </Typography>
              <Box
                component="hr"
                sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 7 }} sx={{ px: 4 }}>
              <Box>
                <NotionRenderer
                  recordMap={recordMap}
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
