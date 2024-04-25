import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"
import React from "react"

const LbaJobAcces = ({ job }) => {
  const accesEmploi = job?.job?.romeDetails?.accesEmploi ?? null

  if (!accesEmploi) return ""

  const accesFormatted = accesEmploi.split("\\n").join("<br><br>")

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

export default LbaJobAcces
