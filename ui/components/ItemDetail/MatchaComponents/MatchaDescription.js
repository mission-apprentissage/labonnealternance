import { Box, Text } from "@chakra-ui/react"
import React from "react"

import { Collapse } from "reactstrap"

const MatchaDescription = ({ job }) => {
  // Collapse Open state
  const [isOpen, setIsOpen] = React.useState(false)

  const getText = () => {
    return (
      <Box pl="12px" mt={4}>
        {job?.job?.romeDetails?.definition.split("\\n").map((definition, i) => (
          <Box key={i} mt={2}>
            &bull;
            <Text as="span" ml={3}>
              {definition}
            </Text>
          </Box>
        ))}
      </Box>
    )
  }

  return job?.job?.romeDetails?.definition ? (
    <>
      <div className="c-accordion">
        <button
          className="c-accordion-button"
          onClick={() => {
            setIsOpen(!isOpen)
          }}
        >
          <span className="c-accordion-button-title">Description du métier</span>
          <span className="c-accordion-button-plus">{isOpen ? "-" : "+"}</span>
        </button>
        <Collapse isOpen={isOpen} className="c-collapser">
          {getText()}
        </Collapse>
      </div>
    </>
  ) : (
    ""
  )
}

export default MatchaDescription
