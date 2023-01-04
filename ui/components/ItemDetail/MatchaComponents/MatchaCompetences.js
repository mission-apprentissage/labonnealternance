import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"
import React from "react"

import { Collapse } from "reactstrap"

const MatchaCompetences = ({ job }) => {
  // Collapse Open state
  const [isOpen, setIsOpen] = React.useState(false)

  const getText = () => {
    const res = (
      <Box pl="12px" mt={4}>
        {job.job.romeDetails.competencesDeBase.map((competence) => (
          <Box key={competence.code} mt={2}>
            &bull;
            <Text as="span" ml={3}>
              {competence.libelle}
            </Text>
          </Box>
        ))}
      </Box>
    )

    return res
  }

  return (
    job?.job?.romeDetails?.competencesDeBase?.length && (
      <Accordion allowToggle>
        <AccordionItem>
          {({ isExpanded }) => (
            <>
              <AccordionButton fontSize="1rem" fontWeight={700} color="#161616">
                <Box as="span" flex="1" textAlign="left">
                  Quelles sont les compétences attendues ?
                </Box>
                {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
              </AccordionButton>

              <AccordionPanel pb={4}>{getText()}</AccordionPanel>
            </>
          )}
        </AccordionItem>
      </Accordion>
    )
  )
}

export default MatchaCompetences
