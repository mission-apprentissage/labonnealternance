"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, List, ListItem, Stack, Typography } from "@mui/material"
import { useRouter } from "next/navigation"
import { CFA, ENTREPRISE } from "shared/constants/index"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

import { InfoCircle } from "../../../theme/components/icons"

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

const CatalogueLink = ({ href, children, bold = false, ...rest }: { href: string; children: React.ReactNode; bold?: boolean } & Parameters<typeof DsfrLink>[0]) => {
  return (
    <DsfrLink href={href} {...(bold ? { variant: "classic" } : {})} external {...rest}>
      {children}
    </DsfrLink>
  )
}

function InformationsEntreprise() {
  const router = useRouter()

  return (
    <>
      <Typography component="h2" sx={{ fontSize: "24px", fontWeight: 700, mb: fr.spacing("3v") }}>
        Où trouver votre SIRET ?
      </Typography>
      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        <span style={{ color: "#000091" }}>
          <InfoCircle sx={{ mr: fr.spacing("1w") }} />
        </span>
        <Typography>
          Le numéro d’identification de votre entreprise peut être trouvé sur{" "}
          <CatalogueLink href="https://annuaire-entreprises.data.gouv.fr/" aria-label="Site de l'annuaire des entreprises - nouvelle fenêtre">
            l’annuaire des entreprises
          </CatalogueLink>{" "}
          ou bien sur les registres de votre entreprise.
        </Typography>
      </Box>
      <Box sx={{ mt: fr.spacing("5v") }}>
        <Typography component="h2" sx={{ fontSize: "24px", fontWeight: 700, mb: fr.spacing("3v") }}>
          Vous avez déjà déposé une offre en alternance par le passé ?
        </Typography>
        <Typography>Connectez-vous à votre compte entreprise pour publier de nouvelles offres et administrer vos offres existantes.</Typography>
        <Box sx={{ mt: fr.spacing("2w") }}>
          <Button priority="primary" onClick={() => router.push("/espace-pro/authentification")}>
            Me connecter
          </Button>
        </Box>
      </Box>
    </>
  )
}

function InformationsCfa() {
  const router = useRouter()
  return (
    <>
      <Stack direction="column" sx={{ gap: fr.spacing("3v"), mb: fr.spacing("5v") }}>
        <Typography component="h2" sx={{ fontSize: "24px", fontWeight: 700 }}>
          Comment s'inscrire ?
        </Typography>
        <Typography>Pour créer le compte de votre organisme de formation, il faut :</Typography>
        <List>
          <ListItem>
            <span style={{ fontWeight: "700" }}>Être référencé dans le Catalogue.</span> Pour ajouter une offre de formation au Catalogue de l’offre de formation en apprentissage,
            merci de la déclarer auprès du Carif-Oref de votre région en allant sur la page suivante :{" "}
            <CatalogueLink href="https://reseau.intercariforef.org/referencer-son-offre-de-formation" arial-label="Site intercariforef.org - nouvelle fenêtre">
              "référencer son offre de formation"
            </CatalogueLink>
          </ListItem>
          <ListItem>
            <span style={{ fontWeight: "700" }}>Être certifié Qualiopi.</span>{" "}
            <CatalogueLink
              href="https://travail-emploi.gouv.fr/formation-professionnelle/acteurs-cadre-et-qualite-de-la-formation-professionnelle/liste-organismes-certificateurs"
              aria-label="Site travail-emploi.gouv.fr - nouvelle fenêtre"
            >
              La certification Qualiopi
            </CatalogueLink>{" "}
            est l’unique moyen d’accéder au fichier national des organismes de formation référencés et de permettre à vos entreprises clientes de faire financer vos actions avec
            les fonds publics.
          </ListItem>
        </List>
      </Stack>
      <Typography component="h2" sx={{ fontSize: "24px", fontWeight: 700, mb: fr.spacing("3v") }}>
        Où trouver votre SIRET ?
      </Typography>
      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        <span style={{ color: "#000091" }}>
          <InfoCircle sx={{ mr: fr.spacing("1w") }} />
        </span>
        <Typography>
          Le numéro d’identification de votre organisme peut être trouvé sur le site Le numéro d’identification de votre entreprise peut être trouvé sur{" "}
          <CatalogueLink
            href="https://catalogue.apprentissage.beta.gouv.fr/recherche/etablissements"
            aria-label="Site du catalogue des offres de formations en apprentissage - nouvelle fenêtre"
          >
            le catalogue des offres de formations en apprentissage
          </CatalogueLink>{" "}
          ou bien sur les registres de votre organisme de formation.
        </Typography>
      </Box>
      <Box mt={5}>
        <Typography component="h2" sx={{ fontSize: "24px", fontWeight: 700, mb: fr.spacing("3v") }}>
          Vous avez déjà déposé une offre en alternance par le passé ?
        </Typography>
        <Typography>Connectez-vous à votre compte CFA pour publier de nouvelles offres et administrer vos offres existantes.</Typography>
        <Box sx={{ mt: fr.spacing("2w") }}>
          <Button priority="primary" onClick={() => router.push("/espace-pro/authentification")}>
            Me connecter
          </Button>
        </Box>
      </Box>
    </>
  )
}
