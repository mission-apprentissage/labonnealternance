import { Box, Container, Flex, Heading, Link, Text, useDisclosure } from "@chakra-ui/react"

import { focusWithin } from "../../theme/theme-lba-tools"
import { ModalReadOnly } from "../ModalReadOnly"

export default function CandidatureParTelephone({
  companyName,
  contactPhone,
  contactName,
  urlPostulation,
}: {
  companyName: string | null
  contactPhone: string | null
  contactName: string | null
  urlPostulation?: string | null
}) {
  const { isOpen, onClose, onOpen } = useDisclosure()
  return (
    <>
      <Box my={4}>
        <Link data-tracking-id="postuler-offre-partenaire" {...focusWithin} variant="postuler" href={urlPostulation} target="_blank" onClick={onOpen}>
          Contacter le recruteur
        </Link>
      </Box>
      <ModalReadOnly isOpen={isOpen} onClose={onClose} modalContentProps={{ px: 6, pb: 6 }}>
        <Container size={{ base: "full", md: "container.md" }}>
          <Heading as="h2" fontSize="xl" mb={4}>
            Postuler à l'offre de {companyName}
          </Heading>
          <Text>L'entreprise préfère être contactée par téléphone. Pour proposer votre candidature, appelez directement le numéro suivant :</Text>
          <Flex direction="column" align="center" my={4}>
            <Text fontWeight="bold" fontSize="lg" my={4}>
              {contactName}
            </Text>
            <Box borderRadius="md" backgroundColor="#ECECFE" p={3}>
              <Link href={`tel:${contactPhone}`}>
                <Text color="#000091" fontSize="2xl" fontWeight="bold">
                  {contactPhone}
                </Text>
              </Link>
            </Box>
          </Flex>
        </Container>
      </ModalReadOnly>
    </>
  )
}
