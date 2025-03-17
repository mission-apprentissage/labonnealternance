"use client"

import { Box, Button, Flex, Heading, Link, ListItem, Stack, Text, UnorderedList } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { CFA, ENTREPRISE } from "shared/constants/index"

import { ExternalLinkLine, InfoCircle } from "../../../theme/components/icons"

import { CustomTabs } from "./CustomTabs"

const panels = [
  {
    id: ENTREPRISE,
    title: "Entreprise",
    content: <InformationsEntreprise />,
  },
  {
    id: CFA,
    title: "Organisme de formation",
    content: <InformationsCfa />,
  },
] as const

type TabId = (typeof panels)[number]["id"]

export const InformationsSiret = ({ currentTab, onCurrentTabChange }: { currentTab: TabId; onCurrentTabChange: (newTab: TabId) => void }) => {
  return <CustomTabs<TabId> panels={panels} currentTab={currentTab} onChange={onCurrentTabChange} />
}

const CatalogueLink = ({ url, children, bold = false, ...rest }: { url: string; children: React.ReactNode; bold?: boolean } & Parameters<typeof Link>[0]) => {
  return (
    <Link href={url} {...(bold ? { variant: "classic" } : {})} isExternal style={bold ? {} : { textDecoration: "underline" }} {...rest}>
      {children} <ExternalLinkLine h={3} />
    </Link>
  )
}

function InformationsEntreprise() {
  const router = useRouter()

  return (
    <>
      <Heading fontSize="24px" mb={3}>
        Où trouver votre SIRET ?
      </Heading>
      <Flex alignItems="flex-start">
        <span style={{ color: "#000091" }}>
          <InfoCircle mr={2} />
        </span>
        <Text>
          Le numéro d’identification de votre entreprise peut être trouvé sur{" "}
          <CatalogueLink url="https://annuaire-entreprises.data.gouv.fr/" aria-label="Site de l'annuaire des entreprises - nouvelle fenêtre">
            l’annuaire des entreprises
          </CatalogueLink>{" "}
          ou bien sur les registres de votre entreprise.
        </Text>
      </Flex>
      <Box mt={5}>
        <Heading fontSize="24px" mb={3}>
          Vous avez déjà déposé une offre en alternance par le passé ?
        </Heading>
        <Text>Connectez-vous à votre compte entreprise pour publier de nouvelles offres et administrer vos offres existantes.</Text>
        <Button variant="primary" mt={4} onClick={() => router.push("/espace-pro/authentification")}>
          Me connecter
        </Button>
      </Box>
    </>
  )
}

function InformationsCfa() {
  const router = useRouter()
  return (
    <>
      <Stack direction="column" spacing={3} mb={5}>
        <Heading>Comment s'inscrire ?</Heading>
        <Text>Pour créer le compte de votre organisme de formation, il faut :</Text>
        <UnorderedList>
          <ListItem>
            <span style={{ fontWeight: "700" }}>Être référencé dans le Catalogue.</span> Pour ajouter une offre de formation au Catalogue de l’offre de formation en apprentissage,
            merci de la déclarer auprès du Carif-Oref de votre région en allant sur la page suivante :{" "}
            <CatalogueLink url="https://reseau.intercariforef.org/referencer-son-offre-de-formation" arial-label="Site intercariforef.org - nouvelle fenêtre">
              "référencer son offre de formation"
            </CatalogueLink>
          </ListItem>
          <ListItem>
            <span style={{ fontWeight: "700" }}>Être certifié Qualiopi.</span>{" "}
            <CatalogueLink
              url="https://travail-emploi.gouv.fr/formation-professionnelle/acteurs-cadre-et-qualite-de-la-formation-professionnelle/liste-organismes-certificateurs"
              aria-label="Site travail-emploi.gouv.fr - nouvelle fenêtre"
            >
              La certification Qualiopi
            </CatalogueLink>{" "}
            est l’unique moyen d’accéder au fichier national des organismes de formation référencés et de permettre à vos entreprises clientes de faire financer vos actions avec
            les fonds publics.
          </ListItem>
        </UnorderedList>
      </Stack>
      <Heading mb={3}>Où trouver votre SIRET ?</Heading>
      <Flex alignItems="flex-start">
        <span style={{ color: "#000091" }}>
          <InfoCircle mr={2} />
        </span>
        <Text>
          Le numéro d’identification de votre organisme peut être trouvé sur le site Le numéro d’identification de votre entreprise peut être trouvé sur{" "}
          <CatalogueLink
            url="https://catalogue.apprentissage.beta.gouv.fr/recherche/etablissements"
            aria-label="Site du catalogue des offres de formations en apprentissage - nouvelle fenêtre"
          >
            le catalogue des offres de formations en apprentissage
          </CatalogueLink>{" "}
          ou bien sur les registres de votre organisme de formation.
        </Text>
      </Flex>
      <Box mt={5}>
        <Heading mb={3}>Vous avez déjà déposé une offre en alternance par le passé ?</Heading>
        <Text>Connectez-vous à votre compte CFA pour publier de nouvelles offres et administrer vos offres existantes.</Text>
        <Button variant="primary" mt={4} onClick={() => router.push("/espace-pro/authentification")}>
          Me connecter
        </Button>
      </Box>
    </>
  )
}
