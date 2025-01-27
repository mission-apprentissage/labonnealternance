import { Button, Flex, FormControl, Image, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useContext } from "react"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { ParameterContext } from "../../context/ParameterContextProvider"
import { ScopeContext } from "../../context/ScopeContext"
import { currentSearch } from "../../utils/currentPage"
import { refreshLocationMarkers } from "../../utils/mapTools"
import pushHistory from "../../utils/pushHistory"

const DisplayMapButton = (props) => {
  const router = useRouter()

  const { formValues } = useContext(DisplayContext)
  const { displayMap, setDisplayMap } = useContext(ParameterContext)
  const scopeContext = useContext(ScopeContext)

  const toggleMapDisplay = () => {
    const shouldRefreshLocationMarkers = !displayMap
    setDisplayMap(shouldRefreshLocationMarkers)

    if (shouldRefreshLocationMarkers) {
      refreshLocationMarkers({ jobs: props.jobs, trainings: props.trainings, scopeContext })
    }

    // @ts-ignore
    pushHistory({
      router,
      display: "list",
      searchParameters: formValues,
      searchTimestamp: currentSearch,
      displayMap: shouldRefreshLocationMarkers,
    })
  }

  return (
    <Flex flex="1 auto" alignItems="center" justifyContent="flex-end" display={["none", "none", "flex"]}>
      <FormControl flex="0" justifyContent="flex-end" alignItems="center">
        <Button
          aria-checked={displayMap}
          role="switch"
          mr={[4, 4, 4, 12]}
          mt={0}
          display="flex"
          _hover={{ bg: "none" }}
          _focus={{ bg: "none" }}
          background="none"
          border="none"
          onClick={toggleMapDisplay}
        >
          <Text as="span" fontWeight={400} mr={8} mb="0" fontSize="1rem">
            Afficher la carte
          </Text>{" "}
          <Image mb="2px" mr="5px" src={displayMap ? "/images/switch-on.svg" : "/images/switch-off.svg"} alt="" />
        </Button>
      </FormControl>
    </Flex>
  )
}

export default DisplayMapButton
