import { Box, Button, Container, Grid, GridItem, List, ListItem, Text } from "@chakra-ui/react"
import { NextSeo } from "next-seo"
import React, { useState } from "react"

import RessourcesCandidat from "@/components/Ressources/ressourcesCandidat"
import RessourcesCFA from "@/components/Ressources/ressourcesCFA"
import RessourcesRecruteur from "@/components/Ressources/ressourcesRecruteur"

import Breadcrumb from "../components/breadcrumb"
import Footer from "../components/footer"
import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"

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
  paddingRight: "50px",
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

const Ressources = () => {
  const [tabIndex, setTabIndex] = useState("Candidat")

  const getTabContent = () => {
    switch (tabIndex) {
      case "Recruteur": {
        return <RessourcesRecruteur />
      }
      case "Organisme de formation": {
        return <RessourcesCFA />
      }
      default: {
        return <RessourcesCandidat />
      }
    }
  }

  const getButton = ({ type, alignment }: { type: string; alignment: string }) => {
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
        onClick={() => setTabIndex(type)}
        aria-label={`Afficher les ressources pour ${type}`}
      >
        {type}
      </Button>
    )
  }

  return (
    <Box>
      <NextSeo title="Ressources | La bonne alternance | Trouvez votre alternance" description="Ressources alternance..." />

      <ScrollToTop />
      <Navigation />

      <Breadcrumb forPage="ressources" label="Ressources" />

      <Container p={{ base: 2, md: 0 }} my={0} mb={[0, 12]} variant="whitePageContainer">
        <Box as="h1" mb={8}>
          <Text as="span" display="block" mb={1} variant="editorialContentH1">
            Ressources
          </Text>
        </Box>
        <Grid templateColumns="repeat(5, 1fr)">
          <GridItem display={{ base: "none", lg: "block" }} colSpan={{ base: 0, lg: 1 }}>
            <List>
              <ListItem borderLeft="3px solid" borderLeftColor="white" style={tabIndex === "Candidat" ? selectedVerticalTabCssProperties : {}}>
                {getButton({ type: "Candidat", alignment: "vertical" })}
              </ListItem>
              <ListItem borderLeft="3px solid" borderLeftColor="white" style={tabIndex === "Recruteur" ? selectedVerticalTabCssProperties : {}}>
                {getButton({ type: "Recruteur", alignment: "vertical" })}
              </ListItem>
              <ListItem borderLeft="3px solid" borderLeftColor="white" style={tabIndex === "Organisme de formation" ? selectedVerticalTabCssProperties : {}}>
                {getButton({ type: "Organisme de formation", alignment: "vertical" })}
              </ListItem>
            </List>
          </GridItem>
          <GridItem colSpan={{ base: 5, lg: 4 }}>
            <Box>
              <Box display={{ base: "block", lg: "none" }} mb={6}>
                {getButton({ type: "Candidat", alignment: "horizontal" })}
                {getButton({ type: "Recruteur", alignment: "horizontal" })}
                {getButton({ type: "Organisme de formation", alignment: "horizontal" })}
              </Box>
              <Box style={{ clear: "both" }}>{getTabContent()}</Box>
            </Box>
          </GridItem>
        </Grid>
      </Container>
      <Box mb={3}>&nbsp;</Box>
      <Footer />
    </Box>
  )
}

export default Ressources
