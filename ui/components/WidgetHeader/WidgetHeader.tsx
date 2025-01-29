import { Box, Flex } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useContext } from "react"

import { SearchResultContext } from "../../context/SearchResultContextProvider"
import SearchForm from "../SearchForm/SearchForm"

const InfoBanner = dynamic(() => import("@/components/InfoBanner/InfoBanner"))
const LogoLBA = dynamic(() => import("@/components/LogoLBA/LogoLBA"))
const ResultFilterAndCounter = dynamic(() => import("../SearchForTrainingsAndJobs/components/ResultFilterAndCounter"))

const WidgetHeader = ({
  handleSearchSubmit,
  isHome = false,
  jobSearchError = undefined,
  trainingSearchError = undefined,
  isJobSearchLoading = undefined,
  isTrainingSearchLoading = undefined,
}) => {
  const { selectedItem } = useContext(SearchResultContext)

  const handleSearchSubmitFunction = (values) => {
    return handleSearchSubmit({ values })
  }

  const formDisplayValue = selectedItem ? "none" : isHome ? "block" : ["none", "none", "block"]

  return (
    <Box zIndex={9} display={formDisplayValue} boxShadow={isHome ? "none" : "0 0 12px 2px rgb(0 0 0 / 21%)"} padding="8px">
      {!isHome && (
        <Box>
          <InfoBanner />
        </Box>
      )}
      <Box margin="auto" maxWidth="1310px">
        <Flex alignItems="flex-start">
          {!isHome && <LogoLBA />}
          <SearchForm handleSearchSubmit={handleSearchSubmitFunction} isHome={isHome} />
        </Flex>
        {!isHome && (
          <ResultFilterAndCounter
            jobSearchError={jobSearchError}
            trainingSearchError={trainingSearchError}
            isJobSearchLoading={isJobSearchLoading}
            isTrainingSearchLoading={isTrainingSearchLoading}
            showSearchForm={() => {}}
          />
        )}
      </Box>
    </Box>
  )
}

export default WidgetHeader
