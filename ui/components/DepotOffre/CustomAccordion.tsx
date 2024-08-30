import { AccordionButton, AccordionItem, AccordionPanel, Box } from "@chakra-ui/react"

import { Minus, Plus } from "@/theme/components/icons"

export const CustomAccordion = ({ id, header, children }: { id: string; header: React.ReactNode; children: React.ReactNode }) => {
  return (
    <>
      <AccordionItem id={id} borderBottom="none">
        {({ isExpanded }) => (
          <>
            <h2>
              <AccordionButton alignItems="center" justifyContent="space-between">
                <Box flex={1} textAlign="left">
                  {header}
                </Box>
                {isExpanded ? <Minus color="bluefrance.500" /> : <Plus color="bluefrance.500" />}
              </AccordionButton>
            </h2>
            <AccordionPanel maxH="50%" pb={4} ml={1} mr={3}>
              {children}
            </AccordionPanel>
          </>
        )}
      </AccordionItem>
      <hr />
    </>
  )
}
