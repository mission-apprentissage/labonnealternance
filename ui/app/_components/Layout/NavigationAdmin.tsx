"use client"

import { Box, Container } from "@chakra-ui/react"
import { Tab, Tabs } from "@mui/material"
import { useRouter } from "next/navigation"

import { PAGES } from "@/utils/routes.utils"

const AdminPages = {
  GESTION_RECRUTEURS: PAGES.static.backAdminHome.getPath(),
  ENTREPRISES_ALGO: PAGES.static.backAdminGestionDesEntreprises.getPath(),
  RECHERCHE_RENDEZ_VOUS: PAGES.static.rendezVousApprentissageRecherche.getPath(),
  GESTION_ADMINISTRATEURS: PAGES.static.backAdminGestionDesAdministrateurs.getPath(),
  GESTION_PROCESSEURS: PAGES.static.adminProcessor.getPath(),
}

export type IAdminPage = keyof typeof AdminPages

const NavigationAdmin = ({ currentPage }: { currentPage: IAdminPage }) => {
  const router = useRouter()

  let selectedIndex = Object.keys(AdminPages).findIndex((page) => page === currentPage)
  if (selectedIndex === -1) {
    selectedIndex = 0
  }

  const handleTabsChange = (event, index) => {
    const pageDef = Object.keys(AdminPages)[index]
    const pagePath = AdminPages[pageDef as IAdminPage]
    router.push(pagePath)
  }

  return (
    <Box mt={4}>
      <Container as="header" maxW="container.xl" flexGrow="1">
        <Tabs value={selectedIndex} onChange={handleTabsChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
          <Tab label="Gestion des recruteurs" wrapped data-testid="recruiter_management_tab" />
          <Tab label="Entreprises de l'algorithme" wrapped data-testid="algo_company_tab" />
          <Tab label="Rendez-vous apprentissage" wrapped data-testid="recherche_rendez_vous_apprentissage_tab" />
          <Tab label="Gestion des administrateurs" wrapped data-testid="administrator_management_tab" />
          <Tab label="Gestion des processeurs" wrapped data-testid="administrator_processeur_tab" />
        </Tabs>
      </Container>
    </Box>
  )
}

export default NavigationAdmin
