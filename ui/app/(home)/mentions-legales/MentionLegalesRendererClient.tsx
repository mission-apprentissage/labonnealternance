"use client"
import { Box, Container, Divider, Grid, GridItem, Text } from "@chakra-ui/react"
import dynamic from "next/dynamic"

import { publicConfig } from "@/config.public"

import { PAGES } from "../../../utils/routes.utils"
import { Breadcrumb } from "../../_components/Breadcrumb"

const NotionRenderer = dynamic(() => import("react-notion-x").then((mod) => mod.NotionRenderer))

export default function MentionLegalesRendererClient({ mentionsLegales }) {
  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.mentionsLegales]} />
      <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
        <Grid templateColumns="repeat(12, 1fr)">
          <GridItem px={4} colSpan={[12, 12, 12, 5]}>
            <Box as="h1">
              <Text as="span" display="block" mb={1} variant="editorialContentH1">
                Mentions légales
              </Text>
            </Box>
            <Divider variant="pageTitleDivider" my={12} />
          </GridItem>
          <GridItem px={4} colSpan={[12, 12, 12, 7]}>
            <Box>
              <NotionRenderer recordMap={mentionsLegales} fullPage={false} darkMode={false} disableHeader={true} rootDomain={publicConfig.baseUrl} bodyClassName="notion-body" />
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  )
}
