import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"

import { scrollToNestedElement } from "@/utils/tools"

const LbaJobQualites = ({ job }) => {
  const onClick = (e) => {
    setTimeout(() => {
      scrollToNestedElement({ containerId: "itemDetailColumn", nestedElement: e.target, yOffsett: 220 })
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
                {job.job.romeDetails.competences.savoir_etre_professionnel.map((competence) => (
                  <Box key={competence.code} mt={2}>
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
