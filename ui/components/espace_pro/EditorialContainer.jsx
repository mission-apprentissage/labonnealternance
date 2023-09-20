import { SimpleGrid } from "@chakra-ui/react"

export default ({ children }) => {
  return (
    <SimpleGrid columns={[1, 2]} spacing="30px" mt="47px" mb={["51px", "102px"]}>
      {children}
    </SimpleGrid>
  )
}
