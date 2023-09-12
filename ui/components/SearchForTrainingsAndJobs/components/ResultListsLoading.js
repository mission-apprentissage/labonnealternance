import { useContext } from "react"
import { Box, Flex, Spinner, Text } from "@chakra-ui/react"
import React from "react"
import { ScopeContext } from "../../../context/ScopeContext"

const ResultListsLoading = ({ allJobSearchError, trainingSearchError, isTrainingSearchLoading, isJobSearchLoading }) => {
  const scopeContext = useContext(ScopeContext)

  if (allJobSearchError && trainingSearchError) return ""

  let jobLoading = ""

  if (scopeContext.isJob && isJobSearchLoading) {
    jobLoading = (
      <Flex p={5} color="pinksoft.600">
        <Text mr={4}>Recherche des entreprises en cours</Text>
        <Spinner thickness="4px" />
      </Flex>
    )
  }

  let trainingLoading = ""

  if (scopeContext.isTraining && isTrainingSearchLoading) {
    trainingLoading = (
      <Flex p={5} color="greensoft.500">
        <Text mr={4}>Recherche des formations en cours</Text>
        <Spinner thickness="4px" />
      </Flex>
    )
  }

  const resultListProperties = {
    textAlign: "left",
    marginLeft: "10px",
    color: "grey.650",
    fontWeight: 600,
    fontSize: "22px",
    marginBottom: "0px",
    padding: "0 20px",
    mt: [0, 0, 2],
  }

  return (
    <Box pt="0">
      <Box {...resultListProperties}>
        {trainingLoading}
        {jobLoading}
      </Box>
    </Box>
  )
}

export default ResultListsLoading
