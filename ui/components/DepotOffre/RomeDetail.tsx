import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box, Flex, Heading, Text } from "@chakra-ui/react"

import { InfoCircle, Minus, Plus } from "@/theme/components/icons"

export const RomeDetail = ({ definition, competences, libelle, appellation, acces_metier }) => {
  const definitionSplitted = definition.split("\\n")
  const accesFormatted = acces_metier.split("\\n").join("<br><br>")

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
        {competences?.savoir_etre_professionnel && (
          <>
            <AccordionItem key={1} id="qualites">
              {({ isExpanded }) => (
                <>
                  <h2>
                    <AccordionButton>
                      <Text fontWeight="700" flex="1" textAlign="left">
                        Qualités souhaitées pour ce métier
                      </Text>
                      {isExpanded ? <Minus color="bluefrance.500" /> : <Plus color="bluefrance.500" />}
                    </AccordionButton>
                  </h2>
                  <AccordionPanel maxH="50%" pb={4} ml={6} mr={3}>
                    <ul className="voeuxUl">
                      {competences.savoir_etre_professionnel.map((x) => (
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
          </>
        )}
        {competences?.savoir_faire && (
          <>
            <AccordionItem key={1} id="competences">
              {({ isExpanded }) => (
                <>
                  <AccordionButton>
                    <Text fontWeight="700" flex="1" textAlign="left">
                      Compétences qui seront acquises durant l’alternance
                    </Text>
                    {isExpanded ? <Minus color="bluefrance.500" /> : <Plus color="bluefrance.500" />}
                  </AccordionButton>
                  <AccordionPanel maxH="50%" pb={4} ml={1} mr={3}>
                    {competences.savoir_faire.map((categorieSavoirFaire) => (
                      <>
                        <Text fontWeight={700} key={categorieSavoirFaire.libelle}>
                          {categorieSavoirFaire.libelle}
                        </Text>
                        <Box pl={12} pt={3} mb={4}>
                          {categorieSavoirFaire.items?.length && (
                            <ul className="voeuxUl">
                              {categorieSavoirFaire.items.map((savoirFaire, idx) => (
                                <Box as="li" mb={1} key={idx}>
                                  {savoirFaire.libelle}
                                </Box>
                              ))}
                            </ul>
                          )}
                        </Box>
                      </>
                    ))}
                  </AccordionPanel>
                </>
              )}
            </AccordionItem>
            <hr />
          </>
        )}
        {competences?.savoir_faire && (
          <>
            <AccordionItem key={1} id="techniques">
              {({ isExpanded }) => (
                <>
                  <AccordionButton>
                    <Text fontWeight="700" flex="1" textAlign="left">
                      Domaines et techniques de travail
                    </Text>
                    {isExpanded ? <Minus color="bluefrance.500" /> : <Plus color="bluefrance.500" />}
                  </AccordionButton>
                  <AccordionPanel maxH="50%" pb={4} ml={1} mr={3}>
                    {competences.savoirs.map((categorieSavoir) => (
                      <>
                        <Text fontWeight={700} key={categorieSavoir.libelle}>
                          {categorieSavoir.libelle}
                        </Text>
                        <Box pl={12} pt={3} mb={4}>
                          {categorieSavoir.items?.length && (
                            <ul className="voeuxUl">
                              {categorieSavoir.items.map((savoir, idx) => (
                                <Box as="li" mb={1} key={idx}>
                                  {savoir.libelle}
                                </Box>
                              ))}
                            </ul>
                          )}
                        </Box>
                      </>
                    ))}
                  </AccordionPanel>
                </>
              )}
            </AccordionItem>
            <hr />
          </>
        )}

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
