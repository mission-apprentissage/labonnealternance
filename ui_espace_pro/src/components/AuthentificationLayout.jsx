import { Button, Container, Flex } from "@chakra-ui/react"
import { useContext } from "react"
import { WidgetContext } from "../contextWidget"
import { Close } from "../theme/components/icons"
import { LbaNew } from "../theme/components/logos"
import Logo from "./Layout/Logo"

export default (props) => {
  const { widget } = useContext(WidgetContext)

  const redirect = () => {
    const isCfa = window.location.pathname.includes("cfa") ? true : false

    if (isCfa) {
      return window.location.assign(`/organisme-de-formation`)
    } else {
      return window.location.assign(`/acces-recruteur`)
    }
  }

  if (widget?.isWidget) {
    return props.children
  }

  return (
    <Container maxW="container.xl" px={4} py={4}>
      <Flex direction="column" px={[0, 4]}>
        <Flex justifyContent="space-between" align="center" justify="center" mb={["4", "0"]}>
          <Flex direction="row" align="center" px={[0, 4]}>
            <Logo display={["none", "flex"]} />
            <LbaNew />
          </Flex>
          <Button
            display="flex"
            onClick={props.fromDashboard ? () => props.onClose() : () => redirect()}
            fontWeight="normal"
            variant="pill"
            color="bluefrance.500"
            rightIcon={<Close width={3} />}
          >
            {props.fromDashboard ? "fermer" : "Retour à l'accueil"}
          </Button>
        </Flex>
        <Container maxW="full">{props.children}</Container>
      </Flex>
    </Container>
  )
}
