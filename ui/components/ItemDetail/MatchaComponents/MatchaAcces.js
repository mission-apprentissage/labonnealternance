import React from "react"
import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"

const MatchaAcces = ({ job }) => {
  const acces = job?.job?.romeDetails?.acces ?? null

  if (!acces) return ""

  const accesFormatted = acces.split("\\n").join("<br><br>")

  return (
    <Accordion allowToggle>
      <AccordionItem>
        {({ isExpanded }) => (
          <>
            <AccordionButton fontSize="1rem" fontWeight={700} color="#161616">
              <Box as="span" flex="1" textAlign="left">
                À qui ce métier est-il accessible ?
              </Box>
              {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
            </AccordionButton>

            <AccordionPanel pb={4}>
              <Text as="span" dangerouslySetInnerHTML={{ __html: accesFormatted }}></Text>
            </AccordionPanel>
          </>
        )}
      </AccordionItem>
    </Accordion>
  )
}

export default MatchaAcces
