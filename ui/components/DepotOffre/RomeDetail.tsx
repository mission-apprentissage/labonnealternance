import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box, Flex, Heading, Text } from "@chakra-ui/react"

import { InfoCircle, Minus, Plus } from "@/theme/components/icons"

export const RomeDetail = ({ definition, competencesDeBase, libelle, appellation, acces }) => {
  const definitionSplitted = definition.split("\\n")
  const accesFormatted = acces.split("\\n").join("<br><br>")

  return (
    <Box border="1px solid #000091" p={5} mb={5}>
      <Box mb={5}>
        <Heading fontSize="24px" mb={3}>
          {appellation}
        </Heading>
        <Text fontSize="16px" fontWeight="700">
          Fiche métier : {libelle}
        </Text>
        <Text fontSize="14px">La fiche métier se base sur la classification ROME de France Travail</Text>
      </Box>
      <Flex alignItems="flex-start" mb={6}>
        <InfoCircle mr={2} mt={1} color="bluefrance.500" />
        <Text textAlign="justify">Voici la description visible par les candidats lors de la mise en ligne de l’offre d’emploi en alternance.</Text>
      </Flex>

      <Accordion defaultIndex={[0]} allowMultiple>
        <AccordionItem key={0} id="metier">
          {({ isExpanded }) => (
            <>
              <h2>
                <AccordionButton>
                  <Text fontWeight="700" flex="1" textAlign="left">
                    Descriptif du métier
                  </Text>
                  {isExpanded ? <Minus color="bluefrance.500" /> : <Plus color="bluefrance.500" />}
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4} ml={6} mr={3}>
                <ul className="voeuxUl">
                  {definitionSplitted.map((x) => {
                    return (
                      <li className="voeuxUlLi" key={x}>
                        {x}
                      </li>
                    )
                  })}
                </ul>
              </AccordionPanel>
            </>
          )}
        </AccordionItem>
        <hr />
        <AccordionItem key={1} id="competence">
          {({ isExpanded }) => (
            <>
              <h2>
                <AccordionButton>
                  <Text fontWeight="700" flex="1" textAlign="left">
                    Quelles sont les compétences visées ?
                  </Text>
                  {isExpanded ? <Minus color="bluefrance.500" /> : <Plus color="bluefrance.500" />}
                </AccordionButton>
              </h2>
              <AccordionPanel maxH="50%" pb={4} ml={6} mr={3}>
                <ul className="voeuxUl">
                  {competencesDeBase.map((x) => (
                    <li className="voeuxUlLi" key={x.libelle}>
                      {x.libelle}
                    </li>
                  ))}
                </ul>
              </AccordionPanel>
            </>
          )}
        </AccordionItem>
        <hr />
        <AccordionItem key={2} id="accessibilite">
          {({ isExpanded }) => (
            <>
              <h2>
                <AccordionButton>
                  <Text fontWeight="700" flex="1" textAlign="left">
                    À qui ce métier est-il accessible ?
                  </Text>
                  {isExpanded ? <Minus color="bluefrance.500" /> : <Plus color="bluefrance.500" />}
                </AccordionButton>
              </h2>
              <AccordionPanel maxH="50%" pb={4}>
                <span dangerouslySetInnerHTML={{ __html: accesFormatted }}></span>
              </AccordionPanel>
            </>
          )}
        </AccordionItem>
      </Accordion>
    </Box>
  )
}
