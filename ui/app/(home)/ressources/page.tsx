"use client"
import { Box, Button, Container, Grid, GridItem, List, ListItem, Text } from "@chakra-ui/react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import RessourcesCandidat from "@/components/Ressources/ressourcesCandidat"
import RessourcesCFA from "@/components/Ressources/ressourcesCFA"
import RessourcesRecruteur from "@/components/Ressources/ressourcesRecruteur"

import { PAGES } from "../../../utils/routes.utils"
import Breadcrumb from "../../components/Breadcrumb"

const selectedVerticalTabCssProperties = {
  color: "#1d1d1d",
  background: "white",
  borderLeftColor: "#000091",
}

const hoverTabCssProperties = { background: "#F5F5FE !important" }

const buttonProperties = {
  padding: "8px",
  height: "50px",
  background: "none",
  fontWeight: "bold",
  borderRadius: 0,
}

const verticalButtonProperties = {
  ...buttonProperties,
  width: "100%",
  paddingRight: "12px",
}

const selectedVerticalButtonProperties = {
  ...verticalButtonProperties,
  color: "#000091",
}

const horizontalButtonProperties = {
  ...buttonProperties,
  borderBottom: "3px solid",
  borderBottomColor: "#E5E5E5",
  marginRight: "16px",
}
const selectedHorizontalButtonProperties = {
  ...horizontalButtonProperties,
  borderBottomColor: "#000091",
  color: "#000091",
}

export default function Ressources() {
  const pathname = usePathname()
  const [tabIndex, setTabIndex] = useState("candidat")

  useEffect(() => {
    const hash = pathname.split("#")[1]
    setTabIndex(hash || "candidat")
  }, [pathname])

  const getTabContent = () => {
    switch (tabIndex) {
      case "recruteur": {
        return <RessourcesRecruteur />
      }
      case "cfa": {
        return <RessourcesCFA />
      }
      default: {
        return <RessourcesCandidat />
      }
    }
  }

  const getButton = ({ type, alignment }: { type: string; alignment: string }) => {
    let text = "Candidats"

    switch (type) {
      case "recruteur": {
        text = "Recruteurs"
        break
      }
      case "cfa": {
        text = "Organismes de formation"
        break
      }
      default:
        break
    }

    return (
      <Button
        _hover={hoverTabCssProperties}
        justifyContent="left"
        style={
          tabIndex === type
            ? alignment === "vertical"
              ? selectedVerticalButtonProperties
              : selectedHorizontalButtonProperties
            : alignment === "vertical"
              ? verticalButtonProperties
              : horizontalButtonProperties
        }
        onClick={() => {
          window.location.hash = type
          setTabIndex(type)
        }}
        aria-label={`Afficher les ressources pour ${text}`}
      >
        {text}
      </Button>
    )
  }

  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.ressources]} />

      <Container p={{ base: 2, md: 0 }} my={0} mb={[0, 12]} variant="whitePageContainer">
        <Box as="h1" mb={8}>
          <Text as="span" display="block" mb={1} variant="editorialContentH1">
            Ressources
          </Text>
        </Box>
        <Grid templateColumns="repeat(5, 1fr)" gap={10}>
          <GridItem display={{ base: "none", lg: "block" }} colSpan={{ base: 0, lg: 1 }}>
            <List>
              <ListItem borderLeft="3px solid" borderLeftColor="white" style={tabIndex === "candidat" ? selectedVerticalTabCssProperties : {}}>
                {getButton({ type: "candidat", alignment: "vertical" })}
              </ListItem>
              <ListItem borderLeft="3px solid" borderLeftColor="white" style={tabIndex === "recruteur" ? selectedVerticalTabCssProperties : {}}>
                {getButton({ type: "recruteur", alignment: "vertical" })}
              </ListItem>
              <ListItem borderLeft="3px solid" borderLeftColor="white" style={tabIndex === "cfa" ? selectedVerticalTabCssProperties : {}}>
                {getButton({ type: "cfa", alignment: "vertical" })}
              </ListItem>
            </List>
          </GridItem>
          <GridItem colSpan={{ base: 5, lg: 4 }}>
            <Box>
              <Box display={{ base: "block", lg: "none" }} mb={6}>
                {getButton({ type: "candidat", alignment: "horizontal" })}
                {getButton({ type: "recruteur", alignment: "horizontal" })}
                {getButton({ type: "cfa", alignment: "horizontal" })}
              </Box>
              <Box style={{ clear: "both" }}>{getTabContent()}</Box>
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  )
}
