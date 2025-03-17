"use client"

import { Box, Container, Tab, TabList, Tabs } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { assertUnreachable } from "shared"

export enum EAdminPages {
  GESTION_RECRUTEURS = "GESTION_RECRUTEURS",
  ENTREPRISES_ALGO = "ENTREPRISES_ALGO",
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

const getTabIndex = (currentPage) => {
  switch (currentPage) {
    case EAdminPages.GESTION_RECRUTEURS:
      return 0
    case EAdminPages.ENTREPRISES_ALGO:
      return 1
    default:
      return 0
  }
}

const NavigationAdmin = ({ currentPage }) => {
  const selectedIndex = getTabIndex(currentPage)

  const router = useRouter()

  const handleTabsChange = (index) => {
    switch (index) {
      case 0: {
        router.push("/espace-pro/administration/users")
        break
      }
      case 1: {
        router.push("/espace-pro/administration/gestionEntreprises")
        break
      }
      default: {
        assertUnreachable("unknown tab" as never)
        break
      }
    }
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
          </TabList>
        </Tabs>
      </Container>
    </Box>
  )
}

export default NavigationAdmin
