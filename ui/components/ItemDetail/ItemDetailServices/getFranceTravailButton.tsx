import { Box, Container, Flex, Heading, Link, Text, useDisclosure } from "@chakra-ui/react"
import { ILbaItemFtJob } from "shared"

import { focusWithin } from "../../../theme/theme-lba-tools"
import { SendPlausibleEvent } from "../../../utils/plausible"
import { ModalReadOnly } from "../../ModalReadOnly"

export default function GetFranceTravailButton(offreFT: ILbaItemFtJob) {
  const { isOpen: isModalOpen, onClose: onModalClose, onOpen: setModalOpen } = useDisclosure()
  const urlPostulation = offreFT?.contact?.url || null
  const contactPhone = offreFT?.contact?.phone || null
  const contactName = offreFT?.contact?.name || null
  const url = offreFT?.url || null
  const id = offreFT?.job?.id || null
  const companyName = offreFT.company.name || null

  if (!urlPostulation && !contactPhone && !url) return null

  if (contactPhone) {
    return (
      <>
        <Box my={4}>
          <Link data-tracking-id="postuler-offre-partenaire" {...focusWithin} variant="postuler" href={urlPostulation} target="_blank" onClick={setModalOpen}>
            Contacter le recruteur
          </Link>
        </Box>
        <ModalReadOnly isOpen={isModalOpen} onClose={onModalClose}>
          <Container size={{ base: "full", md: "container.md" }}>
            <Heading as="h2" fontSize="xl" mb={4}>
              Posutler à l'offre de {companyName}
            </Heading>
            <Text>L'entreprise préfère être contactée par téléphone. Pour proposer votre candidature, appeler directement le numéro suivant :</Text>
            <Flex direction={"column"} alignItems="center" flexDirection={"column"} justifyContent={"center"} my={4}>
              <Text fontWeight="bold" fontSize="lg" my={4}>
                {contactName}
              </Text>
              <Box borderRadius={"md"} backgroundColor={"#ECECFE"} p={3}>
                <Link href={`tel:${contactPhone}`}>
                  <Text color="#000091" fontSize={"2xl"} fontWeight="bold">
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

  if (urlPostulation) {
    return (
      <Box my={4}>
        <Link
          data-tracking-id="postuler-offre-partenaire"
          {...focusWithin}
          variant="postuler"
          href={urlPostulation}
          target="_blank"
          onClick={() =>
            SendPlausibleEvent("Clic Postuler - Fiche entreprise Offre FT", {
              info_fiche: id,
            })
          }
        >
          Je postule sur le site du recruteur
        </Link>
      </Box>
    )
  }

  if (url) {
    return (
      <Box my={4}>
        <Link
          data-tracking-id="postuler-offre-partenaire"
          {...focusWithin}
          variant="postuler"
          href={url}
          target="francetravail"
          onClick={() =>
            SendPlausibleEvent("Clic Postuler - Fiche entreprise Offre FT", {
              info_fiche: id,
            })
          }
        >
          Je postule sur France Travail
        </Link>
      </Box>
    )
  }
}
