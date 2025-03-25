import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Center, Heading, Icon, Link, Stack, Text } from "@chakra-ui/react"
import { assertUnreachable } from "shared"

import { CircleCheck, OctogoneCross } from "../../theme/components/icons"

export type BandeauProps = {
  header: React.ReactNode
  description: React.ReactNode
  lien?: string
  type: "success" | "error"
}

export const Bandeau = ({ header, description, lien = null, type }: BandeauProps) => {
  const color = getBannerColor(type)

  return (
    <Stack direction="row" spacing={0} mb={3} maxH={["auto", "88px"]} className="bandeau">
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
              lien <ExternalLinkIcon mx="2px" />
            </Link>
          )}
        </Text>
      </Box>
    </Stack>
  )
}

const getBannerColor = (type: "success" | "error") => {
  switch (type) {
    case "success":
      return "#18753C"
    case "error":
      return "red.500"
    default:
      assertUnreachable(type)
      return ""
  }
}
