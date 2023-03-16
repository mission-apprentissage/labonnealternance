import React, { useContext } from "react"
import { useRouter } from "next/router"
import switchOnImage from "../../public/images/switch-on.svg"
import switchOffImage from "../../public/images/switch-off.svg"
import { Button, Flex, FormControl, Image, Text } from "@chakra-ui/react"
import { ParameterContext } from "../../context/ParameterContextProvider"
import { DisplayContext } from "../../context/DisplayContextProvider"
import { ScopeContext } from "../../context/ScopeContext"
import { currentSearch } from "../../utils/currentPage.js"
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

        if(shouldRefreshLocationMarkers) {
        refreshLocationMarkers( { jobs: props.jobs, trainings: props.trainings, scopeContext } )      
        }

        pushHistory({
            router,
            scopeContext,
            display: "list",
            searchParameters: formValues,
            searchTimestamp: currentSearch,
            displayMap: shouldRefreshLocationMarkers,
        })
    }


    return <Flex flex="1 auto" mt={[0,0,2]} alignItems="center" justifyContent="flex-end" display={["none", "none", "flex"]}>
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

}

export default DisplayMapButton