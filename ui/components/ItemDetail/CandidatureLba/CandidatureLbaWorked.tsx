import { Box, Container, Flex, Image, Text } from "@chakra-ui/react"
import React from "react"

interface Props {
  email: string
  company: string
}

const CandidatureLbaWorked = ({ email, company }: Props) => {
  return (
    <Container data-testid="CandidatureSpontaneeWorked" mx={[6, 8]}>
      <Flex direction="row" alignItems="center" my={4}>
        <Image src="/images/paperplane2.svg" aria-hidden={true} alt="" />
        <Box pl={4} ml={4}>
          <Text data-testid="application-success" as="h2" fontSize="20px" fontWeight={700}>
            Votre candidature a bien été envoyée à{" "}
            <Text as="span" fontSize="22px">
              {company}
            </Text>
          </Text>
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

export default CandidatureLbaWorked
