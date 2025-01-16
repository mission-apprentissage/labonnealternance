import { Box, Text } from "@chakra-ui/react"

import SearchForm from "../SearchForm/SearchForm"

const WidgetHeaderHomePage = (props) => {
  return (
    <Box boxShadow="0 4px 12px 2px rgb(0 0 0 / 21%)" pb={6} pt={[2, 2, 2, 6]} px={4} bg="white" backgroundClip="border-box" borderRadius="10px">
      <Text mb={3} as="h1" fontSize={["26px", "29px"]} fontWeight={700}>
        <Text as="span">Trouvez emploi et formation </Text>
        <Text as="span" color="info">
          en alternance
        </Text>
      </Text>
      <SearchForm {...props} />
    </Box>
  )
}

export default WidgetHeaderHomePage
