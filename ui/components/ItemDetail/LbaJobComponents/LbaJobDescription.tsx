import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"
import React from "react"

import LbaJobCustomDescription from "./LbaJobCustomDescription"

const BADDESCRIPTION = 50

const LbaJobDescription = ({ job }) => {
  const { description, employeurDescription } = job.job

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

  if (description && description.length > BADDESCRIPTION && !employeurDescription) {
    return <LbaJobCustomDescription data={description} title="Description du Métier" />
  }
  if (description && description.length > BADDESCRIPTION && employeurDescription) {
    return (
      <>
        <LbaJobCustomDescription data={description} title="Description du Métier" />
        <LbaJobCustomDescription data={employeurDescription} title="Description de l'employeur" />
      </>
    )
  }
  if ((!description || description.length < BADDESCRIPTION) && employeurDescription) {
    return <LbaJobCustomDescription data={employeurDescription} title="Description de l'employeur" />
  }

  return (
    job?.job?.romeDetails?.definition && (
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
    )
  )
}

export default LbaJobDescription
