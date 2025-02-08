"use client"
import { Box, Container, Divider, Grid, GridItem, Text } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import Link from "next/link"

import Breadcrumb from "@/app/components/Breadcrumb"
import { publicConfig } from "@/config.public"
import { PAGES } from "@/utils/routes.utils"

const NotionRenderer = dynamic(() => import("react-notion-x").then((mod) => mod.NotionRenderer))

export default function CGURendererClient({ recordMap }: { recordMap: any }) {
  return (
    <Box>
      <Box as="main">
        <Breadcrumb pages={[PAGES.static.cgu]} />
        <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
          <Grid templateColumns="repeat(12, 1fr)">
            <GridItem px={4} colSpan={[12, 12, 12, 5]}>
              <Box as="h1">
                <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">
                  Conditions
                </Text>
                <Text as="span" display="block" mb={1} variant="editorialContentH1">
                  générales
                </Text>
                <Text as="span" display="block" mb={1} variant="editorialContentH1">
                  d&apos;utilisation
                </Text>
              </Box>
              <Divider variant="pageTitleDivider" my={12} />
            </GridItem>
            <GridItem px={4} colSpan={[12, 12, 12, 7]}>
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
            </GridItem>
          </Grid>
        </Container>
        <Box mb={3}>&nbsp;</Box>
      </Box>
    </Box>
  )
}
