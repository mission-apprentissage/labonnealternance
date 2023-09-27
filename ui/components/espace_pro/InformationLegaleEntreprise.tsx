import { Box, Flex, Heading, Link, Stack, Text } from "@chakra-ui/react"

import { AUTHTYPE } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import { InfoCircle } from "../../theme/components/icons"

import InfoPopover from "./InfoPopover"
import InfoTooltip from "./InfoToolTip"

/**
 * KBA 20230511 : use address_detail field to display address information :
 * Migrate CFA entries in collection to have the same format as companies
 * Use the address API for all type of establishment
 */
export const InformationLegaleEntreprise = (props) => {
  const [auth] = useAuth()
  const { establishment_enseigne, establishment_raison_sociale, rue, establishment_siret, commune, code_postal, opco, establishment_size, type, address, is_qualiopi } = props
  const hasDetailedAddress = Boolean(rue)
  const firstLineAddress = rue ?? address

  const RAISON_SOCIALE =
    establishment_raison_sociale && establishment_raison_sociale.length > 30 ? establishment_raison_sociale.substring(0, 30) + "..." : establishment_raison_sociale ?? ""

  return (
    <Box border="1px solid #000091" p={5}>
      <Heading mb={3} fontSize="2xl">
        Informations légales
      </Heading>
      {RAISON_SOCIALE && auth.type !== AUTHTYPE.OPCO && (
        <Flex alignItems="flex-start" mb={10}>
          <InfoCircle mr={2} mt={1} />
          <Text>Vérifiez que les informations pré-remplies soient correctes avant de continuer.</Text>
        </Flex>
      )}
      {!RAISON_SOCIALE && (
        <Flex alignItems="flex-start" mb={10}>
          <InfoCircle mr={2} mt={1} />
          <Box>
            <Text mb={4}>Suite à un problème technique, nous ne sommes pas en mesure d’afficher votre raison sociale et l'adresse de votre établissement.</Text>
            <Text>Nous vous invitons à poursuivre votre parcours. Les informations de votre entreprise seront remplies automatiquement ultérieurement.</Text>
          </Box>
        </Flex>
      )}
      <Stack direction="column" spacing={7}>
        <FieldWithValue
          title="SIRET"
          value={establishment_siret}
          tooltip={
            type === AUTHTYPE.ENTREPRISE ? (
              <InfoPopover>
                La donnée “SIRET Organisme” provient de l’INSEE puis est déduite du SIREN. Si cette information est erronée, merci de leur signaler en suivant{" "}
                <Link textDecoration="underline" isExternal href="https://www.insee.fr/fr/information/2015441">
                  la marche à suivre.
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
        {hasDetailedAddress && (
          <>
            <FieldWithValue
              title="Code postal"
              value={code_postal}
              tooltip="La donnée “Code postal“ provient de l’INSEE puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler."
            />
            <FieldWithValue
              title="Commune"
              value={commune}
              tooltip="La donnée “Commune” provient de l’INSEE puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler."
            />
          </>
        )}
        {type !== AUTHTYPE.ENTREPRISE && establishment_size && (
          <Flex align="center">
            <Text mr={3}>Effectif :</Text>
            <Text bg="#F9F8F6" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1}>
              {establishment_size}
            </Text>
            <InfoTooltip description='La donnée "Effectif” provient de l’INSEE puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler.' />
          </Flex>
        )}
        {type !== AUTHTYPE.ENTREPRISE && (
          <FieldWithValue
            hideIfEmpty={true}
            title="Effectif"
            value={establishment_size}
            tooltip='La donnée "Effectif” provient de l’INSEE puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler.'
          />
        )}
        {type === AUTHTYPE.ENTREPRISE && (
          <FieldWithValue
            title="Opco de référence"
            value={opco}
            tooltip='La donnée "Opco" provient de CFADOCK puis est déduite du SIRET. Si cette information est erronée, merci de nous contacter.'
          />
        )}
        {type === AUTHTYPE.CFA && (
          <FieldWithValue
            title="Qualiopi"
            value={is_qualiopi ? "OUI" : "NON"}
            tooltip="La donnée 'Qualiopi' provient du Référentiel de l'ONISEP puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler."
          />
        )}
      </Stack>
    </Box>
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
