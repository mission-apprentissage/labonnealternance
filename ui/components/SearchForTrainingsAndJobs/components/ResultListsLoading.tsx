import { Box, Flex, Spinner, Text } from "@chakra-ui/react"
import React, { useContext } from "react"

import { ScopeContext } from "../../../context/ScopeContext"

const ResultListsLoading = ({ jobSearchError, partnerJobSearchError, trainingSearchError, isTrainingSearchLoading, isJobSearchLoading, isPartnerJobSearchLoading }) => {
  const scopeContext = useContext(ScopeContext)

  if (jobSearchError && partnerJobSearchError && trainingSearchError) {
    return <></>
  }

  let jobLoading = <></>

  if (scopeContext.isJob && (isJobSearchLoading || isPartnerJobSearchLoading)) {
    jobLoading = (
      <Flex p={5} color="pinksoft.600">
        <Text mr={4}>Recherche d'entreprises en cours</Text>
        <Spinner thickness="4px" />
      </Flex>
    )
  }

  let trainingLoading = <></>

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
      {/* @ts-expect-error: TODO */}
      <Box {...resultListProperties}>
        {trainingLoading}
        {jobLoading}
      </Box>
    </Box>
  )
}

export default ResultListsLoading
