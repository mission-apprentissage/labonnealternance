import { Box, Text, Flex } from "@chakra-ui/react"
import type { PropsWithChildren } from "react"

import { IconeLogo } from "../../../../theme/components/icons"

export const FormHeaderComponent = ({ children }: PropsWithChildren) => {
  return (
    <Box bg="#F9F8F6">
      <Flex alignItems="center" flexDirection={["column", "column", "row"]}>
        <Box flex="1" ml={["0", "0", "6em"]}>
          <Flex flexDirection={["column", "column", "row"]} mt={[7, 0, 0]}>
            <Text fontSize="2rem" fontWeight="bold" lineHeight="2.5rem" color="info">
              {children}
            </Text>
          </Flex>
        </Box>
        <Box mr="2rem" mt={8}>
          <IconeLogo w={["0px", "0px", "300px"]} h={["0px", "0px", "174px"]} />
        </Box>
      </Flex>
    </Box>
  )
}

// FormHeaderComponent.propTypes = {
//   children: PropTypes.node,
// }
