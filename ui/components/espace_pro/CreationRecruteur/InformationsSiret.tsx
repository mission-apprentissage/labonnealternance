import { Flex, Heading, Link, Text, Box, Button, Stack, UnorderedList, ListItem } from "@chakra-ui/react"
import { useRouter } from "next/router"

import { AUTHTYPE } from "../../../common/contants"
import { ExternalLinkLine, InfoCircle } from "../../../theme/components/icons"

export const InformationsSiret = ({ type }) => {
  const router = useRouter()

  return (
    <>
      {type === AUTHTYPE.CFA && (
        <Stack direction="column" spacing={3} mb={5}>
          <Heading fontSize="24px">Comment s'inscrire ?</Heading>
          <Text>Pour créer le compte de votre organisme de formation, il faut :</Text>
          <UnorderedList>
            <ListItem mx={10} mb={5}>
              <span style={{ fontWeight: "700" }}>Être référencé dans</span>{" "}
              <CatalogueLink
                url="https://catalogue.apprentissage.beta.gouv.fr/recherche/etablissements"
                aria-label="Catalogue des offres de formations en apprentissage - nouvelle fenêtre"
              >
                le catalogue des offres de formations en apprentissage
              </CatalogueLink>
              . Pour ajouter une offre de formation au Catalogue de l’offre de formation en apprentissage, merci de la déclarer auprès du Carif-Oref de votre région en allant sur
              la page suivante :{" "}
              <CatalogueLink url="https://reseau.intercariforef.org/referencer-son-offre-de-formation" arial-label="Site intercariforef.org - nouvelle fenêtre">
                référencer son offre de formation
              </CatalogueLink>
            </ListItem>
            <ListItem mx={10}>
              <span style={{ fontWeight: "700" }}>Être certifié Qualiopi.</span>{" "}
              <CatalogueLink
                url="https://travail-emploi.gouv.fr/formation-professionnelle/acteurs-cadre-et-qualite-de-la-formation-professionnelle/liste-organismes-certificateurs"
                aria-label="Site travail-emploi.gouv.fr - nouvelle fenêtre"
              >
                La certification Qualiopi <ExternalLinkLine h={3} />
              </CatalogueLink>{" "}
              est l’unique moyen d’accéder au fichier national des organismes de formation référencés et de permettre à vos entreprises clientes de faire financer vos actions avec
              les fonds publics.
            </ListItem>
          </UnorderedList>
        </Stack>
      )}
      <Heading fontSize="24px" mb={3}>
        Où trouver votre SIRET ?
      </Heading>
      <Flex alignItems="flex-start">
        <InfoCircle mr={2} mt={1} />
        <Text textAlign="justify">
          {type === AUTHTYPE.ENTREPRISE ? (
            <>
              Le numéro d’identification de votre entreprise peut être trouvé sur{" "}
              <CatalogueLink url="https://annuaire-entreprises.data.gouv.fr/" bold={true} aria-label="Site de l'annuaire des entreprises - nouvelle fenêtre">
                l’annuaire des entreprises
              </CatalogueLink>{" "}
              ou bien sur les registres de votre entreprise.
            </>
          ) : (
            <>
              Le numéro d’identification de votre organisme peut être trouvé sur{" "}
              <CatalogueLink
                url="https://catalogue.apprentissage.beta.gouv.fr/recherche/etablissements"
                bold={true}
                aria-label="Site du catalogue des offres de formations en apprentissage - nouvelle fenêtre"
              >
                le catalogue des offres de formations en apprentissage
              </CatalogueLink>{" "}
              ou bien sur les registres de votre organisme de formation.
            </>
          )}
        </Text>
      </Flex>
      <Box mt={5}>
        <Heading fontSize="24px" mb={3}>
          Vous avez déjà déposé une offre en alternance par le passé ?
        </Heading>
        <Text>Connectez-vous à votre compte pour publier de nouvelles offres et administrer vos offres existantes.</Text>
        <Button variant="primary" mt={4} onClick={() => router.push("/espace-pro/authentification")}>
          Me connecter
        </Button>
      </Box>
    </>
  )
}

const CatalogueLink = ({ url, children, bold = false, ...rest }) => {
  return (
    <Link href={url} {...(bold ? { variant: "classic" } : {})} isExternal style={bold ? {} : { textDecoration: "underline" }} {...rest}>
      {children} <ExternalLinkLine h={3} />
    </Link>
  )
}
