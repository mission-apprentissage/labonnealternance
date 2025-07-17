import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"
import { SyntheticEvent } from "react"
import { ILbaItemLbaJobJson } from "shared"

import { scrollToNestedElement } from "@/utils/tools"

const LbaJobQualites = ({ job }: { job: ILbaItemLbaJobJson }) => {
  const onClick = (e: SyntheticEvent) => {
    setTimeout(() => {
      scrollToNestedElement({ containerId: "itemDetailColumn", nestedElement: e.target as HTMLElement, yOffsett: 220 })
    }, 200)
  }

  return (
    job?.job?.romeDetails?.competences.savoir_etre_professionnel?.length && (
      <AccordionItem borderBottom="1px solid #E5E5E5" onClick={onClick} key={"qualites"}>
        {({ isExpanded }) => (
          <>
            <AccordionButton fontSize="1rem" fontWeight={700} color="#161616">
              <Box as="span" flex="1" textAlign="left">
                Qualités souhaitées pour ce métier
              </Box>
              {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
            </AccordionButton>

            <AccordionPanel pb={4}>
              <Box pl="12px" mt={4}>
                {job.job.romeDetails.competences.savoir_etre_professionnel.map((competence, i) => (
                  <Box key={i} mt={2}>
                    &bull;
                    <Text as="span" ml={3}>
                      {competence.libelle}
                    </Text>
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

export default LbaJobQualites
