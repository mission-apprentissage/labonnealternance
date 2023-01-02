import { Box, Button, Flex, Heading, Link, Stack, Text, useToast } from "@chakra-ui/react"
import dayjs from "dayjs"
import { AUTHTYPE } from "../common/contants"
import useAuth from "../common/hooks/useAuth"
import { Copy, InfoCircle } from "../theme/components/icons"
import InfoPopover from "./InfoPopover"
import InfoTooltip from "./InfoToolTip"

export default (props) => {
  const toast = useToast()
  const [auth] = useAuth()
  const { enseigne, raison_sociale, rue, siret, commune, code_postal, opco, tranche_effectif, date_creation_etablissement, type, adresse, qualiopi, idcc } = props

  console.log(props, opco)

  const RAISON_SOCIALE = raison_sociale.length > 30 ? raison_sociale.substring(0, 30) + "..." : raison_sociale ?? ""

  /**
   * @description Copy in clipboard.
   * @return {Promise<void>}
   */
  const copyInClipboard = (idcc) => {
    navigator.clipboard.writeText(idcc)
    toast({
      title: "IDCC copié.",
      position: "top-right",
      status: "success",
      duration: 3000,
    })
  }

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
            {siret}
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
        {enseigne && (
          <Flex align="center">
            <Text mr={3}>Enseigne :</Text>
            <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
              {enseigne}
            </Text>
            <InfoTooltip description="La donnée “Enseigne” provient de l’INSEE puis est déduite du SIREN. Si cette information est erronée, merci de leur signaler." />
          </Flex>
        )}
        <Flex align="center">
          <Text mr={3}>Raison sociale :</Text>
          <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
            {RAISON_SOCIALE}
          </Text>
          <InfoTooltip description="La donnée “Raison sociale” provient de l’INSEE puis est déduite du SIREN. Si cette information est erronée, merci de leur signaler." />
        </Flex>{" "}
        <Flex align="center">
          <Text mr={3}>Adresse :</Text>
          <Text bg="#F9F8F6" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1}>
            {rue ?? adresse}
          </Text>
          <InfoTooltip description="La donnée “Adresse” provient de l’INSEE puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler." />
        </Flex>{" "}
        {rue && (
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
              <InfoTooltip description="La donnée “Adresse” provient de l’INSEE puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler." />
            </Flex>
          </>
        )}
        {type !== AUTHTYPE.ENTREPRISE && tranche_effectif && (
          <Flex align="center">
            <Text mr={3}>Effectif :</Text>
            <Text bg="#F9F8F6" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1}>
              {tranche_effectif}
            </Text>
            <InfoTooltip description='La donnée "Effectif” provient de l’INSEE puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler.' />
          </Flex>
        )}
        {type !== AUTHTYPE.ENTREPRISE && (
          <Flex align="center">
            <Text mr={3}>Date de création :</Text>
            <Text bg="#F9F8F6" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1}>
              {dayjs(date_creation_etablissement).format("DD/MM/YYYY")}
            </Text>
            <InfoTooltip description='La donnée "Date de création" provient de l’INSEE puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler.' />
          </Flex>
        )}
        {type === AUTHTYPE.ENTREPRISE && (
          <Flex align="center">
            <Text mr={3}>IDCC :</Text>

            {idcc ? (
              <Text bg="#F9F8F6" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1} maxW="60%">
                {idcc}
              </Text>
            ) : (
              <Text textTransform="uppercase" bg="#FFE9E9" textColor="#CE0500" px="8px" py="2px" fontWeight={700} mr={2} noOfLines={1}>
                Non identifié
              </Text>
            )}

            <InfoTooltip description="La donnée IDCC (identifiant de la convention collective) provient de CFADOCK et est déduite du SIRET. Si cette information est erronée, merci de nous contacter" />
            {idcc && (
              <Button ml={3} type="submit" variant="secondary" leftIcon={<Copy width={5} />} onClick={() => copyInClipboard(idcc)}>
                Copier
              </Button>
            )}
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
            {qualiopi ? (
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
