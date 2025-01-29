import { AccordionButton, AccordionItem, AccordionPanel, Box } from "@chakra-ui/react"

import { Minus, Plus } from "@/theme/components/icons"

export const CustomAccordion = ({ id, header, children }: { id: string; header: React.ReactNode; children: React.ReactNode }) => {
  return (
    <>
      <AccordionItem id={id} borderBottom="none">
        {({ isExpanded }) => (
          <>
            <h2>
              <AccordionButton alignItems="center" justifyContent="space-between" px={2} py={2}>
                <Box flex={1} textAlign="left">
                  {header}
                </Box>
                {isExpanded ? <Minus color="bluefrance.500" /> : <Plus color="bluefrance.500" />}
              </AccordionButton>
            </h2>
            <AccordionPanel maxH="50%" p={0} my={0} mx={2} mb={4}>
              {children}
            </AccordionPanel>
          </>
        )}
      </AccordionItem>
      <hr />
    </>
  )
}
