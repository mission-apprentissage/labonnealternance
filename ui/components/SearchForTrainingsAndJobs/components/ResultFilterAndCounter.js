import { useContext } from "react"
import { Box, Flex } from "@chakra-ui/react"
import React from "react"
import { SendPlausibleEvent } from "../../../utils/plausible"
import { filterLayers } from "../../../utils/mapTools"
import { getJobCount, getPartnerJobCount } from "../services/utils"
import { ScopeContext } from "../../../context/ScopeContext"
import FilterButton from "./FilterButton"
import { SearchResultContext } from "../../../context/SearchResultContextProvider"
import DisplayMapButton from "../../DisplayMapButton/displayMapButton"

const ResultFilterAndCounter = ({ allJobSearchError, trainingSearchError, isTrainingSearchLoading, isJobSearchLoading, activeFilter, setActiveFilter }) => {
  const scopeContext = useContext(ScopeContext)

  const { jobs, trainings } = useContext(SearchResultContext)

  const filterButtonClicked = (filterButton) => {
    setActiveFilter(filterButton)
    filterLayers(filterButton)
    if (filterButton === "duo") {
      SendPlausibleEvent("Clic onglet formations+emplois - Liste de résultats")
    }
  }

  if (allJobSearchError && trainingSearchError) return ""

  let jobLoading = ""
  let jobCount = 0
  let partnerJobCount = 0

  if (scopeContext.isJob && !isJobSearchLoading && !allJobSearchError) {
    jobCount = getJobCount(jobs)
    partnerJobCount = getPartnerJobCount(jobs)
  }

  let trainingCount = 0
  let trainingLoading = ""

  if (scopeContext.isTraining && !isTrainingSearchLoading && !trainingSearchError) {
    trainingCount = trainings ? trainings.length : 0
  }

  const filterZoneProperties = {
    justifyContent: "left",
    paddingLeft: "8px",
    marginTop: "8px",
    marginBottom: "4px",
    maxWidth: "1275px",
    alignItems: ["left", "left", "left", "center"],
  }

  return (
    <Box pt="0">
      <Flex direction={["column", "column", "column", "row"]} wrap="wrap" {...filterZoneProperties}>
        {!trainingLoading && !jobLoading && scopeContext.isJob && scopeContext.isTraining && (
          <>
            <Flex flexFlow="row wrap" justifyContent="flex-end" width="100%">
              <Flex width="100%" flex="2 auto">
                <FilterButton type="all" count={jobCount + trainingCount} isActive={activeFilter === "all"} handleFilterButtonClicked={filterButtonClicked} />
                <FilterButton type="jobs" count={jobCount - partnerJobCount} isActive={activeFilter === "jobs"} handleFilterButtonClicked={filterButtonClicked} />
                <FilterButton type="trainings" count={trainingCount} isActive={activeFilter === "trainings"} handleFilterButtonClicked={filterButtonClicked} />
                {!!partnerJobCount && <FilterButton type="duo" count={partnerJobCount} isActive={activeFilter === "duo"} handleFilterButtonClicked={filterButtonClicked} />}
                <DisplayMapButton jobs={jobs} trainings={trainings} />
              </Flex>
            </Flex>
          </>
        )}
      </Flex>
    </Box>
  )
}

export default ResultFilterAndCounter
