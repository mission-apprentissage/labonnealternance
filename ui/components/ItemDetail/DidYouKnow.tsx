import { Box, Text } from "@chakra-ui/react"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

import TagCandidatureSpontanee from "./TagCandidatureSpontanee"

const DidYouKnow = () => {
  return (
    <Box position="relative" background="white" padding="16px 24px" maxWidth="970px" mx={["0", "30px", "30px", "auto"]} mb={8} mt={6}>
      <Text mt={2} as="h2" variant="itemDetailH2">
        Le saviez-vous ?
      </Text>
      <Text>
        Diversifiez vos démarches en envoyant aussi des candidatures spontanées aux entreprises qui n&apos;ont pas diffusé d&apos;offre! Repérez les tags suivants dans la liste de
        résultats <TagCandidatureSpontanee />
      </Text>

      <Text pb={4}>
        Un employeur vous a proposé un entretien ?
        <br />
        <DsfrLink href="https://dinum.didask.com/courses/demonstration/60d1adbb877dae00003f0eac" aria-label="Conseils de préparation à un entretien - nouvelle fenêtre">
          On vous donne des conseils pour vous aider à le préparer.
        </DsfrLink>
      </Text>
    </Box>
  )
}

export default DidYouKnow
