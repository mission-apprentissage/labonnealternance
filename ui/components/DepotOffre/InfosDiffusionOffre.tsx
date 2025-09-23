import { Box, Flex, Grid, Heading, Image, Text } from "@chakra-ui/react"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { InfoCircle } from "@/theme/components/icons"

import { BorderedBox } from "../espace_pro/common/components/BorderedBox"

export const InfosDiffusionOffre = () => {
  return (
    <BorderedBox>
      <Heading mb={3}>Profitez d'une visibilité accrue</Heading>
      <Flex alignItems="flex-start" gap={1}>
        <Box as="span" fontSize="15px">
          <InfoCircle sx={{ color: "#000091", width: "20px", height: "20px" }} />
        </Box>
        <Text mb={6}>Cela permettra à votre offre d’être visible des candidats intéressés.</Text>
      </Flex>
      <br />
      <Text>
        Une fois créée, votre offre d’emploi sera immédiatement mise en ligne sur les sites suivants,&nbsp;
        <DsfrLink
          aria-label="Liste des partenaires - nouvelle fenêtre"
          href="https://mission-apprentissage.notion.site/Liste-des-partenaires-de-La-bonne-alternance-3e9aadb0170e41339bac486399ec4ac1"
        >
          et bien d’autres
        </DsfrLink>
        &nbsp;!
      </Text>
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
    </BorderedBox>
  )
}
