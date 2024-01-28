import { Box, Button, Flex, Image } from "@chakra-ui/react"
import { useContext } from "react"

import { DisplayContext } from "../../../context/DisplayContextProvider"
import { ScopeContext } from "../../../context/ScopeContext"
import { SearchResultContext } from "../../../context/SearchResultContextProvider"
import { filterLayers } from "../../../utils/mapTools"
import { SendPlausibleEvent } from "../../../utils/plausible"
import DisplayMapButton from "../../DisplayMapButton/displayMapButton"
import { getJobCount, getPartnerJobCount } from "../services/utils"

import FilterButton from "./FilterButton"

const ResultFilterAndCounter = ({ allJobSearchError, trainingSearchError, isTrainingSearchLoading, isJobSearchLoading, showSearchForm }) => {
  const scopeContext = useContext(ScopeContext)

  const { jobs, trainings } = useContext(SearchResultContext)
  const { activeFilters, setActiveFilters } = useContext(DisplayContext)

  const filterButtonClicked = (filterButton) => {
    let filters = activeFilters
    filters.includes(filterButton) ? filters.splice(filters.indexOf(filterButton), 1) : filters.push(filterButton)
    if (!filters.length) {
      filters = ["jobs", "trainings", "duo"]
    }

    setActiveFilters(filters)
    filterLayers(filters)
    if (filterButton === "duo" && filters.includes("duo")) {
      SendPlausibleEvent("Clic onglet formations+emplois - Liste de résultats")
    }
  }

  if (allJobSearchError && trainingSearchError) return ""

  const jobLoading = ""
  let jobCount = 0
  let partnerJobCount = 0

  if (scopeContext.isJob && !isJobSearchLoading && !allJobSearchError) {
    jobCount = getJobCount(jobs)
    partnerJobCount = getPartnerJobCount(jobs)
  }

  let trainingCount = 0
  const trainingLoading = ""

  if (scopeContext.isTraining && !isTrainingSearchLoading && !trainingSearchError) {
    trainingCount = trainings ? trainings.length : 0
  }

  const filterZoneProperties = {
    justifyContent: "left",
    paddingLeft: ["8px", "8px", "8px", "16px"],
    marginTop: "12px",
    marginBottom: "4px",
    maxWidth: "1275px",
    alignItems: ["left", "left", "left", "center"],
  }

  return (
    <Box pt="0">
      <Flex direction={["column", "column", "column", "row"]} wrap="wrap" {...filterZoneProperties}>
        {!trainingLoading && !jobLoading && (
          <Flex flexFlow="row wrap" justifyContent="flex-end" width="100%">
            <Flex width="100%" flex="2 auto" flexWrap={["wrap", "wrap", "nowrap"]}>
              {scopeContext.isJob && scopeContext.isTraining && (
                <>
                  <FilterButton type="jobs" count={jobCount - partnerJobCount} isActive={activeFilters.includes("jobs")} handleFilterButtonClicked={filterButtonClicked} />
                  <FilterButton type="trainings" count={trainingCount} isActive={activeFilters.includes("trainings")} handleFilterButtonClicked={filterButtonClicked} />
                  {partnerJobCount > 0 && (
                    <FilterButton type="duo" count={partnerJobCount} isActive={activeFilters.includes("duo")} handleFilterButtonClicked={filterButtonClicked} />
                  )}
                </>
              )}
              <DisplayMapButton jobs={jobs} trainings={trainings} />

              <Button
                background="none"
                border="none"
                title="Accéder aux filtrage des résultats"
                display={["flex", "flex", "none"]}
                mt="-10px"
                pt="15px"
                px="0"
                fontWeight="400"
                fontSize="14px"
                textDecoration="underline"
                color="bluefrance.500"
                onClick={showSearchForm}
                _active={{
                  background: "none",
                }}
                _focus={{
                  background: "none",
                }}
                _hover={{
                  background: "none",
                }}
              >
                <Image width="24px" height="24px" src="/images/icons/filter.svg" alt="" />
                Filtres
              </Button>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Box>
  )
}

export default ResultFilterAndCounter
