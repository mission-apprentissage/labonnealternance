import { Box, Text } from "@chakra-ui/react"

import { getCurrentDate, getCurrentHourMinute } from "../../../common/utils/dateUtils"

export const CfaCandidatInformationAnswered = (props) => {
  return (
    <Box mt={8} p={6} backgroundColor="#F5F5FE">
      <Text as="h2" fontWeight="700" color="#000091" fontSize="22px" lineHeight="36px">
        Votre réponse au candidat
      </Text>
      <Text as="p" mt="7" fontWeight="700" color="#1E1E1E" fontSize="18px" lineHeight="28px">
        Votre réponse a été envoyée !
      </Text>
      <Text as="p" fontWeight="700" color="#666666" fontSize="16px" lineHeight="24px">
        Réponse envoyée le {getCurrentDate()} à {getCurrentHourMinute()}
      </Text>
      <Text as="p" mt="5" fontWeight="400" color="#929292" fontSize="16px" lineHeight="24px">
        {props.msg}
      </Text>
    </Box>
  )
}
