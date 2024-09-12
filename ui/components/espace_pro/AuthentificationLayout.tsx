import { Box, Button, Container, Flex, Image } from "@chakra-ui/react"
import Link from "next/link"
import { useRouter } from "next/router"
import { useContext } from "react"

import { WidgetContext } from "../../context/contextWidget"
import { Close } from "../../theme/components/icons"
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
    <Container maxW="container.xl" py={4}>
      <InfoBanner />
      <Flex direction="column">
        <Flex justifyContent="space-between" align="center" justify="center" mb={["4", "0"]}>
          <Link href="/" aria-label="Retour à la page d'accueil">
            <Flex direction="row" align="center">
              <Image src="/images/espace_pro/logo.svg" aria-hidden={true} alt="" />
              <LbaNew ml={4} w="143px" h="37px" />
            </Flex>
          </Link>
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
