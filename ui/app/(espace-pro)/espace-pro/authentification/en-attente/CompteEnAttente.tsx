"use client"
import { Box, Flex, Heading, Text } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import { useRouter } from "next/navigation"

import { BorderedBox } from "@/components/espace_pro/common/components/BorderedBox"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { InfoCircle } from "@/theme/components/icons"
import { MailCloud } from "@/theme/components/logos"
import { PAGES } from "@/utils/routes.utils"

export default function CompteEnAttente() {
  const router = useRouter()

  const redirectFn = () => router.push(PAGES.static.organismeDeFormation.getPath())

  return (
    <DepotSimplifieStyling>
      <BorderedBox display="flex" flexDirection={["column", "column", "column", "row"]} gap={[3, 4, 4, 12]} justifyContent="center" width="100%" my={8}>
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
            <Button priority="secondary" onClick={redirectFn}>
              Retour à l'accueil
            </Button>
          </Flex>
        </Box>
      </BorderedBox>
    </DepotSimplifieStyling>
  )
}
