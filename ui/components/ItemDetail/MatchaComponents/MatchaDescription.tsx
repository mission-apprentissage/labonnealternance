import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"
import React from "react"

const MatchaDescription = ({ job }) => {
  const getText = () => {
    return (
      <Box pl="12px" mt={4}>
        {job?.job?.romeDetails?.definition.split("\\n").map((definition, i) => (
          <Box key={i} mt={2}>
            &bull;
            <Text as="span" ml={3}>
              {definition}
            </Text>
          </Box>
        ))}
      </Box>
    )
  }

  return (
    job?.job?.romeDetails?.definition && (
      <Accordion allowToggle>
        <AccordionItem>
          {({ isExpanded }) => (
            <>
              <AccordionButton fontSize="1rem" fontWeight={700} color="#161616">
                <Box as="span" flex="1" textAlign="left">
                  Description du métier
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

export default MatchaDescription
