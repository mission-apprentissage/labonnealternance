import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { AccordionButton, AccordionItem, AccordionPanel, Box, Text } from "@chakra-ui/react"
import React from "react"

import { scrollToNestedElement } from "@/utils/tools"

const getBullet = () => <>&bull;</>

const PartnerJobAccordion = ({ title, items }: { title: string; items: string[] }) => {
  const onClick = (e) => {
    setTimeout(() => {
      scrollToNestedElement({ containerId: "itemDetailColumn", nestedElement: e.target, yOffsett: 220 })
    }, 200)
  }

  return (
    items.length > 0 && (
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
                {items.map((item, i) => (
                  <Box key={`accordion_${title}_${i}`}>
                    {items.length > 1 && getBullet()}
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

export default PartnerJobAccordion