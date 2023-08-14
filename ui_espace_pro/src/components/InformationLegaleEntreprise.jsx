import { Box, Flex, Heading, Link, Stack, Text } from "@chakra-ui/react"
import { AUTHTYPE } from "../common/contants"
import useAuth from "../common/hooks/useAuth"
import { InfoCircle } from "../theme/components/icons"
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
      {auth.type !== AUTHTYPE.OPCO && (
        <Flex alignItems="flex-start" mb={10}>
          <InfoCircle mr={2} mt={1} />
          <Text>Vérifiez que les informations pré-remplies soient correctes avant de continuer.</Text>
        </Flex>
      )}
      <Stack direction="column" spacing={7}>
        <Flex align="center">
          <Text mr={3}>SIRET :</Text>
          <Text bg="#F9F8F6" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1}>
            {establishment_siret}
          </Text>
          {type === AUTHTYPE.ENTREPRISE ? (
            <InfoPopover>
              La donnée “SIRET Organisme” provient de l’INSEE puis est déduite du SIREN. Si cette information est erronée, merci de leur signaler en suivant{" "}
              <Link textDecoration="underline" isExternal href="https://www.insee.fr/fr/information/2015441">
                la marche à suivre.
              </Link>
            </InfoPopover>
          ) : (
            <InfoTooltip description="La donnée “SIRET Organisme”  provient des bases “Carif-Oref”. Si cette information est erronée, merci de le signaler au Carif-Oref de votre région." />
          )}
        </Flex>
        {establishment_enseigne && (
          <Flex align="center">
            <Text mr={3}>Enseigne :</Text>
            <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
              {establishment_enseigne}
            </Text>
            <InfoTooltip description="La donnée “Enseigne” provient de l’INSEE puis est déduite du SIREN. Si cette information est erronée, merci de leur signaler." />
          </Flex>
        )}
        <Flex align="center">
          <Text mr={3}>Raison sociale :</Text>
          {establishment_raison_sociale ? (
            <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
              {RAISON_SOCIALE}
            </Text>
          ) : (
            <Text textTransform="uppercase" bg="#FFE9E9" textColor="#CE0500" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1}>
              Non identifié
            </Text>
          )}
          <InfoTooltip description="La donnée “Raison sociale” provient de l’INSEE puis est déduite du SIREN. Si cette information est erronée, merci de leur signaler." />
        </Flex>
        <Flex align="center">
          <Text mr={3}>Adresse :</Text>
          {firstLineAddress ? (
            <Text bg="#F9F8F6" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1}>
              {firstLineAddress}
            </Text>
          ) : (
            <Text textTransform="uppercase" bg="#FFE9E9" textColor="#CE0500" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1}>
              Non identifié
            </Text>
          )}
          <InfoTooltip description="La donnée “Adresse” provient de l’INSEE puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler." />
        </Flex>{" "}
        {hasDetailedAddress && (
          <>
            <Flex align="center">
              <Text mr={3}>Code postal :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1}>
                {code_postal}
              </Text>
              <InfoTooltip description="La donnée “Code postal“ provient de l’INSEE puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler." />
            </Flex>{" "}
            <Flex align="center">
              <Text mr={3}>Commune :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1}>
                {commune}
              </Text>
              <InfoTooltip description="La donnée “Commune” provient de l’INSEE puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler." />
            </Flex>
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
        {type === AUTHTYPE.ENTREPRISE && (
          <Flex align="center">
            <Text mr={3}>Opco de référence :</Text>

            {opco ? (
              <Text bg="#F9F8F6" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1} maxW="60%">
                {opco}
              </Text>
            ) : (
              <Text textTransform="uppercase" bg="#FFE9E9" textColor="#CE0500" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1}>
                Non identifié
              </Text>
            )}

            <InfoTooltip description='La donnée "Opco" provient de CFADOCK puis est déduite du SIRET. Si cette information est erronée, merci de nous contacter.' />
          </Flex>
        )}
        {type === AUTHTYPE.CFA && (
          <Flex align="center">
            <Text mr={3}>Qualiopi :</Text>
            {is_qualiopi ? (
              <Text bg="#F9F8F6" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1}>
                OUI
              </Text>
            ) : (
              <Text bg="#FFE9E9" textColor="#CE0500" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1}>
                NON
              </Text>
            )}
            <InfoTooltip description="La donnée 'Qualiopi' provient du Référentiel de l'ONISEP puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler." />
          </Flex>
        )}
      </Stack>
    </Box>
  )
}

export default InformationLegaleEntreprise
