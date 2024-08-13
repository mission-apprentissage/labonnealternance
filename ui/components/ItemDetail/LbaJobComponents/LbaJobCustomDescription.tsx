import { AddIcon, MinusIcon } from "@chakra-ui/icons"
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box } from "@chakra-ui/react"
import DOMPurify from "isomorphic-dompurify"

const LbaJobCustomDescription = ({ data, title }: { data: string; title: string }) => {
  const sanitizedData = () => ({
    __html: DOMPurify.sanitize(data),
  })
  return (
    <Accordion allowToggle>
      <AccordionItem borderBottom="1px solid #E5E5E5">
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
                <div dangerouslySetInnerHTML={sanitizedData()} />
              </Box>
            </AccordionPanel>
          </>
        )}
      </AccordionItem>
    </Accordion>
  )
}

export default LbaJobCustomDescription
