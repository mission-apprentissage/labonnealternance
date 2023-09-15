import { Button, Container, Flex, Box } from "@chakra-ui/react"
import { useContext } from "react"
import { WidgetContext } from "../contextWidget"
import { Close } from "../theme/components/icons"
import { LbaNew } from "../theme/components/logos"
import Logo from "./Layout/Logo"
import { redirect } from "../common/utils/router"

export default (props) => {
  const { widget } = useContext(WidgetContext)

  const redirectFn = () => {
    const isCfa = window.location.pathname.includes("cfa") ? true : false

    if (isCfa) {
      return redirect(`/organisme-de-formation`)
    } else {
      return redirect(`/acces-recruteur`)
    }
  }

  if (widget?.isWidget) {
    return <Box m={2}>{props.children}</Box>
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
            onClick={props.fromDashboard ? () => props.onClose() : () => redirectFn()}
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
