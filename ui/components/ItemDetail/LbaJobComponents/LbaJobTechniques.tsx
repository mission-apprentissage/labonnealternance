import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"
import React from "react"

const LbaJobTechniques = ({ job }) => {
  const getText = () => {
    const res = (
      <Box pl="12px" mt={4}>
        {job.job.romeDetails.competences.savoirs.map((competence) => (
          <Box key={competence.code} mt={2}>
            &bull;
            <Text as="span" ml={3}>
              {competence.libelle}
            </Text>
            {competence.items.map((item, idx) => (
              <Box key={idx} pl={6}>
                <Text as="span">- {item.libelle}</Text>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    )

    return res
  }

  return (
    job?.job?.romeDetails?.competences?.savoirs?.length && (
      <AccordionItem>
        {({ isExpanded }) => (
          <>
            <AccordionButton fontSize="1rem" fontWeight={700} color="#161616">
              <Box as="span" flex="1" textAlign="left">
                Domaines et techniques de travail
              </Box>
              {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
            </AccordionButton>

            <AccordionPanel pb={4}>{getText()}</AccordionPanel>
          </>
        )}
      </AccordionItem>
    )
  )
}

export default LbaJobTechniques
