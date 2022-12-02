import React, { useContext } from "react"

import { useRouter } from "next/router"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { ParameterContext } from "../../context/ParameterContextProvider"

import { pick } from "lodash"
import SearchForm from "../../components/SearchForTrainingsAndJobs/components/SearchForm"
import WidgetHeader from "../../components/WidgetHeader/WidgetHeader"
import { Box } from "@chakra-ui/react"

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
      <Box display={["block", "block", "block", "none"]}>
        <SearchForm handleSearchSubmit={handleSearchSubmitFunction} isHome={true} showResultList={() => {}} />
      </Box>
      <Box display={["none", "none", "none", "block"]}>
        <WidgetHeader handleSearchSubmit={handleSearchSubmit} isHome={true} />
      </Box>
    </>
  )
}

export default StartForm
