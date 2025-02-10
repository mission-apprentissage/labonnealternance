import { Box, Image, SimpleGrid, Text } from "@chakra-ui/react"

export default function OrganismesMandataires() {
  return (
    <Box as="section" py={3} mb={{ base: "2", md: "5" }}>
      <SimpleGrid columns={{ sm: 1, md: 2 }} spacing="40px" alignItems={"center"} mt={12}>
        <Box>
          <Image src="/images/home_pics/illu-solliciterCFA.svg" alt="Solliciter CFA" />
        </Box>
        <Box>
          <Text as="h2" variant="homeEditorialH2" mb={{ base: "3", lg: "5" }}>
            Identifiez facilement les organismes de formation en lien avec votre offre d’emploi
          </Text>
          {/* @ts-expect-error: TODO */}
          <Box variant="homeEditorialText">
            Vous pouvez choisir d’être accompagné par les centres de formation et votre OPCO de rattachement, afin d’accélérer vos recrutements.
          </Box>
        </Box>
      </SimpleGrid>
    </Box>
  )
}
