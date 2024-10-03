import { Box, Button, Container, Flex, Image } from "@chakra-ui/react"
import Link from "next/link"
import { useRouter } from "next/router"
import { useContext } from "react"

import { WidgetContext } from "../../context/contextWidget"
import { ArrowLeft } from "../../theme/components/icons"
import { LbaNew } from "../../theme/components/logos_pro"
import InfoBanner from "../InfoBanner/InfoBanner"

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
      <InfoBanner showInfo={false} showAlert={false} />
      <Flex direction="column" px={[0, 4]}>
        <Flex direction={["column", "row"]} justifyContent="space-between" align={["left", "center"]} justify={["left", "center"]} mb={["4", "0"]}>
          <Link href="/" aria-label="Retour à la page d'accueil">
            <Flex direction="row" align="center" px={[0, 4]}>
              <Image src="/images/marianne.svg" aria-hidden={true} alt="" width="108" height="90" />
              <LbaNew ml={4} w="143px" h="37px" />
            </Flex>
          </Link>
          <Box pt={[3, 0]}>
            <Button
              onClick={props.fromDashboard ? () => props.onClose() : () => redirectFn()}
              fontWeight="normal"
              variant="pill"
              color="bluefrance.500"
              // rightIcon={<Close width={3} />}
              leftIcon={<ArrowLeft w="w" />}
            >
              {props.fromDashboard ? "fermer" : "Retour à l'accueil"}
            </Button>
          </Box>
        </Flex>
        <Container px={1} maxW="full">
          {props.children}
        </Container>
      </Flex>
    </Container>
  )
}
