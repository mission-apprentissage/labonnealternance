import { Box, Flex, Show, Skeleton, SkeletonText } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import { useContext } from "react"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { ParameterContext } from "../../context/ParameterContextProvider"

const RenderSearchFormResponsive = () => {
  return (
    <Box boxShadow="0 4px 12px 2px rgb(0 0 0 / 21%)" pb={6} pt={[2, 2, 2, 6]} px={4} bg="white" backgroundClip="border-box" borderRadius="10px">
      <SkeletonText noOfLines={1} mb={0} skeletonHeight="40px" />
      <Box my="1"></Box>
      <Flex direction="column">
        <Box mb={3}>
          <Skeleton height="60px" />
        </Box>
        <Box mb={3}>
          <Skeleton height="60px" />
        </Box>
        <Box mb={3}>
          <Skeleton height="60px" />
        </Box>
        <Box mb={10}>
          <Skeleton height="60px" />
        </Box>
        <Box>
          <Skeleton height="48px" />
        </Box>
      </Flex>
    </Box>
  )
}

const RenderWidgetHeader = () => {
  return (
    <Box boxShadow="0 4px 12px 2px rgb(0 0 0 / 21%)" pb={4} pt={[2, 2, 2, 6]} px={4} bg="white" backgroundClip="border-box" borderRadius="10px">
      <Box p="4px">
        <SkeletonText noOfLines={1} mb={3} skeletonHeight="40px" />
        <Flex direction="column">
          <Skeleton height="60px" />
        </Flex>
      </Box>
    </Box>
  )
}

const DynamicSearchFormResponsive = dynamic(() => import("../SearchForTrainingsAndJobs/components/SearchFormResponsiveHomePage"), {
  loading: () => <RenderSearchFormResponsive />,
})
const DynamicWidgetHeader = dynamic(() => import("../WidgetHeader/WidgetHeaderHomePage"), {
  loading: () => <RenderWidgetHeader />,
})

const StartForm = () => {
  const router = useRouter()

  const { setFormValues } = useContext(DisplayContext)
  const { setShouldExecuteSearch } = useContext(ParameterContext)

  const handleSearchSubmit = ({ values }) => {
    const { job, location, radius, diploma } = values
    setFormValues({ job, location, radius, diploma })
    setShouldExecuteSearch(true)
    router.push("/recherche-apprentissage")
  }

  const handleSearchSubmitFunction = (values) => {
    return handleSearchSubmit({ values })
  }

  return (
    <>
      <Show below="lg">
        <DynamicSearchFormResponsive handleSearchSubmit={handleSearchSubmitFunction} isHome={true} showResultList={() => {}} />
      </Show>
      <Show above="lg">
        <DynamicWidgetHeader handleSearchSubmit={handleSearchSubmit} isHome={true} />
      </Show>
    </>
  )
}

export default StartForm
