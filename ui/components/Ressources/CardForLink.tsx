import { Box, Center, Flex, GridItem, Image, Text } from "@chakra-ui/react"

import { DsfrLink } from "../dsfr/DsfrLink"

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
            <DsfrLink href={link} aria-label={linkAriaLabel}>
              {linkTitle}
            </DsfrLink>
          </Box>
        </Center>
      </Flex>
    </GridItem>
  )
}
