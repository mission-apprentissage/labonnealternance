import React from "react"
import FilterButton from "./FilterButton"
import purpleFilterIcon from "../../../public/images/icons/purpleFilter.svg"
import { Box, Button, Flex, Image, Spinner, Text } from "@chakra-ui/react"

const ResultListsCounter = (props) => {
  const scopeContext = props.scopeContext
  const filterButtonClicked = props.filterButtonClicked
  const getJobCount = props.getJobCount
  const allJobSearchError = props.allJobSearchError
  const trainingSearchError = props.trainingSearchError
  const isTrainingSearchLoading = props.isTrainingSearchLoading
  const isJobSearchLoading = props.isJobSearchLoading
  const jobs = props.jobs
  const trainings = props.trainings
  const activeFilter = props.activeFilter
  const showSearchForm = props.showSearchForm

  if (allJobSearchError && trainingSearchError) return ""

  let jobLoading = ""
  let jobCount = 0

  if (scopeContext.isJob) {
    if (isJobSearchLoading) {
      jobLoading = (
        <Flex p={5} color="pinksoft.600">
          <Text mr={4}>Recherche des entreprises en cours</Text>
          <Spinner thickness="4px" />
        </Flex>
      )
    } else if (!allJobSearchError) {
      jobCount = getJobCount(jobs)
    }
  }

  let trainingCount = 0
  let trainingLoading = ""

  if (scopeContext.isTraining) {
    if (isTrainingSearchLoading) {
      trainingLoading = (
        <Flex p={5} color="greensoft.500">
          <Text mr={4}>Recherche des formations en cours</Text>
          <Spinner thickness="4px" />
        </Flex>
      )
    } else if (!trainingSearchError) {
      trainingCount = trainings ? trainings.length : 0
    }
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

  const filterZoneProperties = {
    justifyContent: "left",
    paddingLeft: "31px",
    marginBottom: "4px",
    alignItems: ["left", "left", "left", "center"],
  }

  return (
    <Box pt="0">
      <Box {...resultListProperties}>
        {trainingLoading}
        {jobLoading}
      </Box>

      <Flex direction={["column", "column", "column", "row"]} wrap="wrap" mt={4} {...filterZoneProperties}>
        {!trainingLoading && !jobLoading && scopeContext.isJob && scopeContext.isTraining ? (
          <>
            <Box mr={4} textAlign="left" fontSize="14px" display={["none", "none", "block"]}>
              Que souhaitez-vous voir ?
            </Box>
            <Flex>
              <FilterButton type="all" count={jobCount + trainingCount} isActive={activeFilter === "all"} handleFilterButtonClicked={filterButtonClicked} />
              <FilterButton type="jobs" count={jobCount} isActive={activeFilter === "jobs"} handleFilterButtonClicked={filterButtonClicked} />
              <FilterButton type="trainings" count={trainingCount} isActive={activeFilter === "trainings"} handleFilterButtonClicked={filterButtonClicked} />
              <Button
                background="none"
                border="none"
                title="Accéder aux filtrage des résultats"
                display={["flex", "flex", "none"]}
                mt="-10px"
                ml="auto"
                mr="30px"
                pt="15px"
                onClick={showSearchForm}
              >
                <Image width="24px" height="24px" src={purpleFilterIcon} alt="" />
              </Button>
            </Flex>
          </>
        ) : (
          ""
        )}
      </Flex>
    </Box>
  )
}

export default ResultListsCounter
