"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid, Typography } from "@mui/material"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import type { ExtendedRecordMap } from "notion-types"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { publicConfig } from "@/config.public"
import { PAGES } from "@/utils/routes.utils"

const NotionRenderer = dynamic(async () => import("react-notion-x").then((mod) => mod.NotionRenderer), { ssr: false })

export const AccessibilitePage = ({ recordMap }: { recordMap: ExtendedRecordMap }) => {
  return (
    <Box component="main">
      <Breadcrumb pages={[PAGES.static.accessibilite]} />
      <DefaultContainer>
        <Box
          sx={{
            p: { xs: fr.spacing("2w"), md: fr.spacing("5w") },
            marginBottom: fr.spacing("5w"),
            borderRadius: "10px",
            backgroundColor: fr.colors.decisions.background.default.grey.hover,
          }}
        >
          <Grid container spacing={0}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography sx={{ mb: fr.spacing("1w") }} variant="h1" component={"h1"}>
                Déclaration
              </Typography>
              <Typography sx={{ mb: fr.spacing("1w"), color: fr.colors.decisions.text.default.info.default }} variant="h1" component={"h1"}>
                d'accessibilité
              </Typography>
              <Box
                component="hr"
                sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 7 }}>
              <NotionRenderer
                recordMap={recordMap}
                fullPage={false}
                darkMode={false}
                disableHeader={true}
                rootDomain={publicConfig.baseUrl}
                className="notion-body"
                components={{
                  nextImage: Image,
                  nextLink: Link,
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
