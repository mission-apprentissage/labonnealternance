import { Box, Container, Flex, Heading, Link, Text, useDisclosure } from "@chakra-ui/react"
import { ILbaItemFtJob } from "shared"

import { focusWithin } from "../../../theme/theme-lba-tools"
import { SendPlausibleEvent } from "../../../utils/plausible"
import { ModalReadOnly } from "../../ModalReadOnly"

interface GetFranceTravailButtonProps {
  offreFT: ILbaItemFtJob
  isCollapsedHeader: boolean
}

export default function GetFranceTravailButton({ offreFT }: GetFranceTravailButtonProps) {
  const urlPostulation = offreFT?.contact?.url || null
  const contactPhone = offreFT?.contact?.phone || null
  const contactName = offreFT?.contact?.name || null
  const url = offreFT?.url || null
  const id = offreFT?.job?.id || null
  const companyName = offreFT?.company?.name || null

  if (!urlPostulation && !contactPhone && !url) return null

  const handleClick = (eventLabel: string, info?: { info_fiche: string }) => {
    if (info) {
      SendPlausibleEvent(eventLabel, info)
    }
  }

  const renderLink = (url: string, label: string, eventLabel: string) => (
    <Box my={4}>
      <Link data-tracking-id="postuler-offre-partenaire" {...focusWithin} variant="postuler" href={url} target="_blank" onClick={() => handleClick(eventLabel, { info_fiche: id })}>
        {label}
      </Link>
    </Box>
  )

  if (contactPhone) return <ContactPhone contactName={contactName} companyName={companyName} contactPhone={contactPhone} urlPostulation={urlPostulation} />
  if (urlPostulation) return renderLink(urlPostulation, "Je postule sur le site du recruteur", "Clic Postuler - Fiche entreprise Offre FT")
  if (url) return renderLink(url, "Je postule sur France Travail", "Clic Postuler - Fiche entreprise Offre FT")

  return null
}

const ContactPhone = ({ companyName, contactPhone, contactName, urlPostulation }: { companyName: string; contactPhone: string; contactName: string; urlPostulation?: string }) => {
  const { isOpen, onClose, onOpen } = useDisclosure()
  return (
    <>
      <Box my={isCollapsedHeader ? 2 : 4}>
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
