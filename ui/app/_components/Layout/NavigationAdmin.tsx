"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Tab, Tabs } from "@mui/material"
import { useRouter } from "next/navigation"

import { tabSx } from "@/components/espace_pro/CreationRecruteur/CustomTabs"
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

  const handleTabsChange = (event: unknown, index: number) => {
    const pageDef = Object.keys(AdminPages)[index]
    const pagePath = AdminPages[pageDef as IAdminPage]
    router.push(pagePath)
  }

  return (
    <Box sx={{ mt: fr.spacing("3w") }}>
      <Tabs value={selectedIndex} onChange={handleTabsChange}>
        <Tab sx={tabSx} label="Gestion des recruteurs" data-testid="recruiter_management_tab" />
        <Tab sx={tabSx} label="Entreprises de l'algorithme" data-testid="algo_company_tab" />
        <Tab sx={tabSx} label="Rendez-vous apprentissage" data-testid="recherche_rendez_vous_apprentissage_tab" />
        <Tab sx={tabSx} label="Gestion des administrateurs" data-testid="administrator_management_tab" />
        <Tab sx={tabSx} label="Gestion des jobs" data-testid="administrator_processeur_tab" />
      </Tabs>
    </Box>
  )
}

export default NavigationAdmin
