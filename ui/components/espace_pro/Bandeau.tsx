import { Box, Center, Heading, Icon, Link, Stack, Text } from "@chakra-ui/react"

import { CircleCheck, OctogoneCross } from "../../theme/components/icons"

const Bandeau = ({ header, description, lien, type }) => {
  const color = getBannerColor(type)

  return (
    <Stack direction="row" spacing={0} mt={[2, 10]} maxH={["auto", "88px"]}>
      <Box bg={color} w="40px" minW={["40px", "auto"]}>
        <Center>
          <Icon as={type === "success" ? CircleCheck : OctogoneCross} mt={3} w="22px" h="20px" />
        </Center>
      </Box>
      <Box border="1px solid" borderColor={color} p={3} flexGrow="1">
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

const getBannerColor = (type) => {
  switch (type) {
    case "success":
      return "#18753C"
    case "error":
      return "red.500"
    default:
      return ""
  }
}

export default Bandeau
