import React, { useContext } from "react"
import FilterButton from "./FilterButton"
import purpleFilterIcon from "../../../public/images/icons/purpleFilter.svg"
import { Box, Button, Flex, FormControl, Image, Spinner, Text } from "@chakra-ui/react"
import switchOnImage from "../../../public/images/switch-on.svg"
import switchOffImage from "../../../public/images/switch-off.svg"

import { ParameterContext } from "../../../context/ParameterContextProvider"

import { refreshLocationMarkers } from "../../../utils/mapTools"

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

  const { displayMap, setDisplayMap } = useContext(ParameterContext)

  if (allJobSearchError && trainingSearchError) return ""

  let jobLoading = ""
  let jobCount = 0

  const toggleMapDisplay = () => {
    const shouldRefreshLocationMarkers = !displayMap
    setDisplayMap(shouldRefreshLocationMarkers)

    if(shouldRefreshLocationMarkers) {
      refreshLocationMarkers( { jobs, trainings, scopeContext } )      
    }
  }

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
            <Flex flexFlow="row wrap" justifyContent="flex-end" width="100%">
              <Box flex="1 auto" mr={4} textAlign="left" fontSize="14px" display={["none", "none", "block"]}>
                Que souhaitez-vous voir ?
              </Box>
              <Flex flex="1 auto" mb={2} alignItems="center" >
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
              <Flex flex="1 auto" mb={2} alignItems="center" justifyContent="flex-end" display={["none", "none", "flex"]}>
                <FormControl  flex="0" justifyContent="flex-end" alignItems='center'>
                  <Button mr={[4,4,4,12]} mt={0} display='flex' _hover={{ bg: "none" }} _focus={{ bg: "none" }} background="none" border="none" onClick={toggleMapDisplay}>
                    <Text as="span" fontWeight={400} mr={8} mb='0' fontSize="1rem" >
                      Afficher la carte
                    </Text>
                    {" "}
                    <Image mb="2px" mr="5px" src={displayMap ? switchOnImage : switchOffImage} alt={`Cliquer pour ${displayMap?"masquer":"afficher"} la carte`} />
                  </Button>
                </FormControl>
              </Flex>
              <Flex width="100%" flex="2 auto">
                <FilterButton type="all" count={jobCount + trainingCount} isActive={activeFilter === "all"} handleFilterButtonClicked={filterButtonClicked} />
                <FilterButton type="jobs" count={jobCount} isActive={activeFilter === "jobs"} handleFilterButtonClicked={filterButtonClicked} />
                <FilterButton type="trainings" count={trainingCount} isActive={activeFilter === "trainings"} handleFilterButtonClicked={filterButtonClicked} />
                <FilterButton type="duo" isActive={activeFilter === "duo"} handleFilterButtonClicked={filterButtonClicked} />              
              </Flex>              
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
