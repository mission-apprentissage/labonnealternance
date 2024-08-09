import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Flex, Image, Link, Text } from "@chakra-ui/react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { getCompanyPathLink, getPathLink } from "../../utils/tools"

import { getCompanyGoogleSearchLink } from "./ItemDetailServices/getCompanyGoogleSearchLink"
import { getCompanySize } from "./ItemDetailServices/getCompanySize"
import ItemDistanceToCenter from "./ItemDetailServices/ItemDistanceToCenter"

const LocationDetail = ({ item, isCfa }) => {
  const kind: LBA_ITEM_TYPE_OLD = item?.ideaType

  const companySize = getCompanySize(item)

  const getTitle = (oneItem) => {
    const oneKind = oneItem?.ideaType
    const isMandataire = oneItem?.company?.mandataire
    let res = "Quelques informations sur l'entreprise"
    if (oneKind === LBA_ITEM_TYPE_OLD.FORMATION) {
      res = "Quelques informations sur le centre de formation"
    } else if (oneKind === LBA_ITEM_TYPE_OLD.MATCHA && !isMandataire) {
      res = "Quelques informations sur l'établissement"
    } else if (oneKind === LBA_ITEM_TYPE_OLD.MATCHA && isMandataire) {
      res = "Contactez le CFA pour avoir plus d'informations"
    }
    return res
  }

  const companyPathLink = getCompanyPathLink(item)

  return (
    <>
      {kind === LBA_ITEM_TYPE_OLD.MATCHA && item?.company?.mandataire && (
        <Box pb="0px" mt={6} position="relative" background="white" padding="16px 24px" mx={["0", "30px"]}>
          <Text as="h2" variant="itemDetailH2" mt={2}>
            {getTitle({})}
          </Text>

          <Box mt={2}>
            <strong>Taille de l&apos;entreprise :&nbsp;</strong> {companySize}
          </Box>
          <Box mt={2}>
            <strong>Secteur d&apos;activité :&nbsp;</strong> {item?.nafs[0]?.label}
          </Box>

          <Box mt={3} color="grey.700">
            {item?.company?.place?.city}
          </Box>
          <ItemDistanceToCenter item={item} />

          {companyPathLink && (
            <Flex mt={4} alignItems="center" direction="row">
              <Box width="30px" minWidth="30px" pl="1px" mr={2}>
                <Image mt="2px" mr={2} src="/images/icons/small_map_point.svg" alt="" />
              </Box>
              <Link isExternal variant="basicUnderlined" href={companyPathLink} aria-label="Localisation sur google maps - nouvelle fenêtre">
                Obtenir l'itinéraire <ExternalLinkIcon mb="3px" ml="2px" />
              </Link>
            </Flex>
          )}
        </Box>
      )}

      <Box pb="0px" mt={6} position="relative" background="white" padding="16px 24px" mx={["0", "30px"]}>
        <Text as="h2" variant="itemDetailH2" mt={2}>
          {getTitle(item)}
        </Text>

        {item?.company?.mandataire && (
          <Box color="grey.700" mt={6}>
            Le centre de formation peut vous renseigner sur cette offre d’emploi ainsi que les formations qu’il propose.
          </Box>
        )}

        <Box color="grey.700" mt={6}>
          {item?.place?.fullAddress}
        </Box>

        {!item?.company?.mandataire && <ItemDistanceToCenter item={item} />}

        <Flex mt={4} alignItems="center" direction="row">
          <Box width="30px" minWidth="30px" pl="1px" mr={2}>
            <Image mt="2px" src="/images/icons/small_map_point.svg" alt="" />
          </Box>
          <Link isExternal variant="basicUnderlined" href={getPathLink(item)} aria-label="Localisation sur google maps - nouvelle fenêtre">
            Obtenir l'itinéraire <ExternalLinkIcon mb="3px" ml="2px" />
          </Link>
        </Flex>

        {item?.company?.url && (
          <Flex alignItems="center" mt={2} direction="row">
            <Box width="30px" minWidth="30px" mr={2}>
              <Image mt="2px" src="/images/icons/small_info.svg" alt="" />
            </Box>
            <Text as="span">
              En savoir plus sur
              <Link ml="2px" isExternal variant="basicUnderlined" href={item?.company?.url} aria-label="Site de l'entreprise - nouvelle fenêtre">
                {item?.company?.url} <ExternalLinkIcon mb="3px" ml="2px" />
              </Link>
            </Text>
          </Flex>
        )}

        {item?.contact?.phone && (
          <Flex mt={2} mb={4}>
            <Box fontWeight={700} pl="2px" mr={2}>
              Téléphone :
            </Box>
            <Link ml="2px" isExternal variant="basicUnderlined" href={`tel:${item.contact.phone}`} aria-label="Contacter par téléphone - nouvelle fenêtre">
              {item.contact.phone} <ExternalLinkIcon mx="2px" />
            </Link>
          </Flex>
        )}

        {isCfa && (
          <Box background="#f6f6f6" borderRadius="8px" mt={6} p={4}>
            <Flex alignItems="center" pt={1} pb={2}>
              <Image src="/images/info.svg" alt="" width="24px" height="24px" />
              <Text as="span" ml={2} fontWeight={700}>
                Cet établissement est un CFA d&apos;entreprise
              </Text>
            </Flex>
            <Text>
              La particularité ? Il s&apos;agit d&apos;une formule complète <strong>Emploi + Formation</strong> ! Cette formation vous intéresse ? La marche à suivre diffère selon
              le CFA d&apos;entreprise concerné :
            </Text>

            <Box mt={3}>
              &bull;{" "}
              <Text as="span" ml={4}>
                Commencez par vous inscrire à la formation pour accéder ensuite au contrat,
              </Text>
            </Box>
            <Box mt={2}>
              &bull;{" "}
              <Text as="span" ml={4}>
                Ou commencez par postuler à une offre d&apos;emploi pour être ensuite inscrit en formation.
              </Text>
            </Box>

            <Text>Prenez contact avec cet établissement ou consultez son site web pour en savoir + !</Text>

            <Box my={2}>
              Vous vous posez des questions sur votre orientation ou votre recherche d&apos;emploi ?&nbsp;
              <Link
                isExternal
                variant="basicUnderlined"
                href="https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987"
                aria-label="Lien vers des conseils pour préparer son premier contact avec un CFA - nouvelle fenêtre"
              >
                Préparez votre premier contact avec un CFA&nbsp;
                <ExternalLinkIcon mb="3px" ml="2px" />
              </Link>
            </Box>
          </Box>
        )}

        {[LBA_ITEM_TYPE_OLD.MATCHA, LBA_ITEM_TYPE_OLD.LBA].includes(kind) && (
          <>
            <Text fontStyle="italic" color="grey.425">
              Renseignez-vous sur l’entreprise, ses activités et ses valeurs pour préparer votre candidature. Vous pouvez rechercher leur site internet et leur présence sur les
              réseaux sociaux.
            </Text>
            <Flex mt={2} mb={4}>
              <Box width="30px" pl="2px" minWidth="30px" mr={2}>
                <Image mt="2px" src="/images/info.svg" alt="A noter" />
              </Box>
              <Text as="span">
                En savoir plus sur
                <Link ml="2px" isExternal variant="basicUnderlined" href={getCompanyGoogleSearchLink(item)} aria-label="Recherche de l'entreprise sur google.fr - nouvelle fenêtre">
                  {item.company.name} <ExternalLinkIcon mb="3px" ml="2px" />
                </Link>
              </Text>
            </Flex>
            <Box pl={10}>
              <Text fontSize="14px" fontStyle="italic" color="grey.500">
                Renseignez-vous sur l&apos;établissement pour préparer votre candidature
              </Text>
            </Box>
            {!item?.company?.mandataire && (
              <Box mt={4} mb={1}>
                <strong>Taille de l&apos;entreprise :&nbsp;</strong> {companySize}
              </Box>
            )}
          </>
        )}
      </Box>
    </>
  )
}

export default LocationDetail
