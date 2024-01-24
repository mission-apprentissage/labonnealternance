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
  const [tabIndex, setTabIndex] = useState("candidat")

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
              <ListItem borderLeft="3px solid" borderLeftColor="white" style={tabIndex === "candidat" ? selectedVerticalTabCssProperties : {}}>
                <Button
                  _hover={hoverTabCssProperties}
                  justifyContent="left"
                  style={tabIndex === "candidat" ? selectedVerticalButtonProperties : verticalButtonProperties}
                  onClick={() => setTabIndex("candidat")}
                  aria-label="Afficher les ressources pour les candidats"
                >
                  Candidat
                </Button>
              </ListItem>
              <ListItem borderLeft="3px solid" borderLeftColor="white" style={tabIndex === "recruteur" ? selectedVerticalTabCssProperties : {}}>
                <Button
                  _hover={hoverTabCssProperties}
                  justifyContent="left"
                  style={tabIndex === "recruteur" ? selectedVerticalButtonProperties : verticalButtonProperties}
                  onClick={() => setTabIndex("recruteur")}
                  aria-label="Afficher les ressources pour les recruteurs"
                >
                  Recruteur
                </Button>
              </ListItem>
              <ListItem borderLeft="3px solid" borderLeftColor="white" style={tabIndex === "cfa" ? selectedVerticalTabCssProperties : {}}>
                <Button
                  _hover={hoverTabCssProperties}
                  justifyContent="left"
                  style={tabIndex === "cfa" ? selectedVerticalButtonProperties : verticalButtonProperties}
                  onClick={() => setTabIndex("cfa")}
                  aria-label="Afficher les ressources pour les organismes de formation"
                >
                  Organisme de formation
                </Button>
              </ListItem>
            </List>
          </GridItem>
          <GridItem colSpan={{ base: 5, lg: 4 }}>
            <Box>
              <Box display={{ base: "block", lg: "none" }} mb={6}>
                <Button
                  _hover={hoverTabCssProperties}
                  style={tabIndex === "candidat" ? selectedHorizontalButtonProperties : horizontalButtonProperties}
                  onClick={() => setTabIndex("candidat")}
                  aria-label="Afficher les ressources pour les candidats"
                >
                  Candidat
                </Button>
                <Button
                  _hover={hoverTabCssProperties}
                  style={tabIndex === "recruteur" ? selectedHorizontalButtonProperties : horizontalButtonProperties}
                  onClick={() => setTabIndex("recruteur")}
                  aria-label="Afficher les ressources pour les recruteurs"
                >
                  Recruteur
                </Button>
                <Button
                  _hover={hoverTabCssProperties}
                  style={tabIndex === "cfa" ? selectedHorizontalButtonProperties : horizontalButtonProperties}
                  onClick={() => setTabIndex("cfa")}
                  aria-label="Afficher les ressources pour les organismes de formation"
                >
                  Organisme
                  <br />
                  de formation
                </Button>
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
