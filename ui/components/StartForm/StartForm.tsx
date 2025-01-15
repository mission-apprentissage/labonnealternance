import { Box, Flex, Show, Skeleton, SkeletonText } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import { useContext } from "react"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { ParameterContext } from "../../context/ParameterContextProvider"

const RenderSearchFormResponsive = () => {
  return (
    <Box p="0">
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
    <Box p="8px">
      <SkeletonText noOfLines={1} mb={3} skeletonHeight="40px" />
      <Flex direction="column">
        <Box mb={4}>
          <Skeleton height="60px" />
        </Box>
      </Flex>
    </Box>
  )
}

const SearchFormResponsive = dynamic(() => import("../SearchForTrainingsAndJobs/components/SearchFormResponsive"), {
  loading: () => <RenderSearchFormResponsive />,
})
const WidgetHeader = dynamic(() => import("../WidgetHeader/WidgetHeader"), {
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
