import { Box, Text } from "@chakra-ui/react"

export const CfaCandidatInformationOther = () => {
  return (
    <Box mt={8} p={6} backgroundColor="#F5F5FE;">
      <Text as="h2" fontWeight="700" color="#000091" fontSize="22px" lineHeight="36px">
        Votre réponse au candidat
      </Text>
      <Text as="p" mt="7" fontWeight="700" color="#1E1E1E" fontSize="18px" lineHeight="28px">
        Merci pour votre réponse !
      </Text>
      <Text as="p" mt="2" fontWeight="400" color="#929292" fontSize="16px" lineHeight="24px">
        Vous nous avez indiqué avoir répondu au candidat par un autre canal (mail ou téléphone).
      </Text>
    </Box>
  )
}
