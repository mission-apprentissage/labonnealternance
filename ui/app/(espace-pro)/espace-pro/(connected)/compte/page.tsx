"use client"

import { Container } from "@chakra-ui/react"
import Box from "@mui/material/Box"

import CompteRenderer from "@/app/(espace-pro)/espace-pro/(connected)/compte/CompteRenderer"
import { useUserNavigationContext } from "@/app/(espace-pro)/espace-pro/(connected)/hooks/useUserNavigationContext"
import { Breadcrumb } from "@/components/espace_pro/common/components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"

export default function Compte() {
  const userNavigationContext = useUserNavigationContext()

  return (
    <Container maxW="container.xl">
      <Box mt="16px" mb={6}>
        <Breadcrumb pages={[PAGES.dynamic.administrationDesOffres(userNavigationContext), PAGES.dynamic.compte()]} />
      </Box>
      <CompteRenderer />
    </Container>
  )
}
