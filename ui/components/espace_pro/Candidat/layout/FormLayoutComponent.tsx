import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container } from "@mui/material"
import { PropsWithChildren, ReactNode } from "react"

import { Footer } from "@/app/_components/Footer"

import { FormHeaderComponent } from "./FormHeaderComponent"

export const FormLayoutComponent = ({ children, headerText }: PropsWithChildren<{ headerText: ReactNode }>) => {
  return (
    <Container sx={{ boxShadow: "0px 0px 24px rgba(30, 30, 30, 0.24)" }} disableGutters>
      <FormHeaderComponent>{headerText}</FormHeaderComponent>
      <Box sx={{ mx: { xs: fr.spacing("6w"), sm: fr.spacing("12w"), md: fr.spacing("12w") } }}>{children}</Box>
      <Footer hideLinkList />
    </Container>
  )
}
