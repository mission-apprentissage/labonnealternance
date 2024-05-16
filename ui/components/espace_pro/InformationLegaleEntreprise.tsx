import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Flex, Heading, Link, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "react-query"
import { parseEnum } from "shared"
import { CFA, ENTREPRISE, OPCO, OPCOS } from "shared/constants/recruteur"
import { IEntrepriseJson } from "shared/models/entreprise.model"

import { useAuth } from "@/context/UserContext"
import { getEntrepriseInformation } from "@/utils/api"

import { InfoCircle } from "../../theme/components/icons"

import InfoPopover from "./InfoPopover"
import InfoTooltip from "./InfoToolTip"

export type InformationLegaleEntrepriseProps = { siret: string; type: typeof CFA | typeof ENTREPRISE; opco?: OPCOS }

export const InformationLegaleEntreprise = ({ siret, type, opco }: InformationLegaleEntrepriseProps) => {
  const { user } = useAuth()
  const { data } = useQuery(["get-entreprise", siret], () => getEntrepriseInformation(siret, { skipUpdate: true }), { enabled: Boolean(siret) })

  if (!data) return null
  if (data.error === true) return null

  const organization = data?.data
  const raisonSociale = organization?.raison_sociale

  return (
    <Box border="1px solid #000091" p={5}>
      <Heading mb={3} fontSize="2xl">
        Informations légales
      </Heading>
      {raisonSociale && user?.type !== OPCO && (
        <Flex alignItems="flex-start" mb={10}>
          <InfoCircle mr={2} mt={1} />
          <Text>Vérifiez que les informations pré-remplies soient correctes avant de continuer.</Text>
        </Flex>
      )}
      {!raisonSociale && (
        <Flex alignItems="flex-start" mb={10}>
          <InfoCircle mr={2} mt={1} />
          <Box>
            <Text mb={4}>Suite à un problème technique, nous ne sommes pas en mesure d’afficher votre raison sociale et l'adresse de votre établissement.</Text>
            <Text>Nous vous invitons à poursuivre votre parcours. Les informations de votre entreprise seront remplies automatiquement ultérieurement.</Text>
          </Box>
        </Flex>
      )}
      <EntrepriseInfoFields entreprise={organization} type={type} opco={opco ?? parseEnum(OPCOS, organization.opco)} />
    </Box>
  )
}

const EntrepriseInfoFields = ({ entreprise, type, opco }: { entreprise: IEntrepriseJson; type: typeof CFA | typeof ENTREPRISE; opco?: OPCOS }) => {
  const { address, enseigne: establishment_enseigne, raison_sociale: establishment_raison_sociale, siret: establishment_siret } = entreprise
  const RAISON_SOCIALE =
    establishment_raison_sociale && establishment_raison_sociale.length > 30 ? establishment_raison_sociale.substring(0, 30) + "..." : establishment_raison_sociale ?? ""
  const firstLineAddress = address
  return (
    <Stack direction="column" spacing={7}>
      <FieldWithValue
        title="SIRET"
        value={establishment_siret}
        tooltip={
          type === ENTREPRISE ? (
            <InfoPopover>
              La donnée “SIRET Organisme” provient de l’INSEE puis est déduite du SIREN. Si cette information est erronée, merci de leur signaler en suivant{" "}
              <Link textDecoration="underline" isExternal href="https://www.insee.fr/fr/information/2015441" aria-label="Accès au site de l'INSEE - nouvelle fenêtre">
                la marche à suivre. <ExternalLinkIcon mx="2px" />
              </Link>
            </InfoPopover>
          ) : (
            <InfoTooltip description="La donnée “SIRET Organisme”  provient des bases “Carif-Oref”. Si cette information est erronée, merci de le signaler au Carif-Oref de votre région." />
          )
        }
      />
      <FieldWithValue
        hideIfEmpty={true}
        title="Enseigne"
        value={establishment_enseigne}
        tooltip="La donnée “Enseigne” provient de l’INSEE puis est déduite du SIREN. Si cette information est erronée, merci de leur signaler."
      />
      <FieldWithValue
        hideIfEmpty={true}
        title="Raison sociale"
        value={RAISON_SOCIALE}
        tooltip="La donnée “Raison sociale” provient de l’INSEE puis est déduite du SIREN. Si cette information est erronée, merci de leur signaler."
      />
      <FieldWithValue
        hideIfEmpty={true}
        title="Adresse"
        value={firstLineAddress}
        tooltip="La donnée “Adresse” provient de l’INSEE puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler."
      />
      {/* {type !== AUTHTYPE.ENTREPRISE && (
        <FieldWithValue
          hideIfEmpty={true}
          title="Effectif"
          value={establishment_size}
          tooltip='La donnée "Effectif” provient de l’INSEE puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler.'
        />
      )} */}
      {type === ENTREPRISE && (
        <FieldWithValue
          title="Opco de référence"
          value={opco}
          tooltip='La donnée "Opco" provient de CFADOCK puis est déduite du SIRET. Si cette information est erronée, merci de nous contacter.'
        />
      )}
      {type === CFA && (
        <FieldWithValue
          title="Qualiopi"
          value={"OUI"}
          tooltip="La donnée 'Qualiopi' provient du Référentiel de l'ONISEP puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler."
        />
      )}
    </Stack>
  )
}

const FieldWithValue = ({ title, value, tooltip, hideIfEmpty = false }) => {
  if (hideIfEmpty && !value) {
    return null
  }
  return (
    <Flex align="center">
      <Text mr={3} minW="fit-content">
        {title} :
      </Text>
      {value ? (
        <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
          {value}
        </Text>
      ) : (
        <Text textTransform="uppercase" bg="#FFE9E9" textColor="#CE0500" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1}>
          Non identifié
        </Text>
      )}
      {tooltip && (typeof tooltip === "string" ? <InfoTooltip description={tooltip} /> : tooltip)}
    </Flex>
  )
}

export default InformationLegaleEntreprise
