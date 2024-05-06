import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"
import React from "react"

const LbaJobAcces = ({ job }) => {
  const accesEmploi = job?.job?.romeDetails?.acces_metier ?? null

  if (!accesEmploi) return <></>

  const accesFormatted = accesEmploi.split("\\n").join("<br><br>")

  return (
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
  )
}

export default LbaJobAcces
