"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Container } from "@mui/material"

import NavigationAdmin, { EAdminPages } from "@/app/_components/Layout/NavigationAdmin"

export const AdminLayout = ({ currentAdminPage, children }: { currentAdminPage: EAdminPages; children: React.ReactNode }) => {
  return (
    <>
      <NavigationAdmin currentPage={currentAdminPage} />
      <Container maxWidth="xl" sx={{ paddingY: 0, paddingRight: 0, paddingLeft: fr.spacing("4w") }}>
        {children}
      </Container>
    </>
  )
}
