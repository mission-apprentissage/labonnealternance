"use client"

import { Box, Container } from "@chakra-ui/react"
import { Tab, Tabs } from "@mui/material"
import { useRouter } from "next/navigation"

import { PAGES } from "@/utils/routes.utils"

export enum EAdminPages {
  GESTION_RECRUTEURS = "GESTION_RECRUTEURS",
  ENTREPRISES_ALGO = "ENTREPRISES_ALGO",
  RECHERCHE_RENDEZ_VOUS = "RECHERCHE_RENDEZ_VOUS",
  GESTION_ADMINISTRATEURS = "GESTION_ADMINISTRATEURS",
}

const pageDefs = [
  { page: EAdminPages.GESTION_RECRUTEURS, path: PAGES.static.backAdminHome.getPath() },
  { page: EAdminPages.ENTREPRISES_ALGO, path: PAGES.static.backAdminGestionDesEntreprises.getPath() },
  { page: EAdminPages.RECHERCHE_RENDEZ_VOUS, path: PAGES.static.rendezVousApprentissageRecherche.getPath() },
  { page: EAdminPages.GESTION_ADMINISTRATEURS, path: PAGES.static.backAdminGestionDesAdministrateurs.getPath() },
]

const NavigationAdmin = ({ currentPage }: { currentPage: EAdminPages }) => {
  const router = useRouter()

  let selectedIndex = pageDefs.findIndex((page) => page.page === currentPage)
  if (selectedIndex === -1) {
    selectedIndex = 0
  }

  const handleTabsChange = (event, index) => {
    const pageDef = pageDefs[index] ?? pageDefs[0]
    router.push(pageDef.path)
  }

  return (
    <Box mt={4}>
      <Container as="header" maxW="container.xl" flexGrow="1">
        <Box className="fr-tabs">
          <Tabs className="fr-tabs__list" value={selectedIndex} onChange={handleTabsChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
            <Tab label="Gestion des recruteurs" className="fr-tabs__tab" wrapped data-testid="recruiter_management_tab" />
            <Tab label="Entreprises de l'algorithme" className="fr-tabs__tab" wrapped data-testid="algo_company_tab" />
            <Tab label="Rendez-vous apprentissage" className="fr-tabs__tab" wrapped data-testid="recherche_rendez_vous_apprentissage_tab" />
            <Tab label="Gestion des administrateurs" className="fr-tabs__tab" wrapped data-testid="administrator_management_tab" />
          </Tabs>
        </Box>
      </Container>
    </Box>
  )
}

export default NavigationAdmin
