import { Box } from "@chakra-ui/react"

export const BorderedBox = ({ children, ...otherProps }: Parameters<typeof Box>[0]) => (
  <Box border="1px solid #000091" px={[3, 4, 4, 8]} py={[3, 3, 3, 8]} {...otherProps}>
    {children}
  </Box>
)
