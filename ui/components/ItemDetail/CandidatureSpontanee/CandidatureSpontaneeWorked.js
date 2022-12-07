import { Box, Container, Flex, Image, Text } from "@chakra-ui/react"
import React from "react"
import paperplaneIcon from "../../../public/images/paperplane2.svg"
import { testingParameters } from "../../../utils/testingParameters"

const CandidatureSpontaneeWorked = ({ email, company, kind }) => {
  return (
    <Container data-testid="CandidatureSpontaneeWorked">
      <Text as="h1" fontSize="24px" fontWeight={700} data-testid="CandidatureSpontaneeWorkedTitle">
        {kind === "matcha" ? <>Postuler à l&apos;offre de {company}</> : <>Candidature spontanée</>}
      </Text>

      <Flex direction="row" alignItems="center" my={12}>
        <Image src={paperplaneIcon} alt="" />
        <Box pl={4} ml={4}>
          <Text as="h2" fontSize="20px" fontWeight={700}>
            Votre candidature a bien été envoyée à{" "}
            <Text as="span" fontSize="22px">
              {company}
            </Text>
          </Text>
          {testingParameters?.simulatedRecipient && <Text>Les emails ont été envoyés à {testingParameters.simulatedRecipient}</Text>}
        </Box>
      </Flex>
      <Text fontSize="18px">
        Un e-mail de confirmation vous a été envoyé sur votre boite e-mail{" "}
        <Text as="span" fontWeight={700} color="#f07f87">
          {email}
        </Text>
      </Text>
      <Text fontSize="18px" mt={4} mb={12}>
        Si vous n&apos;avez pas reçu d&apos;email de confirmation d&apos;ici 24 heures, soumettez à nouveau votre candidature
      </Text>
    </Container>
  )
}

export default CandidatureSpontaneeWorked
