import { Box, Center, Heading, Icon, Link, Stack, Text } from "@chakra-ui/react"
import { OctogoneCross } from "../theme/components/icons"

export default ({ header, description, lien }) => {
  return (
    <Stack direction="row" spacing={0} mt={[2, 10]} maxH={["auto", "88px"]}>
      <Box bg="red.500" w="40px" minW={["40px", "auto"]}>
        <Center>
          <Icon as={OctogoneCross} mt={3} w="22px" h="20px" />
        </Center>
      </Box>
      <Box border="1px solid" borderColor="red.500" p={3} flexGrow="1">
        <Heading fontSize="xl">{header}</Heading>
        <Text lineHeight={9}>
          {description}
          {lien && (
            <Link href={lien} textDecoration="underline" isExternal>
              lien
            </Link>
          )}
        </Text>
      </Box>
    </Stack>
  )
}
