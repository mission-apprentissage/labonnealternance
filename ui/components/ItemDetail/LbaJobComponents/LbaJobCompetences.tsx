import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"
import React from "react"

import { scrollToNestedElement } from "@/utils/tools"

const LbaJobCompetences = ({ job }) => {
  const onClick = (e) => {
    setTimeout(() => {
      scrollToNestedElement({ containerId: "itemDetailColumn", nestedElement: e.target, yOffsett: 220 })
    }, 200)
  }

  return (
    job?.job?.romeDetails?.competences?.savoir_faire?.length && (
      <AccordionItem borderBottom="1px solid #E5E5E5" onClick={onClick}>
        {({ isExpanded }) => (
          <>
            <AccordionButton fontSize="1rem" fontWeight={700} color="#161616">
              <Box as="span" flex="1" textAlign="left">
                Compétences qui seront acquises durant l’alternance
              </Box>
              {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
            </AccordionButton>

            <AccordionPanel pb={4}>
              <Box pl="12px">
                {job.job.romeDetails.competences.savoir_faire.map((competence) => (
                  <Box key={competence.code} mb={2}>
                    <Text as="span" ml={3} fontWeight={700}>
                      {competence.libelle}
                    </Text>
                    {competence.items.map((item, idx) => (
                      <Box key={idx} pl={6}>
                        <Text as="span">&bull; {item.libelle}</Text>
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </AccordionPanel>
          </>
        )}
      </AccordionItem>
    )
  )
}

export default LbaJobCompetences
