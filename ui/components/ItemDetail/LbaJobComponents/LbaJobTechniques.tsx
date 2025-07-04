import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"

import { scrollToNestedElement } from "@/utils/tools"

const LbaJobTechniques = ({ job }) => {
  const onClick = (e) => {
    setTimeout(() => {
      scrollToNestedElement({ containerId: "itemDetailColumn", nestedElement: e.target, yOffsett: 220 })
    }, 200)
  }

  let currentSkillGroup = null

  return (
    job?.job?.offer_to_be_acquired_knowledge?.length && (
      <AccordionItem borderBottom="1px solid #E5E5E5" onClick={onClick} key={"techniques"}>
        {({ isExpanded }) => (
          <>
            <AccordionButton fontSize="1rem" fontWeight={700} color="#161616">
              <Box as="span" flex="1" textAlign="left">
                Savoirs qui seront acquis durant l'alternance
              </Box>
              {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
            </AccordionButton>

            <AccordionPanel pb={4}>
              <Box pl="12px">
                {job.job.offer_to_be_acquired_knowledge.map((competence, idx) => {
                  const [group, skill] = competence.split("\t")
                  let title = <></>

                  if (group !== currentSkillGroup) {
                    currentSkillGroup = group
                    title = (
                      <Text as="span" ml={3} fontWeight={700}>
                        {group}
                      </Text>
                    )
                  }
                  return (
                    <Box key={idx} mb={2}>
                      {title}
                      <Box pl={6}>
                        <Text as="span">&bull; {skill}</Text>
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            </AccordionPanel>
          </>
        )}
      </AccordionItem>
    )
  )
}

export default LbaJobTechniques
