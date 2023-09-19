import { Container, Divider, Icon, Link, Stack, Text } from "@chakra-ui/react"
import { FiExternalLink } from "react-icons/fi"

export default () => (
  <Container maxW="container.xl" py={[5, 10]}>
    <Stack direction={["column", "row"]}>
      <Link color="emphase" href="https://beta.gouv.fr/accessibilite/" isExternal>
        Accessibilité
      </Link>
      <Divider height={["0px", "20px"]} orientation="vertical" />
      <Link color="emphase" href="https://beta.gouv.fr/apropos/" isExternal>
        Mention Légales
      </Link>
      <Divider height={["0px", "20px"]} orientation="vertical" />
      <Link color="emphase" href="https://beta.gouv.fr/suivi/" isExternal>
        Données personnelles
      </Link>
      <Divider height={["0px", "20px"]} orientation="vertical" />
      <Link color="emphase" href="https://matcha.apprentissage.beta.gouv.fr/metabase/public/dashboard/2a87d60c-f287-4c54-92eb-6f277cda5204" isExternal>
        Statistiques
      </Link>
      <Divider height={["0px", "20px"]} orientation="vertical" />
      <Link color="emphase" href="https://labonnealternance.apprentissage.beta.gouv.fr/contact" isExternal>
        Contact
      </Link>
    </Stack>

    <Text pt={8} color="emphase">
      Sauf mention contraire, tous les textes de ce site sont sous{" "}
      <Link href="https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf" isExternal>
        <Text as="u">
          licence Etatlab-2.0 <Icon as={FiExternalLink} mx={1} />
        </Text>
      </Link>
    </Text>
  </Container>
)
