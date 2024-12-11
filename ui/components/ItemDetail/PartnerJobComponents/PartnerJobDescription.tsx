import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { AccordionButton, AccordionItem, AccordionPanel, Box } from "@chakra-ui/react"
import React from "react"
import { ILbaItemPartnerJob } from "shared"

import { scrollToNestedElement } from "@/utils/tools"

export const BAD_DESCRIPTION_LENGTH = 50

export const PartnerJobDescription = ({ job }: { job: ILbaItemPartnerJob }) => {
  const { description, employeurDescription } = job.job

  const validCustomDescription = description && description.length > BAD_DESCRIPTION_LENGTH ? description : null

  return validCustomDescription || employeurDescription ? (
    <>
      {validCustomDescription && <DescriptionAccordion title="Description du Métier">{validCustomDescription}</DescriptionAccordion>}
      {employeurDescription && <DescriptionAccordion title="Description de l'employeur">{employeurDescription}</DescriptionAccordion>}
    </>
  ) : null
}

const DescriptionAccordion = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const onClick = (e) => {
    setTimeout(() => {
      scrollToNestedElement({ containerId: "itemDetailColumn", nestedElement: e.target, yOffsett: 220 })
    }, 200)
  }

  return (
    <AccordionItem borderBottom="1px solid #E5E5E5" onClick={onClick}>
      {({ isExpanded }) => (
        <>
          <AccordionButton fontSize="1rem" fontWeight={700} color="#161616">
            <Box as="span" flex="1" textAlign="left">
              {title}
            </Box>
            {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
          </AccordionButton>

          <AccordionPanel pb={4}>
            <Box whiteSpace="pre-wrap" pl="12px" mt={4}>
              {children}
            </Box>
          </AccordionPanel>
        </>
      )}
    </AccordionItem>
  )
}
