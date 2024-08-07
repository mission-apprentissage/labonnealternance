import { AddIcon, /*ExternalLinkIcon,*/ MinusIcon } from "@chakra-ui/icons"
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box, Flex, Image, /*Link,*/ Text } from "@chakra-ui/react"
import React, { useEffect } from "react"

import { scrollToNestedElement } from "@/utils/tools"

import { DisplayContext } from "../../../context/DisplayContextProvider"
import { SendPlausibleEvent } from "../../../utils/plausible"

const LbaRecruteurDetail = ({ lbaRecruteur }) => {
  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche entreprise Algo", {
      info_fiche: `${lbaRecruteur?.company?.siret}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}`,
    })
    /* eslint react-hooks/exhaustive-deps: 0 */
  }, [lbaRecruteur?.company?.siret])

  useEffect(() => {
    // S'assurer que l'utilisateur voit bien le haut de la fiche au départ
    document.getElementsByClassName("choiceCol")[0]?.scrollTo(0, 0)
  }, []) // Utiliser le useEffect une seule fois : https://css-tricks.com/run-useeffect-only-once/

  const { formValues } = React.useContext(DisplayContext)

  const onClick = (e) => {
    setTimeout(() => {
      scrollToNestedElement({ containerId: "itemDetailColumn", nestedElement: e.target, yOffsett: 220 })
    }, 200)
  }

  return (
    <>
      <Box mt={6} mb={4} position="relative" background="white" pt={4} pb={6} px={6} mx={["0", "30px"]}>
        <Text mb={6} color="bluefrance.500" fontSize="22px" fontWeight={700} as="h2">
          Qu’est ce qu’une candidature spontanée ?
        </Text>
        <Flex alignItems="flex-start">
          <Box maxWidth="760px">
            <Text mb={2} fontWeight={700}>
              Cette entreprise n’a pas déposé d’offre mais est susceptible de recruter des alternants.
            </Text>
            <Text mb={2}>Intéressé.e ? Transmettez-lui votre CV en soulignant votre intérêt pour intégrer son équipe dans le cadre de votre alternance.</Text>
            <Text fontWeight={700}>Les candidats envoyant des candidatures spontanées ont plus de chance de trouver un employeur.</Text>
          </Box>
          <Box ml={4} display={{ base: "none", md: "block" }}>
            <Image minWidth="168px" src="/images/lba_recruteur_advice.svg" alt="" aria-hidden={true} />
          </Box>
        </Flex>
      </Box>

      <Box mt={6} mb={4} position="relative" background="white" pt={4} pb={6} px={6} mx={["0", "30px"]}>
        <Text mb={6} color="bluefrance.500" fontSize="22px" fontWeight={700} as="h2">
          Comment candidater ?
        </Text>
        <Accordion allowMultiple={false} allowToggle defaultIndex={0}>
          <AccordionItem onClick={onClick}>
            {({ isExpanded }) => (
              <>
                <AccordionButton borderBottom={isExpanded ? "none" : "1px solid #E5E5E5"} fontSize="1rem" fontWeight={700} color="#161616">
                  <Box as="span" flex="1" textAlign="left">
                    1. Renseignez-vous sur l’entreprise
                  </Box>
                  {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
                </AccordionButton>

                <AccordionPanel borderBottom="1px solid #E5E5E5" pb={4}>
                  TEXTE
                </AccordionPanel>
              </>
            )}
          </AccordionItem>

          <AccordionItem onClick={onClick}>
            {({ isExpanded }) => (
              <>
                <AccordionButton borderBottom={isExpanded ? "none" : "1px solid #E5E5E5"} fontSize="1rem" fontWeight={700} color="#161616">
                  <Box as="span" flex="1" textAlign="left">
                    2. Préparez votre candidature spontanée
                  </Box>
                  {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
                </AccordionButton>

                <AccordionPanel borderBottom="1px solid #E5E5E5" pb={4}>
                  TEXTE
                </AccordionPanel>
              </>
            )}
          </AccordionItem>

          <AccordionItem onClick={onClick}>
            {({ isExpanded }) => (
              <>
                <AccordionButton borderBottom={isExpanded ? "none" : "1px solid #E5E5E5"} fontSize="1rem" fontWeight={700} color="#161616">
                  <Box as="span" flex="1" textAlign="left">
                    3. Anticiper la suite
                  </Box>
                  {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
                </AccordionButton>

                <AccordionPanel borderBottom="1px solid #E5E5E5" pb={4}>
                  TEXTE
                </AccordionPanel>
              </>
            )}
          </AccordionItem>
        </Accordion>
      </Box>
    </>
  )
}

export default LbaRecruteurDetail
