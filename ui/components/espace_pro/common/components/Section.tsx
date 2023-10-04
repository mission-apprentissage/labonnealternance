import { Box } from "@chakra-ui/react"

export const Section = ({ children }) => {
  return (
    <Box border="1px solid #000091" p={["4", "8"]}>
      {children}
    </Box>
  )
}
