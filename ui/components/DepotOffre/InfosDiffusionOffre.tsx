import { Box, Flex, Grid, Heading, Image, Text } from "@chakra-ui/react"

export const InfosDiffusionOffre = () => {
  return (
    <Box border="1px solid #000091" p={5}>
      <Heading fontSize="24px" mb={6}>
        Profitez d'une visibilité accrue
      </Heading>
      <Text>Une fois créée, votre offre d’emploi sera immédiatement mise en ligne sur les sites suivants : </Text>
      <Grid
        templateColumns={["repeat(2, 1fr)", "repeat(2, 1fr)", "repeat(3, 1fr)", "repeat(3, 1fr)"]}
        gap={4}
        mt={6}
        sx={{
          "& > *": {
            border: "solid 1px #DDDDDD",
            borderRadius: "3px",
            padding: "11px",
            height: "80px",
            width: "100%",
          },
        }}
      >
        <Image src="/images/logosPartenaires/minimal/1j1s.svg" alt="" />
        <Image src="/images/logosPartenaires/minimal/portail-alternance.svg" alt="" />
        <Flex align="center">
          <Image src="/images/logosPartenaires/minimal/affelnet.png" alt="" />
        </Flex>
        <Image src="/images/logosPartenaires/minimal/mon-master.svg" alt="" padding="22px !important" />
        <Image src="/images/logosPartenaires/minimal/parcoursup.svg" alt="" />
        <Image src="/images/logosPartenaires/minimal/france-travail.svg" alt="" padding="14px !important" />
      </Grid>
    </Box>
  )
}
