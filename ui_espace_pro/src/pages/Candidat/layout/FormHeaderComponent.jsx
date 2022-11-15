import { Box, Text, Flex } from "@chakra-ui/react";
import PropTypes from "prop-types";
import { IconeLogo } from "../../../theme/components/icons";

/**
 * @description Form header component.
 * @param {JSX.Element} children - Component
 * @returns {JSX.Element}
 */
export const FormHeaderComponent = ({ children }) => {
  return (
    <Box bg="#F9F8F6">
      <Flex alignItems="center" flexDirection={["column", "column", "row"]}>
        <Box flex="1" ml={["0", "0", "6em"]}>
          <Flex flexDirection={["column", "column", "row"]} mt={[7, 0, 0]}>
            <Text textStyle="h2" color="info">
              {children}
            </Text>
          </Flex>
        </Box>
        <Box mr="2rem" mt={8}>
          <IconeLogo w={["0px", "0px", "300px"]} h={["0px", "0px", "174px"]} />
        </Box>
      </Flex>
    </Box>
  );
};

FormHeaderComponent.propTypes = {
  children: PropTypes.node,
};
