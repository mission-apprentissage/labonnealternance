import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { parseEnum } from "shared"
import { CFA, ENTREPRISE, OPCO, OPCOS_LABEL } from "shared/constants/recruteur"

import { FieldWithValue } from "@/app/(espace-pro)/_components/FieldWithValue"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { InfoTooltip } from "@/components/espace_pro"
import { BorderedBox } from "@/components/espace_pro/common/components/BorderedBox"
import { useAuth } from "@/context/UserContext"
import { InfoCircle } from "@/theme/components/icons"
import { getCfaInformation, getEntrepriseInformation } from "@/utils/api"

type InformationLegaleEntrepriseProps = { siret: string; type: typeof CFA | typeof ENTREPRISE; opco?: OPCOS_LABEL }

const InformationLegaleEntreprise = ({ siret, type, opco }: InformationLegaleEntrepriseProps) => {
  const { user } = useAuth()
  const entrepriseQuery = useQuery({
    queryKey: ["get-entreprise", siret],
    queryFn: () => getEntrepriseInformation(siret, { skipUpdate: true }),
    enabled: Boolean(siret && type === ENTREPRISE),
  })
  const cfaQuery = useQuery({
    queryKey: ["get-cfa-infos", siret],
    queryFn: () => getCfaInformation(siret),
    enabled: Boolean(siret && type === CFA),
  })
  const { isLoading } = type === ENTREPRISE ? entrepriseQuery : cfaQuery

  if (isLoading) return null

  const entreprise = type === ENTREPRISE && entrepriseQuery.data && "data" in entrepriseQuery.data && "siret" in entrepriseQuery.data.data && entrepriseQuery.data.data
  const finalOpco = opco ?? parseEnum(OPCOS_LABEL, entreprise?.opco)
  const cfa = type === CFA && "data" in cfaQuery.data && "siret" in cfaQuery.data.data && cfaQuery.data.data
  const raisonSociale = entreprise?.raison_sociale ?? cfa?.raison_sociale

  return (
    <BorderedBox>
      <Heading mb={3}>Informations légales</Heading>
      {raisonSociale && user?.type !== OPCO && (
        <Flex alignItems="flex-start" mb={4}>
          <InfoCircle mr={2} mt={1} />
          <Text>Vérifiez que les informations pré-remplies sont correctes avant de continuer.</Text>
        </Flex>
      )}
      {!raisonSociale && (
        <Flex alignItems="flex-start" mb={4}>
          <InfoCircle mr={2} mt={1} />
          <Box>
            <Text mb={4}>Suite à un problème technique, nous ne sommes pas en mesure d’afficher votre raison sociale et l'adresse de votre établissement.</Text>
            <Text>Nous vous invitons à poursuivre votre parcours. Les informations de votre entreprise seront remplies automatiquement ultérieurement.</Text>
          </Box>
        </Flex>
      )}
      <OrganizationInfoFields
        {...(type === CFA
          ? {
              siret: cfa.siret,
              establishment_enseigne: cfa.enseigne,
              establishment_raison_sociale: cfa.raison_sociale,
              address: cfa.address,
              type: CFA,
              is_qualiopi: true,
            }
          : {
              establishment_enseigne: entreprise?.enseigne,
              establishment_raison_sociale: entreprise?.raison_sociale,
              address: entreprise?.address,
              opco: finalOpco,
            })}
        type={type}
        siret={siret}
      />
    </BorderedBox>
  )
}

const OrganizationInfoFields = ({
  siret,
  establishment_enseigne,
  establishment_raison_sociale,
  address,
  type,
  is_qualiopi,
  opco,
}: {
  siret: string
  establishment_enseigne?: string
  establishment_raison_sociale?: string
  address?: string
  type: typeof CFA | typeof ENTREPRISE
  opco?: OPCOS_LABEL
  is_qualiopi?: boolean
}) => {
  const RAISON_SOCIALE =
    establishment_raison_sociale && establishment_raison_sociale.length > 30 ? establishment_raison_sociale.substring(0, 30) + "..." : (establishment_raison_sociale ?? "")
  const firstLineAddress = address
  return (
    <Stack direction="column" spacing={[3, 3, 3, 5]}>
      <FieldWithValue
        title="SIRET"
        value={siret}
        tooltip={
          type === ENTREPRISE ? (
            <InfoTooltip
              description={
                <>
                  La donnée “SIRET Organisme” provient de l’INSEE puis est déduite du SIREN. Si cette information est erronée, merci de leur signaler en suivant{" "}
                  <DsfrLink href="https://www.insee.fr/fr/information/2015441" aria-label="Accès au site de l'INSEE - nouvelle fenêtre">
                    la marche à suivre.
                  </DsfrLink>
                </>
              }
            />
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
          value={is_qualiopi ? "OUI" : "NON"}
          tooltip="La donnée 'Qualiopi' provient du Référentiel de l'ONISEP puis est déduite du SIRET. Si cette information est erronée, merci de leur signaler."
        />
      )}
    </Stack>
  )
}

export default InformationLegaleEntreprise
