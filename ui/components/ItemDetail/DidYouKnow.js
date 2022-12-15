import React from "react"
import TagCandidatureSpontanee from "../../components/ItemDetail/TagCandidatureSpontanee.js"
import { Box, Link, Text } from "@chakra-ui/react"
import { ExternalLinkIcon } from "@chakra-ui/icons"

const DidYouKnow = () => {
  return (
    <Box position="relative" background="white" padding={["1px 12px 50px 12px", "1px 24px 50px 24px", "1px 12px 24px 12px"]} mx={["0", "30px"]} mb={8} mt={6}>
      <Text mt={2} as="h2" variant="itemDetailH2">
        Le saviez-vous ?
      </Text>
      <Text>
        Diversifiez vos démarches en envoyant aussi des candidatures spontanées aux entreprises qui n&apos;ont pas diffusé d&apos;offre! Repérez les tags suivants dans la liste de
        résultats
      </Text>
      <Box>
        <TagCandidatureSpontanee />
      </Box>
      <Text pb={4}>
        <Text>Un employeur vous a proposé un entretien ?</Text>
        <Text>
          <Link isExternal href="https://dinum-beta.didask.com/courses/demonstration/60d1adbb877dae00003f0eac" variant="basicUnderlined">
            On vous donne des conseils pour vous aider à le préparer. <ExternalLinkIcon mb="3px" ml="2px" />
          </Link>
        </Text>
      </Text>
    </Box>
  )
}

export default DidYouKnow
