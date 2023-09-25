import { Box, Button, Container, Flex } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useContext } from "react"

import { WidgetContext } from "../../context/contextWidget"
import { Close } from "../../theme/components/icons"
import { LbaNew } from "../../theme/components/logos_pro"

import Logo from "./Layout/Logo"

export default function AuthentificationLayout(props) {
  const router = useRouter()
  const { widget } = useContext(WidgetContext)

  const redirectFn = () => {
    const isCfa = router.pathname.includes("cfa") || router.query?.type?.includes("CFA") ? true : false

    if (isCfa) {
      return router.push(`/organisme-de-formation`)
    } else {
      return router.push(`/acces-recruteur`)
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
