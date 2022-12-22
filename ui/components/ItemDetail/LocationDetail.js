import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Flex, Image, Link, Text } from "@chakra-ui/react"
import { round } from "lodash"
import React from "react"
import { endsWithNumber } from "../../utils/strutils"
import { getCompanyPathLink, getPathLink } from "../../utils/tools"
import { string_wrapper as with_str } from "../../utils/wrapper_utils"

const LocationDetail = ({ item, isCfa }) => {
  const kind = item?.ideaType

  const getGoogleSearchParameters = () => {
    return encodeURIComponent(`${item.company.name} ${item.place.address}`)
  }

  let companySize = item?.company?.size?.toLowerCase()
  if (!companySize) {
    companySize = "non renseigné"
  } else if (companySize.startsWith("0")) {
    companySize = "0 à 9 salariés"
  }
  if (endsWithNumber(companySize)) {
    companySize += " salariés"
  }

  const getTitle = (oneItem) => {
    const oneKind = oneItem?.ideaType
    const isMandataire = item?.company?.mandataire
    let res = "Quelques informations sur l'entreprise"
    if (oneKind === "formation") {
      res = "Quelques informations sur le centre de formation"
    } else if (oneKind === "matcha" && !isMandataire) {
      res = "Quelques informations sur l'établissement"
    } else if (oneKind === "matcha" && isMandataire) {
      res = "Contactez le CFA pour avoir plus d'informations"
    }
    return res
  }

  const shouldDisplayEmail = (oneItem) => {
    let res = false
    const oneKind = oneItem?.ideaType
    if (oneKind === "matcha") {
      res = !!item?.company?.mandataire
    } else if (oneKind === "lbb" || oneKind === "lba") {
      res = false
    } else if (oneKind === "peJob") {
      res = false
    } else {
      res = !!item?.contact?.email && !item?.prdvUrl
    }
    if (res) {
      // au cas où : on n'affiche l'email que si il n'est pas chiffré
      res = with_str("@").in(item?.contact?.email)
    }
    return res
  }

  return (
    <>
      {kind === "matcha" && item?.company?.mandataire && (
        <Box pb="0px" mt={6} position="relative" background="white" padding={["1px 12px 50px 12px", "1px 24px 50px 24px", "1px 12px 24px 12px"]} mx={["0", "30px"]}>
          <Text as="h2" variant="itemDetailH2" mt={2}>
            {getTitle({})}
          </Text>

          <Box mt={2}>
            <strong>Taille de l&apos;entreprise :&nbsp;</strong> {companySize}
          </Box>
          <Box mt={2}>
            <strong>Secteur d&apos;activité :&nbsp;</strong> {item?.nafs[0]?.label}
          </Box>
          {item?.company?.creationDate && !isNaN(new Date(item.company.creationDate)) && (
            <Box mt={2}>
              <strong>Année de création de l&apos;entreprise :&nbsp;</strong> {new Date(item.company.creationDate).getFullYear()}
            </Box>
          )}

          <Box mt={3} color="grey.700">
            {item?.company?.place?.city}
          </Box>
          {item?.place?.distance && <Box fontSize="14px" color="grey.600">{`${round(item.place.distance, 1)} km(s) du lieu de recherche`}</Box>}

          <Flex mt={4} alignItems="center" direction="row">
            <Box width="30px" minWidth="30px" pl="1px" mr={2}>
              <Image mt="2px" mr={2} src="/images/icons/small_map_point.svg" alt="" />
            </Box>
            <Link isExternal variant="basicUnderlined" url={getCompanyPathLink(item)}>
              Obtenir l'itinéraire <ExternalLinkIcon mb="3px" ml="2px" />
            </Link>
          </Flex>
        </Box>
      )}

      <Box pb="0px" mt={6} position="relative" background="white" padding={["1px 12px 50px 12px", "1px 24px 50px 24px", "1px 12px 24px 12px"]} mx={["0", "30px"]}>
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

        {item?.place?.distance && !item?.company?.mandataire && <Box color="grey.600" fontSize="14px">{`${round(item.place.distance, 1)} km(s) du lieu de recherche`}</Box>}

        <Flex mt={4} alignItems="center" direction="row">
          <Box width="30px" minWidth="30px" pl="1px" mr={2}>
            <Image mt="2px" src="/images/icons/small_map_point.svg" alt="" />
          </Box>
          <Link isExternal variant="basicUnderlined" href={getPathLink(item)}>
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
              <Link ml="2px" isExternal variant="basicUnderlined" href={item?.company?.url}>
                {item?.company?.url} <ExternalLinkIcon mb="3px" ml="2px" />
              </Link>
            </Text>
          </Flex>
        )}

        {shouldDisplayEmail(item) && (
          <Flex alignItems="center" mt={2} direction="row">
            <Box width="30px" minWidth="30px" mr={2}>
              <Image mt="2px" src="/images/icons/small_email.svg" alt="" />
            </Box>
            <Link ml="2px" isExternal variant="basicUnderlined" href={`mailto:${item.contact.email}`}>
              {item.contact.email}
            </Link>
          </Flex>
        )}

        {item?.contact?.phone && (
          <Flex mt={2} mb={4}>
            <Box width="30px" pl="2px" minWidth="30px" mr={2}>
              <Image mt="2px" src="/images/icons/small_phone.svg" alt="" />
            </Box>
            <Link ml="2px" isExternal variant="basicUnderlined" href={`tel:${item.contact.phone}`}>
              {item.contact.phone}
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
                href="https://dinum-beta.didask.com/courses/demonstration/60abc18c075edf000065c987"
                aria-label="Lien vers des conseils pour préparer son premier contact avec un CFA"
              >
                Préparez votre premier contact avec un CFA&nbsp;
                <ExternalLinkIcon mb="3px" ml="2px" />
              </Link>
            </Box>
          </Box>
        )}

        {(kind === "matcha" || kind === "lbb" || kind === "lba") && (
          <>
            <Flex mt={2} mb={4}>
              <Box width="30px" pl="2px" minWidth="30px" mr={2}>
                <Image mt="2px" src="/images/info.svg" alt="A noter" />
              </Box>
              <Text as="span">
                En savoir plus sur
                <Link ml="2px" isExternal variant="basicUnderlined" href={`https://www.google.fr/search?q=${getGoogleSearchParameters()}`}>
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
