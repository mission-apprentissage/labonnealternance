"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Container } from "@mui/material"

import NavigationAdmin, { EAdminPages } from "@/components/espace_pro/Layout/NavigationAdmin"

export const AdminLayout = ({ currentAdminPage, children }: { currentAdminPage: EAdminPages; children: React.ReactNode }) => {
  return (
    <>
      <header>
        <NavigationAdmin currentPage={currentAdminPage} />
      </header>
      <Container
        maxWidth="xl"
        sx={{
          paddingY: 0,
          paddingRight: 0,
          paddingLeft: fr.spacing("4w"),
        }}
      >
        {children}
      </Container>
    </>
  )
}
