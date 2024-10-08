import { Box } from "@chakra-ui/react"
import { pick } from "lodash"
import { useRouter } from "next/router"
import React, { useContext } from "react"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { ParameterContext } from "../../context/ParameterContextProvider"
import SearchFormResponsive from "../SearchForTrainingsAndJobs/components/SearchFormResponsive"
import WidgetHeader from "../WidgetHeader/WidgetHeader"

const StartForm = () => {
  const router = useRouter()

  const { setFormValues } = useContext(DisplayContext)
  const { setShouldExecuteSearch } = useContext(ParameterContext)

  const handleSearchSubmit = ({ values }) => {
    setFormValues(pick(values, ["job", "location", "radius", "diploma"]))
    setShouldExecuteSearch(true)
    router.push("/recherche-apprentissage")
  }

  const handleSearchSubmitFunction = (values) => {
    return handleSearchSubmit({ values })
  }

  return (
    <>
      <Box display={["block", "block", "block", "none"]} marginBottom="24px">
        <SearchFormResponsive handleSearchSubmit={handleSearchSubmitFunction} isHome={true} showResultList={() => {}} />
      </Box>
      <Box display={["none", "none", "none", "block"]}>
        <WidgetHeader handleSearchSubmit={handleSearchSubmit} isHome={true} />
      </Box>
    </>
  )
}

export default StartForm
