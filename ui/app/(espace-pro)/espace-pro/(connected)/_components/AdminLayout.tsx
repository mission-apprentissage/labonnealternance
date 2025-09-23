"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Container } from "@mui/material"

import NavigationAdmin, { type IAdminPage } from "@/app/_components/Layout/NavigationAdmin"

export const AdminLayout = ({ currentAdminPage, children }: { currentAdminPage: IAdminPage; children: React.ReactNode }) => {
  return (
    <>
      <NavigationAdmin currentPage={currentAdminPage} />
      <Container maxWidth="xl" sx={{ paddingY: 0, px: fr.spacing("2w"), paddingBottom: fr.spacing("4w") }}>
        {children}
      </Container>
    </>
  )
}
