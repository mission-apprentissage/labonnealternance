import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"
import React, { SyntheticEvent } from "react"
import { ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { scrollToNestedElement } from "@/utils/tools"

export const BAD_DESCRIPTION_LENGTH = 50
const BULLET = <>&bull;</>

export const JobDescription = ({ job }: { job: ILbaItemPartnerJobJson | ILbaItemLbaJobJson }) => {
  const { description, employeurDescription } = job.job
  const validCustomDescription = description && description.length > BAD_DESCRIPTION_LENGTH ? description : null

  if (validCustomDescription || employeurDescription) {
    return (
      <>
        {validCustomDescription && (
          <JobDescriptionAccordion title={`Description ${job.job.partner_label === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? " du métier" : "de l'offre"}`}>
            {validCustomDescription}
          </JobDescriptionAccordion>
        )}
        {employeurDescription && <JobDescriptionAccordion title="Description de l'employeur">{employeurDescription}</JobDescriptionAccordion>}
      </>
    )
  }

  return null
}

export const JobDescriptionAccordion = ({ title, children, items }: { title: string; children?: React.ReactNode; items?: string[] }) => {
  const onClick = (e: SyntheticEvent) => {
    setTimeout(() => {
      scrollToNestedElement({ containerId: "itemDetailColumn", nestedElement: e.target as HTMLElement, yOffsett: 220 })
    }, 200)
  }

  return (
    (items?.length > 0 || children) && (
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
              <Box pl="12px" mt={4}>
                {children && <Text whiteSpace="pre-wrap" dangerouslySetInnerHTML={{ __html: children }} />}
                {items?.length > 0 &&
                  items.map((item, i) => (
                    <Box key={`accordion_${title}_${i}`}>
                      {items.length > 1 && BULLET}
                      <Text as="span" ml={items.length > 1 ? 3 : 0} mt={items.length > 1 ? 2 : 0} whiteSpace="pre-wrap">
                        {item}
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
