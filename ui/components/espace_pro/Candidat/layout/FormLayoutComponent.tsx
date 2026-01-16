import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container } from "@mui/material"
import type { PropsWithChildren, ReactNode } from "react"

import { FormHeaderComponent } from "./FormHeaderComponent"
import { Footer } from "@/app/_components/Footer"

export const FormLayoutComponent = ({ children, headerText }: PropsWithChildren<{ headerText: ReactNode }>) => {
  return (
    <Container sx={{ boxShadow: "0px 0px 24px rgba(30, 30, 30, 0.24)" }} disableGutters>
      <FormHeaderComponent>{headerText}</FormHeaderComponent>
      <Box role="main" component="main" sx={{ mx: { xs: fr.spacing("2w"), sm: fr.spacing("12w"), md: fr.spacing("12w") } }}>
        {children}
      </Box>
      <Footer hideLinkList />
    </Container>
  )
}
