// Quick fix before global refactoring

import { Box } from "@chakra-ui/react"

import SearchFormResponsive from "./SearchFormResponsive"

const SearchFormResponsiveHomePage = (props) => {
  return (
    <Box boxShadow="0 4px 12px 2px rgb(0 0 0 / 21%)" pb={6} pt={[2, 2, 2, 6]} px={4} bg="white" backgroundClip="border-box" borderRadius="10px">
      <Box mb={6}>
        <SearchFormResponsive {...props} />
      </Box>
    </Box>
  )
}

export default SearchFormResponsiveHomePage
