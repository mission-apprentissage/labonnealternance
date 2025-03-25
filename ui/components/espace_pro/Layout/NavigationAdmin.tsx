"use client"

import { Box, Container, Tab, TabList, Tabs } from "@chakra-ui/react"
import { useRouter } from "next/navigation"

import { PAGES } from "@/utils/routes.utils"

export enum EAdminPages {
  GESTION_RECRUTEURS = "GESTION_RECRUTEURS",
  ENTREPRISES_ALGO = "ENTREPRISES_ALGO",
  GESTION_ADMINISTRATEURS = "GESTION_ADMINISTRATEURS",
}

const selectedTabParams = {
  color: "bluefrance.500",
  background: "white",
  border: "none",
  borderBottom: "2px solid",
  borderBottomColor: "bluefrance.500",
  cursor: "unset",
  opacity: 1,
}

const tabParams = {
  color: "#161616",
  background: "white",
  marginRight: 2,
  fontSize: "14px",
  p: { base: 1, sm: 4 },
}

const focusedTabParams = {}

const pageDefs = [
  {
    page: EAdminPages.GESTION_RECRUTEURS,
    path: PAGES.static.backAdminHome.getPath(),
  },
  {
    page: EAdminPages.ENTREPRISES_ALGO,
    path: PAGES.static.backAdminGestionDesEntreprises.getPath(),
  },
  {
    page: EAdminPages.GESTION_ADMINISTRATEURS,
    path: PAGES.static.backAdminGestionDesAdministrateurs.getPath(),
  },
]

const NavigationAdmin = ({ currentPage }: { currentPage: EAdminPages }) => {
  const router = useRouter()

  let selectedIndex = pageDefs.findIndex((page) => page.page === currentPage)
  if (selectedIndex === -1) {
    selectedIndex = 0
  }

  const handleTabsChange = (index) => {
    const pageDef = pageDefs[index] ?? pageDefs[0]
    router.push(pageDef.path)
  }

  return (
    <Box
      sx={{
        boxShadow: "0px 1px 8px rgba(8, 67, 85, 0.24)",
      }}
    >
      <Container as="header" maxW="container.xl" flexGrow="1">
        <Tabs variant="unstyled" index={selectedIndex} onChange={handleTabsChange}>
          <TabList px={0}>
            <Tab data-testid="recruiter_management_tab" {...tabParams} isDisabled={selectedIndex === 0} _focus={focusedTabParams} _selected={selectedTabParams}>
              Gestion des recruteurs
            </Tab>
            <Tab data-testid="algo_company_tab" {...tabParams} isDisabled={selectedIndex === 1} _focus={focusedTabParams} _selected={selectedTabParams}>
              Entreprises de l'algorithme
            </Tab>
            <Tab data-testid="administrator_management_tab" {...tabParams} isDisabled={selectedIndex === 2} _focus={focusedTabParams} _selected={selectedTabParams}>
              Gestion des administrateurs
            </Tab>
          </TabList>
        </Tabs>
      </Container>
    </Box>
  )
}

export default NavigationAdmin
