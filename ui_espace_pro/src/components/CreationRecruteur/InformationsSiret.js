import { Flex, Heading, Link, Text, Box, Button, Stack, UnorderedList, ListItem } from "@chakra-ui/react"
import { AUTHTYPE } from "../../common/contants"
import { ExternalLinkLine, InfoCircle } from "../../theme/components/icons"
import { useNavigate } from "react-router-dom"

export const InformationsSiret = ({ type }) => {
  const navigate = useNavigate()

  return (
    <>
      {type === AUTHTYPE.CFA && (
        <Stack direction="column" spacing={3} mb={5}>
          <Heading fontSize="24px">Comment s'inscrire ?</Heading>
          <Text>Pour créer le compte de votre organisme de formation, il faut :</Text>
          <UnorderedList>
            <ListItem mx={10} mb={5}>
              <span style={{ fontWeight: "700" }}>Être référencé dans</span>{" "}
              <CatalogueLink url="https://catalogue.apprentissage.beta.gouv.fr/recherche/etablissements">le catalogue des offres de formations en apprentissage</CatalogueLink>.
              Pour ajouter une offre de formation au Catalogue de l’offre de formation en apprentissage, merci de la déclarer auprès du Carif-Oref de votre région en allant sur la
              page suivante : <CatalogueLink href="https://reseau.intercariforef.org/referencer-son-offre-de-formation">référencer son offre de formation</CatalogueLink>
            </ListItem>
            <ListItem mx={10}>
              <span style={{ fontWeight: "700" }}>Être certifié Qualiopi.</span>{" "}
              <CatalogueLink url="https://travail-emploi.gouv.fr/formation-professionnelle/acteurs-cadre-et-qualite-de-la-formation-professionnelle/liste-organismes-certificateurs">
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
              <CatalogueLink url="https://annuaire-entreprises.data.gouv.fr/" bold={true}>
                l’annuaire des entreprises
              </CatalogueLink>{" "}
              ou bien sur les registres de votre entreprise.
            </>
          ) : (
            <>
              Le numéro d’identification de votre organisme peut être trouvé sur{" "}
              <CatalogueLink url="https://catalogue.apprentissage.beta.gouv.fr/recherche/etablissements" bold={true}>
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
        <Text>Connectez-vous à votre compte entreprise pour publier de nouvelles offres et administrer vos offres existantes.</Text>
        <Button variant="primary" mt={4} onClick={() => navigate("/authentification")}>
          Me connecter
        </Button>
      </Box>
    </>
  )
}

const CatalogueLink = ({ url, children, bold = false }) => {
  return (
    <Link href={url} {...(bold ? { variant: "classic" } : {})} isExternal style={bold ? {} : { textDecoration: "underline" }}>
      {children} <ExternalLinkLine h={3} />
    </Link>
  )
}
