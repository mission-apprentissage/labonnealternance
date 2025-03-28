"use client"

import { Box, Container, Divider, SimpleGrid, Text } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { publicConfig } from "@/config.public"
import { PAGES } from "@/utils/routes.utils"

const NotionRenderer = dynamic(() => import("react-notion-x").then((mod) => mod.NotionRenderer), { ssr: false })

export const AccessibilitePage = ({ recordMap }) => {
  return (
    <Box as="main">
      <Breadcrumb pages={[PAGES.static.accessibilite]} />
      <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
        <SimpleGrid columns={[1, 1, 1, 2]}>
          <Box>
            <Box as="h1">
              <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">
                Déclaration
              </Text>
              <Text as="span" display="block" mb={1} variant="editorialContentH1">
                d'accessibilité
              </Text>
            </Box>
            <Divider variant="pageTitleDivider" my={12} />
          </Box>
          <NotionRenderer
            recordMap={recordMap}
            fullPage={false}
            darkMode={false}
            disableHeader={true}
            rootDomain={publicConfig.baseUrl}
            className="disable-chakra"
            components={{
              nextImage: Image,
              nextLink: Link,
            }}
          />
        </SimpleGrid>
      </Container>
    </Box>
  )
}
