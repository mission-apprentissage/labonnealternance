import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useContext } from "react"

import { WidgetContext } from "../../../context/contextWidget"
import { InfoCircle } from "../../../theme/components/icons"
import { MailCloud } from "../../../theme/components/logos"
import { AuthentificationLayout } from "../index"

export default function CompteEnAttente() {
  const { widget } = useContext(WidgetContext)
  const router = useRouter()

  const redirectFn = () => router.push(`/organisme-de-formation`)

  return (
    <AuthentificationLayout onClose={redirectFn}>
      <Flex direction={["column", widget?.mobile ? "column" : "row"]} align={widget?.mobile ? "center" : "flex-start"} border="1px solid #000091" mt={[4, 8]} p={[4, 8]}>
        <MailCloud style={{ paddingRight: "10px" }} />
        <Box pt={[3, 0]} ml={10}>
          <Heading fontSize="24px" mb="16px" mt={widget?.mobile ? "10px" : "0px"}>
            Votre demande d’accès est désormais en attente de validation.
          </Heading>
          <>
            <Flex alignItems="flex-start" mb={6}>
              <InfoCircle mr={2} mt={1} />
              <Text textAlign="justify">Vous serez notifié par email une fois votre compte validé, et vous pourrez ensuite publier vos offres d’emplois.</Text>
            </Flex>

            <Flex align="center" ml={5} mb="16px">
              <Button variant="secondary" onClick={redirectFn}>
                Retour à l'accueil
              </Button>
            </Flex>
          </>
        </Box>
      </Flex>
    </AuthentificationLayout>
  )
}
