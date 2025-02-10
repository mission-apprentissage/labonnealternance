import { Box, Divider, Grid, GridItem, Image, ListItem, Text, UnorderedList } from "@chakra-ui/react"

import { DsfrLink } from "../dsfr/DsfrLink"

export default function AlgoRecruiter({ withLinks }) {
  return (
    <Box as="section" pb={12} backgroundColor="white">
      <Box py={12} backgroundColor="#f5f5fe">
        {/* @ts-expect-error: TODO */}
        <Grid templateColumns={{ base: "repeat(1, 1fr)", lg: "repeat(5, 1fr)" }} spacing="20px">
          {/* @ts-expect-error: TODO */}
          <GridItem colSpan={{ base: "1", lg: "3" }} px={{ base: 3, md: 6, lg: 12 }}>
            <Box as="h2">
              <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">
                La bonne alternance révèle
              </Text>
              <Text as="span" display="block" mb={1} variant="editorialContentH1">
                le marché caché de l&apos;emploi
              </Text>
            </Box>

            <Divider variant="pageTitleDivider" my={12} />
            <Box as="p" mb="3">
              Le saviez-vous ? Afin d&apos;aider les candidats intéressés par l&apos;alternance à trouver un contrat, nous exposons différents types d&apos;entreprises sur notre
              service :
            </Box>
            <UnorderedList>
              <ListItem mb="3">
                <strong>Celles ayant émis un besoin en recrutement </strong>sur notre plateforme ainsi que sur France Travail et ses sites partenaires
              </ListItem>
              <ListItem mb="3">
                <strong>Celles n&apos;ayant pas diffusé d&apos;offres, mais ayant été identifiées comme &quot;à fort potentiel d&apos;embauche en alternance&quot;</strong> grâce à
                l'analyse de diverses données publiques (données de recrutement, données financières, etc.). La bonne alternance identifie ainsi chaque mois une liste restreinte
                d'entreprises à fort potentiel d'embauche en alternance pour faciliter les démarches de candidatures spontanées de ses utilisateurs.
              </ListItem>
            </UnorderedList>
            {withLinks && (
              <DsfrLink href="/desinscription" as="a" aria-label="Accès au formulaire de désinscription au service d'envoi de candidatures spontanées">
                Je ne souhaite plus recevoir de candidature spontanée
                <Image ml={1} display="inline" src="/images/icons/arrow_right.svg" alt="" />
              </DsfrLink>
            )}
          </GridItem>
          {/* @ts-expect-error: TODO */}
          <GridItem colSpan={{ base: "2" }}>
            <Box display="flex" justifyContent="center" alignItems="center" pr={{ base: 0, lg: 12 }}>
              <Image src="/images/icons/algo_recruiter.svg" alt="" />
            </Box>
          </GridItem>
        </Grid>
      </Box>
    </Box>
  )
}
