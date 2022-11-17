import React from "react";
import { Box, Container, Flex, Link, List, ListItem, Text } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { ExternalLinkLine } from "../../theme/components/icons";
import { Logo } from "./LogoFooter";

/**
 * @description Footer component.
 * @return {JSX.Element}
 */
const Footer = () => {
  return (
    <Box borderTop="1px solid" borderColor="bluefrance" color="#1E1E1E" fontSize="zeta" w="full">
      <Container maxW="xl">
        <Flex flexDirection={["column", "column", "row"]}>
          <Link as={NavLink} to="/" py={4} w={["100%", "100%", "50%"]}>
            <Logo size={"xl"} />
          </Link>
          <Box alignSelf="center" flex="1">
            <Text>
              Mandatée par le Ministère du Travail, de l'Emploi et de l'Insertion, le Ministère de la Transformation et
              de la Fonction publiques, le Ministère de l'Education Nationale, de la Jeunesse et des Sports, le
              Ministère de la Recherche, de l'Enseignement Supérieur et de l'Innovation, la{" "}
              <Link
                href="https://beta.gouv.fr/startups/?incubateur=mission-apprentissage"
                textDecoration="underline"
                isExternal
              >
                Mission interministérielle pour l'apprentissage
              </Link>{" "}
              développe plusieurs services destinés à faciliter les entrées en apprentissage.
            </Text>
            <br />
            <List textStyle="sm" fontWeight="700" flexDirection="row" flexWrap="wrap" mb={[3, 3, 0]} display="flex">
              <ListItem>
                <Link href="https://www.legifrance.gouv.fr/" mr={4} isExternal>
                  legifrance.gouv.fr
                </Link>
              </ListItem>
              <ListItem>
                <Link href="https://www.gouvernement.fr/" mr={4} isExternal>
                  gouvernement.fr
                </Link>
              </ListItem>
              <ListItem>
                <Link href="https://www.service-public.fr/" mr={4} isExternal>
                  service-public.fr
                </Link>
              </ListItem>
              <ListItem>
                <Link href="https://www.data.gouv.fr/fr/" isExternal>
                  data.gouv.fr
                </Link>
              </ListItem>
            </List>
          </Box>
        </Flex>
      </Container>
      <Box borderTop="1px solid" borderColor="#CECECE" color="#6A6A6A">
        <Container maxW="xl" py={[3, 3, 5]}>
          <Flex flexDirection={["column", "column", "row"]}>
            <List textStyle="xs" flexDirection="row" flexWrap="wrap" display="flex" flex="1">
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link as={NavLink} to="/mentions-legales">
                  Mentions légales
                </Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link as={NavLink} to="/cookies">
                  Gestion des cookies
                </Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link as={NavLink} to="/informations">
                  Foire aux questions
                </Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link as={NavLink} to="/widget/tutorial">
                  Intégration du Widget
                </Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href="https://labonnealternance.apprentissage.beta.gouv.fr/contact" isExternal>
                  Contact
                  <ExternalLinkLine w="0.55rem" h="0.55rem" mb="0.125rem" ml={1} />
                </Link>
              </ListItem>
              <ListItem _after={{ content: "'|'", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href="https://mission-apprentissage.gitbook.io/rendez-vous-apprentissage-inscription/" isExternal>
                  Connaitre le service
                  <ExternalLinkLine w="0.55rem" h="0.55rem" mb="0.125rem" ml={1} />
                </Link>
              </ListItem>
              <ListItem _after={{ content: "''", marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                <Link href="https://github.com/mission-apprentissage/prise-de-rdv" isExternal>
                  Code source
                  <ExternalLinkLine w="0.55rem" h="0.55rem" mb="0.125rem" ml={1} />
                </Link>
              </ListItem>
            </List>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;
