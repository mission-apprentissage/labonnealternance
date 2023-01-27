import { Box, Center, Heading, Icon, Link, Stack, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { CircleCheck, OctogoneCross } from "../theme/components/icons"

export default ({ header, description, lien, type }) => {
  const [color, setColor] = useState("")

  const getBannerType = () => {
    switch (type) {
      case "success":
        setColor("#18753C")

        break
      case "error":
        setColor("red.500")

        break
      default:
        break
    }
  }

  useEffect(() => getBannerType(), [type])

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
