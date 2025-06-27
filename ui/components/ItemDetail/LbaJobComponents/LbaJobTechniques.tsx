import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"

import { scrollToNestedElement } from "@/utils/tools"

const LbaJobTechniques = ({ job }) => {
  const onClick = (e) => {
    setTimeout(() => {
      scrollToNestedElement({ containerId: "itemDetailColumn", nestedElement: e.target, yOffsett: 220 })
    }, 200)
  }

  return (
    job?.job?.offer_desired_skills?.length && (
      <AccordionItem borderBottom="1px solid #E5E5E5" onClick={onClick} key={"techniques"}>
        {({ isExpanded }) => (
          <>
            <AccordionButton fontSize="1rem" fontWeight={700} color="#161616">
              <Box as="span" flex="1" textAlign="left">
                Qualités souhaitées pour ce métier
              </Box>
              {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
            </AccordionButton>

            <AccordionPanel pb={4}>
              <Box pl="12px">
                {job.job.offer_desired_skills.map((competence, idx) => (
                  <Box key={idx} mb={2}>
                    <Box key={idx} pl={6}>
                      <Text as="span">&bull; {competence}</Text>
                    </Box>
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

export default LbaJobTechniques
