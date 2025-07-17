import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"
import { SyntheticEvent } from "react"
import { ILbaItemLbaJobJson } from "shared"

import { scrollToNestedElement } from "@/utils/tools"

const LbaJobTechniques = ({ job }: { job: ILbaItemLbaJobJson }) => {
  const onClick = (e: SyntheticEvent) => {
    setTimeout(() => {
      scrollToNestedElement({ containerId: "itemDetailColumn", nestedElement: e.target as HTMLElement, yOffsett: 220 })
    }, 200)
  }

  return (
    job?.job?.romeDetails?.competences?.savoirs?.length && (
      <AccordionItem borderBottom="1px solid #E5E5E5" onClick={onClick} key={"techniques"}>
        {({ isExpanded }) => (
          <>
            <AccordionButton fontSize="1rem" fontWeight={700} color="#161616">
              <Box as="span" flex="1" textAlign="left">
                Domaines et techniques de travail
              </Box>
              {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
            </AccordionButton>

            <AccordionPanel pb={4}>
              <Box pl="12px">
                {job.job.romeDetails.competences.savoirs.map((competence, i) => (
                  <Box key={i} mb={2}>
                    <Text as="span" ml={3} fontWeight={700}>
                      {competence.libelle}
                    </Text>
                    {competence.items.map((item, idx) => (
                      <Box key={idx} pl={6}>
                        <Text as="span">&bull; {item.libelle}</Text>
                      </Box>
                    ))}
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
