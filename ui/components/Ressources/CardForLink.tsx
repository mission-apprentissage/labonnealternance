import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Center, Flex, GridItem, Image, Link, Text } from "@chakra-ui/react"

const boxProperties = {
  boxShadow: "0px 0px 12px 6px rgba(121, 121, 121, 0.4)",
}

export const CardForLink = ({ imageUrl, text, link, linkTitle, linkAriaLabel }: { imageUrl: string; text: string; link: string; linkTitle: string; linkAriaLabel?: string }) => {
  return (
    <GridItem padding={6} style={boxProperties}>
      <Flex>
        <Image src={imageUrl} alt="" mr={4} aria-hidden="true" />
        <Center>
          <Box>
            <Text fontWeight={700} as="div">
              {text}
            </Text>
            <Link href={link} isExternal variant="basicUnderlinedBlue" aria-label={linkAriaLabel}>
              {linkTitle}
              <ExternalLinkIcon mb="3px" ml="2px" />
            </Link>
          </Box>
        </Center>
      </Flex>
    </GridItem>
  )
}
