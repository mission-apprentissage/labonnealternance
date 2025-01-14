import { Box, Show } from "@chakra-ui/react"
import { pick } from "lodash"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import React, { useContext } from "react"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { ParameterContext } from "../../context/ParameterContextProvider"

const SearchFormResponsive = dynamic(() => import("../SearchForTrainingsAndJobs/components/SearchFormResponsive"))
const WidgetHeader = dynamic(() => import("../WidgetHeader/WidgetHeader"))

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
      <Show below="lg">
        <Box marginBottom="24px">
          <SearchFormResponsive handleSearchSubmit={handleSearchSubmitFunction} isHome={true} showResultList={() => {}} />
        </Box>
      </Show>
      <Show above="lg">
        <Box>
          <WidgetHeader handleSearchSubmit={handleSearchSubmit} isHome={true} />
        </Box>
      </Show>
    </>
  )
}

export default StartForm
