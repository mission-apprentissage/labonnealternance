import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"
import React from "react"

import { scrollToNestedElement } from "@/utils/tools"

const LbaJobQualites = ({ job }) => {
  const getText = () => {
    const res = (
      <Box pl="12px" mt={4}>
        {job.job.romeDetails.competences.savoir_etre_professionnel.map((competence) => (
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

  const onClick = (e) => {
    setTimeout(() => {
      scrollToNestedElement({ containerId: "itemDetailColumn", nestedElement: e.target, yOffsett: 220 })
    }, 200)
  }

  return (
    job?.job?.romeDetails?.competences.savoir_etre_professionnel?.length && (
      <AccordionItem onClick={onClick}>
        {({ isExpanded }) => (
          <>
            <AccordionButton fontSize="1rem" fontWeight={700} color="#161616">
              <Box as="span" flex="1" textAlign="left">
                Qualités souhaitées pour ce métier
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

export default LbaJobQualites
