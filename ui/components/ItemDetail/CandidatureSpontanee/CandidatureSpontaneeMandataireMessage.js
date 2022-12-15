import { Flex, Image, Text } from "@chakra-ui/react"
import React from "react"

const CandidatureSpontaneeMandataireMessage = ({ item }) => {
  return (
    item?.company?.mandataire && (
      <Flex direction="row" width="95%" alignItems="center">
        <Image src="/images/info.svg" alt="" />
        <Text ml={3}>
          Votre candidature sera envoyée au centre de formation en charge du recrutement pour le compte de l&apos;entreprise.
          <br />
          <Text as="span" fontWeight={700}>
            Vous pouvez candidater à l’offre même si vous avez déjà trouvé votre formation par ailleurs.
          </Text>
        </Text>
      </Flex>
    )
  )
}

export default CandidatureSpontaneeMandataireMessage
