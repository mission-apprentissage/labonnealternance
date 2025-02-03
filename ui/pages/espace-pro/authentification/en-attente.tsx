import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"

import { BorderedBox } from "@/components/espace_pro/common/components/BorderedBox"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

import { AuthentificationLayout } from "../../../components/espace_pro"
import { InfoCircle } from "../../../theme/components/icons"
import { MailCloud } from "../../../theme/components/logos"

export default function CompteEnAttente() {
  const router = useRouter()

  const redirectFn = () => router.push(`/organisme-de-formation`)

  return (
    <AuthentificationLayout onClose={redirectFn}>
      <DepotSimplifieStyling>
        <BorderedBox display="flex" flexDirection={["column", "column", "column", "row"]} gap={[3, 4, 4, 12]} justifyContent="center" width="100%" mt={4}>
          <MailCloud w={["120px", "120px", "120px", "269px"]} h={["67px", "67px", "67px", "151px"]} />
          <Box>
            <Heading className="big" mb={3}>
              Votre demande d’accès est désormais en attente de validation.
            </Heading>
            <Flex alignItems="flex-start" mb={6}>
              <InfoCircle mr={2} mt={1} />
              <Text>Vous serez notifié par email une fois votre compte validé, et vous pourrez ensuite publier vos offres d’emplois.</Text>
            </Flex>

            <Flex align="center" ml={5} mb={4}>
              <Button variant="secondary" onClick={redirectFn}>
                Retour à l'accueil
              </Button>
            </Flex>
          </Box>
        </BorderedBox>
      </DepotSimplifieStyling>
    </AuthentificationLayout>
  )
}
