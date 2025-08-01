import { Box, Container, ContainerProps } from "@chakra-ui/react"
import { PropsWithChildren, ReactNode } from "react"

import { FormCreatePageFooter } from "../FormCreatePageFooter"

import { FormHeaderComponent } from "./FormHeaderComponent"

export const FormLayoutComponent = ({ children, headerText, ...rest }: PropsWithChildren<ContainerProps & { headerText: ReactNode }>) => {
  return (
    <Container maxW="full" p={0} {...rest} boxShadow="0px 0px 24px rgba(30, 30, 30, 0.24)" maxWidth="82ch">
      <FormHeaderComponent>{headerText}</FormHeaderComponent>
      <Box mx={["2rem", "2rem", "6rem"]} minH={"63vh"}>
        {children}
      </Box>
      <FormCreatePageFooter />
    </Container>
  )
}
